import { describe, expect, it } from 'vitest';
import { readJson, writeJson } from './safe-storage';

const throwing = (): Storage => {
  throw new Error('blocked');
};

describe('safe-storage', () => {
  it('falls back when storage throws', () => {
    expect(readJson(throwing, 'k', 5)).toBe(5);
    expect(() => writeJson(throwing, 'k', 1)).not.toThrow();
  });

  it('falls back on corrupt JSON', () => {
    localStorage.setItem('bad', '{oops');
    expect(readJson(() => localStorage, 'bad', 'x')).toBe('x');
  });

  it('round-trips values', () => {
    writeJson(() => localStorage, 'ok', { a: 1 });
    expect(readJson(() => localStorage, 'ok', null)).toEqual({ a: 1 });
  });
});
