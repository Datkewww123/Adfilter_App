import type { NetworkRule, ParseResult, ResourceType } from '../types';
import { isProtectedHost } from '../whitelist';
import { extractPureDomain } from './android';

export const WK_MAX_RULES = 150_000;
const GENERIC_SELECTOR_CHUNK = 100;
const YOUTUBE_UNLESS = ['*youtube.com', '*youtu.be'];

export interface WkTrigger {
  'url-filter': string;
  'resource-type'?: string[];
  'load-type'?: string[];
  'load-context'?: string[];
  'unless-domain'?: string[];
  'if-domain'?: string[];
}

export interface WkRule {
  trigger: WkTrigger;
  action: { type: 'block' | 'ignore-previous-rules' | 'css-display-none'; selector?: string };
}

const WK_TYPE: Partial<Record<ResourceType, string>> = {
  script: 'script',
  image: 'image',
  stylesheet: 'style-sheet',
  xmlhttprequest: 'raw',
  media: 'media',
  font: 'font',
  websocket: 'raw',
  other: 'raw',
};

export function urlFilterToRegex(filter: string): string | null {
  let f = filter;
  let prefix = '';
  let suffix = '';
  if (f.startsWith('||')) {
    f = f.slice(2);
    prefix = '^[^:]+://+([^:/]+\\.)?';
  } else if (f.startsWith('|')) {
    f = f.slice(1);
    prefix = '^';
  }
  if (f.endsWith('|')) {
    f = f.slice(0, -1);
    suffix = '$';
  }
  let body = '';
  for (const ch of f) {
    if (ch === '*') body += '.*';
    else if (ch === '^') body += '[/:?&=]';
    else if ('\\.+?()[]{}$|'.includes(ch)) body += `\\${ch}`;
    else body += ch;
  }
  if (!body) return null;
  return prefix + body + suffix;
}

interface TypeGroup {
  types: string[];
  context?: string[];
}

function groupsFor(types: readonly ResourceType[]): TypeGroup[] {
  const groups: TypeGroup[] = [];
  const normal = [
    ...new Set(
      types
        .filter((t) => t !== 'sub_frame' && t !== 'main_frame')
        .map((t) => WK_TYPE[t])
        .filter((t): t is string => Boolean(t)),
    ),
  ];
  if (normal.length > 0) groups.push({ types: normal });

  const sub = types.includes('sub_frame');
  const main = types.includes('main_frame');
  if (sub && main) groups.push({ types: ['document'] });
  else if (sub) groups.push({ types: ['document'], context: ['child-frame'] });
  else if (main) groups.push({ types: ['document'], context: ['top-frame'] });
  return groups;
}

function ruleFor(r: NetworkRule): WkRule[] {
  if (r.action === 'block') {
    const pure = extractPureDomain(r.urlFilter);
    if (pure && isProtectedHost(pure)) return [];
  }
  const regex = urlFilterToRegex(r.urlFilter);
  if (!regex) return [];
  return groupsFor(r.resourceTypes).map((g) => {
    const trigger: WkTrigger = {
      'url-filter': regex,
      'resource-type': g.types,
      'unless-domain': YOUTUBE_UNLESS,
    };
    if (g.context) trigger['load-context'] = g.context;
    if (r.domainType === 'thirdParty') trigger['load-type'] = ['third-party'];
    if (r.domainType === 'firstParty') trigger['load-type'] = ['first-party'];
    return { trigger, action: { type: r.action === 'block' ? 'block' : 'ignore-previous-rules' } };
  });
}

function chunk<T>(items: readonly T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

export function buildIosRules(parsed: ParseResult): WkRule[] {
  const blocks: WkRule[] = [];
  const allows: WkRule[] = [];
  for (const r of parsed.network) {
    (r.action === 'block' ? blocks : allows).push(...ruleFor(r));
  }

  const cosmeticRules: WkRule[] = [];
  const generic = [
    ...new Set(parsed.cosmetic.filter((c) => c.domains.length === 0).map((c) => c.selector)),
  ];
  for (const part of chunk(generic, GENERIC_SELECTOR_CHUNK)) {
    cosmeticRules.push({
      trigger: { 'url-filter': '.*', 'unless-domain': YOUTUBE_UNLESS },
      action: { type: 'css-display-none', selector: part.join(', ') },
    });
  }

  const byDomain = new Map<string, Set<string>>();
  for (const c of parsed.cosmetic) {
    for (const d of c.domains) {
      if (isProtectedHost(d)) continue;
      const set = byDomain.get(d) ?? new Set<string>();
      set.add(c.selector);
      byDomain.set(d, set);
    }
  }
  for (const [domain, selectors] of [...byDomain.entries()].sort((a, b) =>
    a[0].localeCompare(b[0]),
  )) {
    for (const part of chunk([...selectors], GENERIC_SELECTOR_CHUNK)) {
      cosmeticRules.push({
        trigger: { 'url-filter': '.*', 'if-domain': [`*${domain}`] },
        action: { type: 'css-display-none', selector: part.join(', ') },
      });
    }
  }

  return [...blocks, ...allows, ...cosmeticRules];
}

export function chunkRules(rules: readonly WkRule[], max: number = WK_MAX_RULES): WkRule[][] {
  return chunk(rules, max);
}