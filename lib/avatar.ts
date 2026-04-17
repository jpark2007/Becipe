// lib/avatar.ts
// Deterministic avatar helpers shared across every avatar render site.
import { colors } from './theme';

/**
 * Turn a display name into 2 initials.
 * - "John Park" -> "JP"
 * - "Drew" -> "DR"
 * - "" / null -> "?"
 */
export function initialsFor(displayName: string | null | undefined): string {
  if (!displayName) return '?';
  const trimmed = displayName.trim();
  if (!trimmed) return '?';
  const parts = trimmed.split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  // Single word -> first two chars (or first char if length 1).
  return trimmed.slice(0, 2).toUpperCase();
}

function hashString(s: string): number {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = s.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

// User avatar palette (from lib/theme.ts)
const USER_COLORS = [
  colors.avJ,
  colors.avE,
  colors.avS,
  colors.avM,
  colors.avD,
] as const;

export function colorForUserId(id: string | null | undefined): string {
  if (!id) return colors.avS;
  return USER_COLORS[hashString(id) % USER_COLORS.length];
}

// Circle accent palette — sage/clay/ochre + their deep variants.
const CIRCLE_COLORS = [
  colors.sage,
  colors.clay,
  colors.ochre,
  colors.sageDeep,
  colors.clayDeep,
] as const;

export function colorForCircleId(id: string | null | undefined): string {
  if (!id) return colors.sage;
  return CIRCLE_COLORS[hashString(id) % CIRCLE_COLORS.length];
}
