// lib/palate.test.ts
import { matchScore, parsePalate, emptyPalate, PalateVector } from './palate';

describe('matchScore', () => {
  const a: PalateVector = { sweet: 20, spicy: 60, savory: 90, sour: 50, bitter: 30 };

  test('identical vectors → 100', () => {
    expect(matchScore(a, a)).toBe(100);
  });

  test('null inputs → null', () => {
    expect(matchScore(null, a)).toBeNull();
    expect(matchScore(a, null)).toBeNull();
    expect(matchScore(null, null)).toBeNull();
  });

  test('mean distance 20 → score 80', () => {
    const b: PalateVector = { sweet: 40, spicy: 80, savory: 70, sour: 30, bitter: 50 };
    // diffs: 20, 20, 20, 20, 20 → mean 20 → score 80
    expect(matchScore(a, b)).toBe(80);
  });

  test('clamps to 0..100', () => {
    const opp: PalateVector = { sweet: 100, spicy: 0, savory: 0, sour: 0, bitter: 100 };
    const score = matchScore(a, opp);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});

describe('parsePalate', () => {
  test('valid object → vector', () => {
    expect(parsePalate({ sweet: 1, spicy: 2, savory: 3, sour: 4, bitter: 5 }))
      .toEqual({ sweet: 1, spicy: 2, savory: 3, sour: 4, bitter: 5 });
  });

  test('null/undefined → null', () => {
    expect(parsePalate(null)).toBeNull();
    expect(parsePalate(undefined)).toBeNull();
  });

  test('missing axis → null', () => {
    expect(parsePalate({ sweet: 1, spicy: 2, savory: 3, sour: 4 })).toBeNull();
  });

  test('non-numeric axis → null', () => {
    expect(parsePalate({ sweet: '1', spicy: 2, savory: 3, sour: 4, bitter: 5 })).toBeNull();
  });
});
