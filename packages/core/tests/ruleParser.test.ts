import { describe, expect, it } from 'vitest';
import { stripAdFields } from '../src/adFields';
import { parseFilterLines } from '../src/ruleParser';

describe('ruleParser & adFields', () => {
  it('parses network block/allow, cosmetic rules, and rejects unsafe or forbidden selectors', () => {
    const raw = [
      '[Adblock Plus 2.0]',
      '! Comment',
      '||taboola.com^$third-party,script,image',
      '@@||trusted.taboola.com^$script',
      '||youtube.com/pagead/*',
      'truyenqq.com##.ads-banner',
      '##.global-floating-ad',
      '##body', // bị cấm theo Quy tắc 7
      'bad.com##div:has-text(Quảng cáo)',
      'evil.com##div { background: url(javascript:alert(1)) }',
    ];

    const res = parseFilterLines(raw);
    expect(res.network).toHaveLength(2);
    expect(res.network[0]).toMatchObject({
      action: 'block',
      urlFilter: '||taboola.com^',
      domainType: 'thirdParty',
      priority: 1,
      resourceTypes: ['script', 'image'],
    });
    expect(res.network[1]).toMatchObject({
      action: 'allow',
      urlFilter: '||trusted.taboola.com^',
      priority: 10,
    });
    expect(res.cosmetic).toEqual([
      { domains: ['truyenqq.com'], selector: '.ads-banner' },
      { domains: [], selector: '.global-floating-ad' },
    ]);
    expect(res.skipped).toBe(4);
  });

  it('strips ad fields from player JSON objects safely', () => {
    const payload = {
      videoDetails: { videoId: 'xyz' },
      adPlacements: [1],
      playerAds: [2],
      adBreaks: [3],
    };
    expect(stripAdFields(payload)).toEqual({ videoDetails: { videoId: 'xyz' } });
  });
});