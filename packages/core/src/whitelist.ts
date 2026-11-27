import { isDomainInList, normalizeHost } from './domainMatcher';

/**
 * Allowlist cứng: TUYỆT ĐỐI KHÔNG CHẶN các domain ngân hàng, thanh toán, đăng nhập
 * (tuân thủ Quy tắc 7 & Quy tắc 9 trong rule.md).
 */
export const PROTECTED_DOMAINS: readonly string[] = [
  // Ngân hàng Việt Nam
  'vietcombank.com.vn',
  'vietinbank.vn',
  'bidv.com.vn',
  'agribank.com.vn',
  'techcombank.com.vn',
  'mbbank.com.vn',
  'vpbank.com.vn',
  'acb.com.vn',
  'tpb.vn',
  'sacombank.com.vn',
  // Ví điện tử & Cổng thanh toán
  'paypal.com',
  'stripe.com',
  'momo.vn',
  'zalopay.vn',
  'vnpay.vn',
  // Định danh / Đăng nhập SSO
  'accounts.google.com',
  'login.microsoftonline.com',
  'login.live.com',
  'appleid.apple.com',
  'id.zalo.me',
];

export function isProtectedHost(host: string): boolean {
  return isDomainInList(host, PROTECTED_DOMAINS);
}

export function isUserWhitelisted(host: string, whitelist: readonly string[]): boolean {
  return isDomainInList(host, whitelist);
}

export function addToWhitelist(whitelist: readonly string[], domain: string): string[] {
  const d = normalizeHost(domain);
  const set = new Set(whitelist.map(normalizeHost));
  if (d) set.add(d);
  return [...set].sort();
}

export function removeFromWhitelist(whitelist: readonly string[], domain: string): string[] {
  const d = normalizeHost(domain);
  return whitelist
    .map(normalizeHost)
    .filter((x) => x !== d)
    .sort();
}