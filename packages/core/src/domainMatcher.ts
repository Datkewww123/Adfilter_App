export const YOUTUBE_EXCLUDED_DOMAINS = [
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'music.youtube.com',
  'youtu.be',
] as const;

export function normalizeHost(host: string): string {
  return host.trim().toLowerCase().replace(/\.$/, '');
}

export function extractHost(url: string): string | null {
  try {
    return normalizeHost(new URL(url).hostname);
  } catch {
    return null;
  }
}

/** Trả về true nếu host trùng domain hoặc là subdomain của domain. */
export function isSameOrSubdomain(host: string, domain: string): boolean {
  const h = normalizeHost(host);
  const d = normalizeHost(domain);
  if (!h || !d) return false;
  return h === d || h.endsWith(`.${d}`);
}

export function isDomainInList(host: string, list: readonly string[]): boolean {
  return list.some((d) => isSameOrSubdomain(host, d));
}

export function isYouTubeHost(host: string): boolean {
  const d = normalizeHost(host);
  return (
    d === 'youtube.com' ||
    d.endsWith('.youtube.com') ||
    d === 'youtu.be' ||
    d.endsWith('.googlevideo.com') ||
    d.endsWith('.ytimg.com')
  );
}

/**
 * Tập tên miền khớp theo hậu tố nhãn trong O(số nhãn):
 * thêm "exoclick.com" thì cả "exoclick.com" và "a.b.exoclick.com" đều khớp.
 */
export class DomainSet {
  private readonly items = new Set<string>();

  add(domain: string): void {
    const d = normalizeHost(domain);
    if (d) this.items.add(d);
  }

  get size(): number {
    return this.items.size;
  }

  has(host: string): boolean {
    let h = normalizeHost(host);
    while (h) {
      if (this.items.has(h)) return true;
      const dot = h.indexOf('.');
      if (dot === -1) return false;
      h = h.slice(dot + 1);
    }
    return false;
  }

  values(): string[] {
    return [...this.items].sort();
  }
}