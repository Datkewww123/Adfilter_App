import { describe, expect, it } from 'vitest';
import { version } from '../src/index';

describe('@adfilter/core bootstrap', () => {
  it('exports current version', () => {
    expect(version).toBe('0.1.0');
  });
});