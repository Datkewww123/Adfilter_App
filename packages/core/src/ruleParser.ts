import { isYouTubeHost } from './domainMatcher';
import type { CosmeticRule, NetworkRule, ParseResult, PartyType, ResourceType } from './types';

const RESOURCE_MAP: Record<string, ResourceType> = {
  script: 'script',
  image: 'image',
  stylesheet: 'stylesheet',
  css: 'stylesheet',
  xmlhttprequest: 'xmlhttprequest',
  xhr: 'xmlhttprequest',
  subdocument: 'sub_frame',
  frame: 'sub_frame',
  document: 'main_frame',
  main_frame: 'main_frame',
  media: 'media',
  font: 'font',
  websocket: 'websocket',
  other: 'other',
};

const DEFAULT_RESOURCE_TYPES: ResourceType[] = ['script', 'xmlhttprequest', 'sub_frame', 'image'];
const PROCEDURAL_MARKERS = [':has-text(', ':upward(', ':matches-css('];
const UNSAFE_CSS_SELECTOR = /[{}<>]|expression\s*\(|javascript:/i;
const FORBIDDEN_SELECTORS = new Set(['#movie_player', 'video', 'body', 'html']);
const YOUTUBE_URL_HOST =
  /(?:^|\|\||:\/\/|\.)(?:youtube\.com|youtu\.be|googlevideo\.com|ytimg\.com)(?:[\^/]|$)/i;

function isAscii(value: string): boolean {
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    if (code < 0x20 || code > 0x7e) return false;
  }
  return true;
}

/**
 * Phân tích danh sách dòng filter chuẩn ABP/uBO sang cấu trúc trung gian đa nền tảng.
 */
export function parseFilterLines(lines: readonly string[]): ParseResult {
  const network: NetworkRule[] = [];
  const cosmetic: CosmeticRule[] = [];
  const seenCosmetic = new Set<string>();
  let skipped = 0;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('!') || line.startsWith('[')) continue;

    if (line.includes('#@#')) {
      skipped++;
      continue;
    }

    const cosIdx = line.indexOf('##');
    if (cosIdx !== -1) {
      const selector = line.slice(cosIdx + 2).trim();
      const rawDomains = line.slice(0, cosIdx).trim();
      if (
        !selector ||
        FORBIDDEN_SELECTORS.has(selector.toLowerCase()) ||
        UNSAFE_CSS_SELECTOR.test(selector) ||
        PROCEDURAL_MARKERS.some((m) => selector.includes(m))
      ) {
        skipped++;
        continue;
      }

      const listed = rawDomains
        ? rawDomains
            .split(',')
            .map((s) => s.trim().toLowerCase())
            .filter(Boolean)
        : [];
      const included = listed.filter((d) => !d.startsWith('~'));
      const nonYt = included.filter((d) => !isYouTubeHost(d));
      if (included.length > 0 && nonYt.length === 0) {
        skipped++;
        continue;
      }

      const key = `${nonYt.join(',')}##${selector}`;
      if (!seenCosmetic.has(key)) {
        seenCosmetic.add(key);
        cosmetic.push({ domains: nonYt, selector });
      }
      continue;
    }

    const isAllow = line.startsWith('@@');
    const body = isAllow ? line.slice(2).trim() : line;
    const dollarIdx = body.lastIndexOf('$');
    const hasOptions = dollarIdx > 0 && !body.slice(dollarIdx + 1).includes('/');
    const urlFilter = (hasOptions ? body.slice(0, dollarIdx) : body).trim();
    const rawOpts = hasOptions ? body.slice(dollarIdx + 1).trim() : '';

    if (
      !urlFilter ||
      urlFilter.length < 4 ||
      (urlFilter.startsWith('/') && urlFilter.endsWith('/')) ||
      !isAscii(urlFilter) ||
      (!isAllow && YOUTUBE_URL_HOST.test(urlFilter))
    ) {
      skipped++;
      continue;
    }

    const resourceTypes: ResourceType[] = [];
    let domainType: PartyType | undefined;
    let priority = isAllow ? 10 : 1;

    for (const token of rawOpts
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)) {
      const mapped = RESOURCE_MAP[token];
      if (token === 'important' && !isAllow) priority = 4;
      else if (token === 'third-party' || token === '3p') domainType = 'thirdParty';
      else if (token === '~third-party' || token === 'first-party' || token === '1p') {
        domainType = 'firstParty';
      } else if (mapped && !resourceTypes.includes(mapped)) {
        resourceTypes.push(mapped);
      }
    }

    const rule: NetworkRule = {
      action: isAllow ? 'allow' : 'block',
      urlFilter,
      resourceTypes: resourceTypes.length > 0 ? resourceTypes : [...DEFAULT_RESOURCE_TYPES],
      priority,
    };
    if (domainType) rule.domainType = domainType;
    network.push(rule);
  }

  return { network, cosmetic, skipped };
}