// lib/palate.ts
export type PalateVector = {
  salt: number;
  sweet: number;
  umami: number;
  spice: number;
  acid: number;
};

export const PALATE_AXES: (keyof PalateVector)[] = [
  'salt', 'sweet', 'umami', 'spice', 'acid',
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
  return { salt: 50, sweet: 50, umami: 50, spice: 50, acid: 50 };
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
    salt:  o.salt  as number,
    sweet: o.sweet as number,
    umami: o.umami as number,
    spice: o.spice as number,
    acid:  o.acid  as number,
  };
}
