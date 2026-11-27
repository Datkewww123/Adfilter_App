import { DomainSet, isYouTubeHost } from '../domainMatcher';
import type { NetworkRule } from '../types';
import { isProtectedHost } from '../whitelist';

const PURE_DOMAIN = /^\|\|([a-z0-9][a-z0-9.-]*[a-z0-9])\^?$/i;

export function extractPureDomain(urlFilter: string): string | null {
  const m = PURE_DOMAIN.exec(urlFilter);
  const d = m?.[1];
  return d ? d.toLowerCase() : null;
}

export function buildAndroidBlocklist(rules: readonly NetworkRule[]): string[] {
  const allowed = new DomainSet();
  for (const r of rules) {
    if (r.action !== 'allow') continue;
    const d = extractPureDomain(r.urlFilter);
    if (d) allowed.add(d);
  }

  const candidates = new Set<string>();
  for (const r of rules) {
    if (r.action !== 'block') continue;
    const d = extractPureDomain(r.urlFilter);
    if (!d || !d.includes('.')) continue;
    if (isProtectedHost(d) || isYouTubeHost(d) || allowed.has(d)) continue;
    candidates.add(d);
  }

  const byDepth = [...candidates].sort(
    (a, b) => a.split('.').length - b.split('.').length || a.localeCompare(b),
  );
  const covered = new DomainSet();
  const out: string[] = [];
  for (const d of byDepth) {
    if (covered.has(d)) continue;
    covered.add(d);
    out.push(d);
  }
  return out.sort();
}

export function serializeAndroidBlocklist(domains: readonly string[], rulesVersion: string): string {
  const header = [
    '# AdFilter Android DNS Blocklist',
    `# rulesVersion: ${rulesVersion}`,
    `# domains: ${domains.length}`,
  ];
  return [...header, ...domains].join('\n') + '\n';
}