export const AD_PLAYER_FIELDS: readonly string[] = [
  'adPlacements',
  'playerAds',
  'adSlots',
  'adBreakParams',
  'adBreakHeartbeatParams',
  'adBreaks',
];

export const AD_PAGE_FIELDS: readonly string[] = ['adSlots', 'promotedSparklesWebRenderer'];

export function stripAdFields<T extends Record<string, unknown>>(
  obj: T,
  fields: readonly string[] = AD_PLAYER_FIELDS,
): T {
  if (obj == null || typeof obj !== 'object') return obj;
  for (const key of fields) {
    if (key in obj) {
      delete (obj as Record<string, unknown>)[key];
    }
  }
  return obj;
}