// lib/palate.test.ts
import { matchScore, parsePalate, emptyPalate, PalateVector } from './palate';

describe('matchScore', () => {
  const a: PalateVector = { salt: 80, sweet: 20, umami: 90, spice: 60, acid: 50 };

  test('identical vectors → 100', () => {
    expect(matchScore(a, a)).toBe(100);
  });

  test('null inputs → null', () => {
    expect(matchScore(null, a)).toBeNull();
    expect(matchScore(a, null)).toBeNull();
    expect(matchScore(null, null)).toBeNull();
  });

  test('mean distance 20 → score 80', () => {
    const b: PalateVector = { salt: 60, sweet: 40, umami: 70, spice: 80, acid: 30 };
    // diffs: 20, 20, 20, 20, 20 → mean 20 → score 80
    expect(matchScore(a, b)).toBe(80);
  });

  test('clamps to 0..100', () => {
    const opp: PalateVector = { salt: 0, sweet: 100, umami: 0, spice: 0, acid: 0 };
    const score = matchScore(a, opp);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});

describe('parsePalate', () => {
  test('valid object → vector', () => {
    expect(parsePalate({ salt: 1, sweet: 2, umami: 3, spice: 4, acid: 5 }))
      .toEqual({ salt: 1, sweet: 2, umami: 3, spice: 4, acid: 5 });
  });

  test('null/undefined → null', () => {
    expect(parsePalate(null)).toBeNull();
    expect(parsePalate(undefined)).toBeNull();
  });

  test('missing axis → null', () => {
    expect(parsePalate({ salt: 1, sweet: 2, umami: 3, spice: 4 })).toBeNull();
  });

  test('non-numeric axis → null', () => {
    expect(parsePalate({ salt: '1', sweet: 2, umami: 3, spice: 4, acid: 5 })).toBeNull();
  });
});
