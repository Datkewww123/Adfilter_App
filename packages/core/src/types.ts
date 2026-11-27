export type AdPhase = 'UNKNOWN' | 'NORMAL' | 'AD';

export interface Signals {
  t: number;
  playerFound: boolean;
  adShowing: boolean;
  adOverlay: boolean;
  adBadge: boolean;
  skipVisible: boolean;
  duration: number | null;
  currentTime: number | null;
  paused: boolean | null;
  muted?: boolean | null;
  playbackRate?: number | null;
  enforcement?: boolean;
  adBadgeText?: string | null;
}

export type ResourceType =
  | 'script'
  | 'image'
  | 'stylesheet'
  | 'xmlhttprequest'
  | 'sub_frame'
  | 'main_frame'
  | 'media'
  | 'font'
  | 'websocket'
  | 'other';

export type PartyType = 'firstParty' | 'thirdParty';

/** Luật chặn/cho phép mạng đã chuẩn hoá từ cú pháp ABP/uBO. */
export interface NetworkRule {
  action: 'block' | 'allow';
  urlFilter: string;
  resourceTypes: ResourceType[];
  domainType?: PartyType;
  /** allow = 10, important = 4, thường = 1 (giữ đúng độ ưu tiên của AdFilter). */
  priority: number;
}

/** Luật ẩn phần tử CSS (cosmetic). domains rỗng = áp dụng chung mọi trang. */
export interface CosmeticRule {
  domains: string[];
  selector: string;
}

export interface ParseResult {
  network: NetworkRule[];
  cosmetic: CosmeticRule[];
  skipped: number;
}