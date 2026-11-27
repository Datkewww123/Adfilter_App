import { describe, expect, it } from 'vitest';
import {
  DomainSet,
  extractHost,
  isDomainInList,
  isSameOrSubdomain,
  isYouTubeHost,
  normalizeHost,
} from '../src/domainMatcher';
import {
  addToWhitelist,
  isProtectedHost,
  isUserWhitelisted,
  removeFromWhitelist,
} from '../src/whitelist';

describe('domainMatcher', () => {
  it('normalizes hostnames and extracts host from URLs', () => {
    expect(normalizeHost('  Sub.Example.COM. ')).toBe('sub.example.com');
    expect(extractHost('https://Ads.Taboola.com:8443/path?a=1')).toBe('ads.taboola.com');
    expect(extractHost('not-a-url')).toBeNull();
  });

  it('matches exact domain and subdomains without false prefix matches', () => {
    expect(isSameOrSubdomain('taboola.com', 'taboola.com')).toBe(true);
    expect(isSameOrSubdomain('cdn.ads.taboola.com', 'taboola.com')).toBe(true);
    expect(isSameOrSubdomain('mytaboola.com', 'taboola.com')).toBe(false);
    expect(isDomainInList('api.criteo.com', ['outbrain.com', 'criteo.com'])).toBe(true);
  });

  it('identifies YouTube hosts accurately', () => {
    expect(isYouTubeHost('m.youtube.com')).toBe(true);
    expect(isYouTubeHost('youtu.be')).toBe(true);
    expect(isYouTubeHost('rr2---sn.googlevideo.com')).toBe(true);
    expect(isYouTubeHost('notyoutube.com')).toBe(false);
  });

  it('DomainSet matches registered domain and nested subdomains', () => {
    const set = new DomainSet();
    set.add('exoclick.com');
    expect(set.has('exoclick.com')).toBe(true);
    expect(set.has('a.b.c.exoclick.com')).toBe(true);
    expect(set.has('fakeexoclick.com')).toBe(false);
  });
});

describe('whitelist & protected domains', () => {
  it('protects banking, payment, and identity hosts', () => {
    expect(isProtectedHost('vcbdigibank.vietcombank.com.vn')).toBe(true);
    expect(isProtectedHost('momo.vn')).toBe(true);
    expect(isProtectedHost('accounts.google.com')).toBe(true);
    expect(isProtectedHost('ads.exoclick.com')).toBe(false);
  });

  it('adds and removes user whitelisted domains cleanly', () => {
    let list: string[] = [];
    list = addToWhitelist(list, 'VnExpress.net');
    list = addToWhitelist(list, 'vnexpress.net');
    expect(list).toEqual(['vnexpress.net']);
    expect(isUserWhitelisted('video.vnexpress.net', list)).toBe(true);
    list = removeFromWhitelist(list, 'vnexpress.net');
    expect(isUserWhitelisted('vnexpress.net', list)).toBe(false);
  });
});