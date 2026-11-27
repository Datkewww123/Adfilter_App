import type { AdPhase, Signals } from './types';

export interface AdCounter {
  index: number;
  total: number;
}

export function parseCounter(text: string | null | undefined): AdCounter | null {
  const m = text?.match(/([0-9]+)[^0-9]+([0-9]+)/);
  if (!m || !m[1] || !m[2]) return null;
  const index = Number(m[1]);
  const total = Number(m[2]);
  return index >= 1 && index <= total && total <= 10 ? { index, total } : null;
}

export interface DetectorState {
  phase: AdPhase;
  pendingSince: number | null;
}

export interface DetectorEvent {
  type: 'AD_START' | 'AD_END';
  at: number;
  emittedAt: number;
}

export const START_DEBOUNCE_MS = 150;
export const END_DEBOUNCE_MS = 400;

export interface DetectorConfig {
  startDebounceMs: number;
  endDebounceMs: number;
}

export const DEFAULT_DETECTOR_CONFIG: DetectorConfig = {
  startDebounceMs: START_DEBOUNCE_MS,
  endDebounceMs: END_DEBOUNCE_MS,
};

export const initialDetectorState: DetectorState = {
  phase: 'UNKNOWN',
  pendingSince: null,
};

export const scoreSignals = (s: Signals): number =>
  (s.adShowing ? 3 : 0) + (s.adOverlay ? 2 : 0) + (s.adBadge ? 1 : 0);

export const looksLikeAd = (s: Signals): boolean => s.playerFound && scoreSignals(s) >= 3;

function confirm(pendingSince: number | null, now: number, active: boolean, ms: number) {
  if (!active) return { pendingSince: null, confirmed: false, since: now };
  const since = pendingSince ?? now;
  return { pendingSince: since, confirmed: now - since >= ms, since };
}

export function stepDetector(
  prev: DetectorState,
  s: Signals,
  cfg: DetectorConfig = DEFAULT_DETECTOR_CONFIG,
): { next: DetectorState; events: DetectorEvent[] } {
  const ad = looksLikeAd(s);

  switch (prev.phase) {
    case 'UNKNOWN': {
      if (!s.playerFound) return { next: prev, events: [] };
      if (ad) {
        return {
          next: { phase: 'AD', pendingSince: null },
          events: [{ type: 'AD_START', at: s.t, emittedAt: s.t }],
        };
      }
      return { next: { phase: 'NORMAL', pendingSince: null }, events: [] };
    }

    case 'NORMAL': {
      const c = confirm(prev.pendingSince, s.t, ad, cfg.startDebounceMs);
      if (c.confirmed) {
        return {
          next: { phase: 'AD', pendingSince: null },
          events: [{ type: 'AD_START', at: c.since, emittedAt: s.t }],
        };
      }
      return { next: { phase: 'NORMAL', pendingSince: c.pendingSince }, events: [] };
    }

    case 'AD': {
      const c = confirm(prev.pendingSince, s.t, !ad, cfg.endDebounceMs);
      if (c.confirmed) {
        return {
          next: { phase: 'NORMAL', pendingSince: null },
          events: [{ type: 'AD_END', at: c.since, emittedAt: s.t }],
        };
      }
      return { next: { phase: 'AD', pendingSince: c.pendingSince }, events: [] };
    }
  }
}

export function runDetector(
  frames: readonly Signals[],
  cfg: DetectorConfig = DEFAULT_DETECTOR_CONFIG,
): DetectorEvent[] {
  let state = initialDetectorState;
  const out: DetectorEvent[] = [];
  for (const f of frames) {
    const r = stepDetector(state, f, cfg);
    state = r.next;
    out.push(...r.events);
  }
  return out;
}

export type AdKind = 'SKIPPABLE' | 'NON_SKIPPABLE' | 'SEQUENCE' | 'UNKNOWN';

export interface AdObservation {
  startedAt: number;
  lastSeenAt: number;
  ended: boolean;
  skipSeen: boolean;
  maxDuration: number | null;
  counter: AdCounter | null;
}

export const newObservation = (startedAt: number): AdObservation => ({
  startedAt,
  lastSeenAt: startedAt,
  ended: false,
  skipSeen: false,
  maxDuration: null,
  counter: null,
});

export function observeAd(prev: AdObservation, s: Signals): AdObservation {
  return {
    ...prev,
    lastSeenAt: s.t,
    skipSeen: prev.skipSeen || s.skipVisible,
    maxDuration:
      s.duration !== null ? Math.max(prev.maxDuration ?? 0, s.duration) : prev.maxDuration,
    counter: parseCounter(s.adBadgeText) ?? prev.counter,
  };
}

export const endObservation = (o: AdObservation, at: number): AdObservation => ({
  ...o,
  ended: true,
  lastSeenAt: at,
});

export function classifyAd(o: AdObservation): { kind: AdKind; confidence: number } {
  if (o.counter && o.counter.total > 1) return { kind: 'SEQUENCE', confidence: 0.9 };
  if (o.skipSeen) return { kind: 'SKIPPABLE', confidence: 0.95 };
  if (o.ended) return { kind: 'NON_SKIPPABLE', confidence: 0.7 };
  return { kind: 'UNKNOWN', confidence: 0.3 };
}