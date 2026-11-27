import { describe, expect, it } from 'vitest';
import { buildAndroidBlocklist, serializeAndroidBlocklist } from '../src/compile/android';
import { buildIosRules, chunkRules, urlFilterToRegex } from '../src/compile/ios';
import { parseFilterLines } from '../src/ruleParser';
import { isProtectedHost } from '../src/whitelist';

describe('mobile rule compilers (Android + iOS)', () => {
  const sample = [
    '||taboola.com^$third-party',
    '||cdn.taboola.com^$third-party',
    '||exoclick.com^$document,script',
    '||vietcombank.com.vn^', // phải bị chặn bởi allowlist cứng
    '||allowed.net^',
    '@@||allowed.net^',
    '*/api/widget/*$script,xmlhttprequest',
    '##.floating-banner-ad',
    'truyenqq.com##.top-banner',
  ];

  it('builds deduplicated, protected-safe Android DNS domain list', () => {
    const parsed = parseFilterLines(sample);
    const domains = buildAndroidBlocklist(parsed.network);
    expect(domains).toEqual(['exoclick.com', 'taboola.com']);
    expect(domains.some((d) => isProtectedHost(d))).toBe(false);

    const txt = serializeAndroidBlocklist(domains, '2026-11-27');
    expect(txt).toContain('# rulesVersion: 2026-11-27');
    expect(txt).toContain('taboola.com\n');
  });

  it('builds ordered iOS WKContentRuleList JSON and respects protected hosts', () => {
    expect(urlFilterToRegex('||taboola.com^')).toBe('^[^:]+://+([^:/]+\\.)?taboola\\.com[/:?&=]');
    const parsed = parseFilterLines(sample);
    const rules = buildIosRules(parsed);

    expect(JSON.stringify(rules)).not.toContain('vietcombank');

    const actions = rules.map((r) => r.action.type);
    const lastBlock = actions.lastIndexOf('block');
    const firstAllow = actions.indexOf('ignore-previous-rules');
    const firstCosmetic = actions.indexOf('css-display-none');
    expect(lastBlock).toBeLessThan(firstAllow);
    expect(firstAllow).toBeLessThan(firstCosmetic);

    const chunks = chunkRules(rules, 3);
    expect(chunks.every((c) => c.length <= 3)).toBe(true);
  });
});