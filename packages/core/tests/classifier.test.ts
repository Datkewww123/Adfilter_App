import { describe, expect, it } from 'vitest';
import {
  classifyAd,
  endObservation,
  newObservation,
  observeAd,
  parseCounter,
  runDetector,
} from '../src/classifier';
import type { Signals } from '../src/types';

function makeSignal(overrides: Partial<Signals> & { t: number }): Signals {
  return {
    playerFound: true,
    adShowing: false,
    adOverlay: false,
    adBadge: false,
    skipVisible: false,
    duration: 120,
    currentTime: 0,
    paused: false,
    ...overrides,
  };
}

describe('detector & classifier state machine', () => {
  it('debounces AD_START (150ms) and AD_END (400ms)', () => {
    const frames: Signals[] = [
      makeSignal({ t: 0 }),
      makeSignal({ t: 100, adShowing: true }),
      makeSignal({ t: 260, adShowing: true }),
      makeSignal({ t: 400, adShowing: false }),
      makeSignal({ t: 820, adShowing: false }),
    ];
    expect(runDetector(frames)).toEqual([
      { type: 'AD_START', at: 100, emittedAt: 260 },
      { type: 'AD_END', at: 400, emittedAt: 820 },
    ]);
  });

  it('parses ad counters and classifies SEQUENCE / SKIPPABLE / NON_SKIPPABLE', () => {
    expect(parseCounter('Quảng cáo 1 / 2')).toEqual({ index: 1, total: 2 });
    expect(parseCounter('99 / 100')).toBeNull();

    let seq = newObservation(0);
    seq = observeAd(seq, makeSignal({ t: 100, skipVisible: true, adBadgeText: '1 of 2' }));
    expect(classifyAd(seq)).toEqual({ kind: 'SEQUENCE', confidence: 0.9 });

    let skip = newObservation(0);
    skip = observeAd(skip, makeSignal({ t: 100, skipVisible: true }));
    expect(classifyAd(skip)).toEqual({ kind: 'SKIPPABLE', confidence: 0.95 });

    let nonSkip = newObservation(0);
    nonSkip = endObservation(nonSkip, 6000);
    expect(classifyAd(nonSkip)).toEqual({ kind: 'NON_SKIPPABLE', confidence: 0.7 });
  });
});