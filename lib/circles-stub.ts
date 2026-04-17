// lib/circles-stub.ts
// Mock circles data. Real schema is Future Work.
// Every circle surface reads from here until the backend lands.

export type StubRitual = {
  name: string;
  posted: number;
  total: number;
  endsAt: string; // ISO date
};

export type StubCircle = {
  id: string;
  name: string;
  memberCount: number;
  ritual: StubRitual | null;
  isAdmin: boolean;
};

export const STUB_CIRCLES: StubCircle[] = [
  {
    id: 'c1',
    name: 'The Dinner Group',
    memberCount: 4,
    ritual: { name: 'Sour & Bright', posted: 3, total: 4, endsAt: '2026-04-19' },
    isAdmin: true,
  },
  {
    id: 'c2',
    name: 'College Friends',
    memberCount: 6,
    ritual: { name: 'One-Pan Wonders', posted: 2, total: 6, endsAt: '2026-04-20' },
    isAdmin: false,
  },
  {
    id: 'c3',
    name: 'Weeknight Crew',
    memberCount: 3,
    ritual: null,
    isAdmin: true,
  },
];

export function getStubCircles(): StubCircle[] {
  return STUB_CIRCLES;
}

export function getStubCircle(id: string): StubCircle | undefined {
  return STUB_CIRCLES.find((c) => c.id === id);
}

/**
 * Sort circles by ritual end date ascending (soonest first).
 * Circles without rituals sink to the bottom.
 */
export function sortCirclesByRitualEnding(circles: StubCircle[]): StubCircle[] {
  return [...circles].sort((a, b) => {
    if (!a.ritual && !b.ritual) return 0;
    if (!a.ritual) return 1;
    if (!b.ritual) return -1;
    return a.ritual.endsAt.localeCompare(b.ritual.endsAt);
  });
}
