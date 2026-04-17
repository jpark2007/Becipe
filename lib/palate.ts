// lib/palate.ts
export type PalateVector = {
  sweet: number;
  spicy: number;
  savory: number;
  sour: number;
  bitter: number;
};

export const PALATE_AXES: (keyof PalateVector)[] = [
  'sweet', 'spicy', 'savory', 'sour', 'bitter',
];

/**
 * Match score between a user palate and a recipe palate.
 * Returns 0-100. 100 = perfect match.
 *
 * Algorithm: mean axis distance, inverted.
 *   For each axis, distance = |user - recipe|
 *   meanDistance = sum / 5
 *   match = 100 - meanDistance
 *
 * This is intentionally simple. We can swap it for cosine similarity
 * or weighted axes later without changing call sites.
 */
export function matchScore(
  user: PalateVector | null | undefined,
  recipe: PalateVector | null | undefined,
): number | null {
  if (!user || !recipe) return null;
  const total = PALATE_AXES.reduce((sum, axis) => {
    return sum + Math.abs(user[axis] - recipe[axis]);
  }, 0);
  const meanDistance = total / PALATE_AXES.length;
  return Math.max(0, Math.min(100, Math.round(100 - meanDistance)));
}

export function emptyPalate(): PalateVector {
  return { sweet: 50, spicy: 50, savory: 50, sour: 50, bitter: 50 };
}

/**
 * Runtime guard for jsonb -> PalateVector. Use at every callsite that reads
 * palate_vector from Supabase, since database.types.ts types jsonb as `Json`
 * which is too wide. Returns null if the shape doesn't match — callers should
 * fall back to "no match score".
 */
export function parsePalate(v: unknown): PalateVector | null {
  if (!v || typeof v !== 'object') return null;
  const o = v as Record<string, unknown>;
  for (const ax of PALATE_AXES) {
    if (typeof o[ax] !== 'number') return null;
  }
  return {
    sweet:  o.sweet  as number,
    spicy:  o.spicy  as number,
    savory: o.savory as number,
    sour:   o.sour   as number,
    bitter: o.bitter as number,
  };
}
