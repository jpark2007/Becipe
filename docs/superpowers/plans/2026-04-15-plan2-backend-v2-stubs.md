# Plan 2 — Backend for v2 Stubs

**Date:** 2026-04-15
**Branch:** `ak-ui-v2` (or a new branch off it — implementer can choose)
**Run in:** a new chat. Requires Supabase access. Implementer writes SQL; Drew runs it in the dashboard.

## Context

The v2 redesign (commits `aa1f0a91`–`c7102f51`) shipped UI for circles, fridge, queue, friends, and drafts using stubs and local storage. This plan replaces the stubs with real Supabase schemas + queries. No UI redesign — same surfaces, real data behind them.

**Prerequisite:** Plan 1 (UI polish round 2) should land first so the surfaces are final before wiring real data. Optional but recommended.

## Scope — what gets real data

| Feature | Current state | Becomes |
|---------|---------------|---------|
| Circles | `lib/circles-stub.ts` mock | Real tables + queries |
| Fridge | AsyncStorage via `lib/fridge-store.ts` | `user_fridge` table, multi-device |
| Queue | Works (uses existing `saved_recipes`) | Verify + polish optimistic UI |
| Friends blocking | Empty stub | Real column on `follows` |
| People search | Live-ish (verify) | Confirmed wired, polish |
| Drafts | Works (uses `is_public`) | Verify + draft-list query tightened |

## Out of scope

- Voice real STT (Plan 3)
- Ask Julian AI (deferred — removed from plan set; no LLM work until monetization lands)
- Baking support (Plan 5)
- Push notifications, analytics
- Circle invitations by phone/email (v1 is username-only)

---

## Migrations (to run in Supabase dashboard, in order)

### Migration 008 — circles

**File:** `supabase/migrations/008_circles.sql`

```sql
-- circles: a named group of users with a shared cooking practice
create table if not exists circles (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  description   text,
  created_by    uuid not null references profiles(id) on delete cascade,
  created_at    timestamptz default now() not null
);

alter table circles enable row level security;

-- member linkage
create table if not exists circle_members (
  id           uuid primary key default gen_random_uuid(),
  circle_id    uuid not null references circles(id) on delete cascade,
  user_id      uuid not null references profiles(id) on delete cascade,
  role         text not null default 'member' check (role in ('admin', 'member')),
  joined_at    timestamptz default now() not null,
  unique(circle_id, user_id)
);

alter table circle_members enable row level security;

-- this week's cooking prompt for each circle
create table if not exists circle_rituals (
  id           uuid primary key default gen_random_uuid(),
  circle_id    uuid not null references circles(id) on delete cascade,
  name         text not null,
  description  text,
  starts_at    timestamptz default now() not null,
  ends_at      timestamptz not null,
  created_by   uuid not null references profiles(id) on delete cascade,
  created_at   timestamptz default now() not null
);

alter table circle_rituals enable row level security;

-- a post made to a ritual (links to a recipe_try)
create table if not exists circle_ritual_posts (
  id           uuid primary key default gen_random_uuid(),
  ritual_id    uuid not null references circle_rituals(id) on delete cascade,
  try_id       uuid not null references recipe_tries(id) on delete cascade,
  posted_at    timestamptz default now() not null,
  unique(ritual_id, try_id)
);

alter table circle_ritual_posts enable row level security;

-- ── RLS ──

-- anyone can read a circle they're a member of
create policy "members can read their circles"
  on circles for select
  using (
    exists (
      select 1 from circle_members
      where circle_members.circle_id = circles.id
      and circle_members.user_id = auth.uid()
    )
  );

-- creator can insert
create policy "users can create circles"
  on circles for insert
  with check (created_by = auth.uid());

-- admins can update / delete
create policy "admins can update their circles"
  on circles for update
  using (
    exists (
      select 1 from circle_members
      where circle_members.circle_id = circles.id
      and circle_members.user_id = auth.uid()
      and circle_members.role = 'admin'
    )
  );

-- members can read member list of their circles
create policy "members can read member list"
  on circle_members for select
  using (
    exists (
      select 1 from circle_members cm
      where cm.circle_id = circle_members.circle_id
      and cm.user_id = auth.uid()
    )
  );

-- admins can insert/delete members
create policy "admins can manage members"
  on circle_members for all
  using (
    exists (
      select 1 from circle_members cm
      where cm.circle_id = circle_members.circle_id
      and cm.user_id = auth.uid()
      and cm.role = 'admin'
    )
  );

-- trigger: creator is auto-added as admin
create or replace function add_creator_as_admin()
returns trigger language plpgsql security definer as $$
begin
  insert into circle_members (circle_id, user_id, role)
  values (new.id, new.created_by, 'admin');
  return new;
end;
$$;

create trigger on_circle_created
  after insert on circles
  for each row execute function add_creator_as_admin();

-- rituals: readable by members, writable by admins
create policy "members can read rituals"
  on circle_rituals for select
  using (
    exists (
      select 1 from circle_members
      where circle_members.circle_id = circle_rituals.circle_id
      and circle_members.user_id = auth.uid()
    )
  );

create policy "admins can write rituals"
  on circle_rituals for all
  using (
    exists (
      select 1 from circle_members
      where circle_members.circle_id = circle_rituals.circle_id
      and circle_members.user_id = auth.uid()
      and circle_members.role = 'admin'
    )
  );

-- ritual posts: readable by members, writable by any member (the post author)
create policy "members can read ritual posts"
  on circle_ritual_posts for select
  using (
    exists (
      select 1 from circle_rituals r
      join circle_members m on m.circle_id = r.circle_id
      where r.id = circle_ritual_posts.ritual_id
      and m.user_id = auth.uid()
    )
  );

create policy "members can post to rituals"
  on circle_ritual_posts for insert
  with check (
    exists (
      select 1 from circle_rituals r
      join circle_members m on m.circle_id = r.circle_id
      where r.id = ritual_id
      and m.user_id = auth.uid()
    )
  );
```

**Drew runs this in Supabase SQL editor.** Before running, verify `auth.uid()` works in your RLS context (standard for Supabase).

### Migration 009 — user_fridge

**File:** `supabase/migrations/009_user_fridge.sql`

```sql
create table if not exists user_fridge (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references profiles(id) on delete cascade,
  ingredient     text not null,
  added_at       timestamptz default now() not null,
  unique(user_id, ingredient)
);

alter table user_fridge enable row level security;

create policy "users read own fridge"
  on user_fridge for select
  using (user_id = auth.uid());

create policy "users manage own fridge"
  on user_fridge for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
```

### Migration 010 — follows blocking

**File:** `supabase/migrations/010_follows_blocking.sql`

```sql
-- Add a status column to follows to support blocking.
-- 'active' = normal follow relationship
-- 'blocked' = the follower_id is blocked by the following_id
alter table follows
  add column if not exists status text not null default 'active'
  check (status in ('active', 'blocked'));

-- Blocking semantics:
-- If user A blocks user B, we insert a row: follower_id=B, following_id=A, status='blocked'
-- This lets us query blocked relationships with the same table without a new table.

-- Index for blocked lookups
create index if not exists follows_status_idx on follows(status) where status = 'blocked';
```

**Alternative considered:** separate `follows_blocks` table. Rejected because the semantics overlap enough that one table is simpler, and the RLS policies are easier to write.

---

## Code changes — queries and consumers

### Circles: replace stub with real queries

**New file:** `lib/circles-queries.ts`

```ts
import { supabase } from './supabase';

export type Circle = {
  id: string;
  name: string;
  description: string | null;
  memberCount: number;
  ritual: { id: string; name: string; endsAt: string; postCount: number; memberCount: number } | null;
  isAdmin: boolean;
};

export async function fetchMyCircles(userId: string): Promise<Circle[]> {
  // Query: circles the user is a member of, with latest active ritual, member count, and post count
  // Join circles → circle_members (filter by user) → circle_rituals (latest not-ended) → count posts
  // Complex single query or multi-step fetch — implementer picks
}

export async function fetchCircle(circleId: string): Promise<Circle | null>;
export async function fetchCircleMembers(circleId: string): Promise<Profile[]>;
export async function createCircle(name: string, description?: string): Promise<Circle>;
export async function inviteToCircle(circleId: string, userId: string): Promise<void>;
export async function removeFromCircle(circleId: string, userId: string): Promise<void>;
export async function createRitual(circleId: string, name: string, description: string, endsAt: Date): Promise<void>;
export async function postToRitual(ritualId: string, tryId: string): Promise<void>;
```

**Delete:** `lib/circles-stub.ts` (or keep it around for development — but default imports should point at `circles-queries.ts`).

**Consumers to rewire:**
- `app/(tabs)/feed.tsx` — circle row at top reads from `fetchMyCircles(user.id)` via react-query
- `app/(tabs)/profile.tsx` — Your Circles section reads from `fetchMyCircles`
- `app/circle/[id].tsx` — reads from `fetchCircle(id)` + `fetchCircleMembers(id)`

**Loading + error states:** use react-query's standard patterns, same shape as existing queries in `feed.tsx`.

### Fridge: replace AsyncStorage with Supabase

**File:** `lib/fridge-store.ts` — replace the whole file with Supabase-backed functions. Keep the exported function signatures identical (`getFridge`, `addToFridge`, `removeFromFridge`, `clearFridge`) so `app/fridge.tsx` needs minimal changes.

```ts
export async function getFridge(userId: string): Promise<FridgeItem[]> {
  const { data, error } = await supabase
    .from('user_fridge')
    .select('ingredient, added_at')
    .eq('user_id', userId)
    .order('added_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(r => ({ name: r.ingredient, addedAt: r.added_at }));
}

// etc for the other three functions
```

**Migration plan for existing users:** any user who already has AsyncStorage fridge data will lose it on update. Acceptable — the stub was device-local and pre-launch.

### Queue: verify + optimistic UI

**Verify first:** Queue already uses `saved_recipes` — confirm the Kitchen tab queue query and the recipe detail save button both work end-to-end.

**Polish:** add optimistic updates to the save mutation in `app/recipe/[id]/index.tsx` — invalidate `['kitchen-queue', user.id]` on success so the Kitchen tab reflects the new item immediately. Currently the spec doesn't have this invalidation and the queue won't refresh until Drew navigates away and back.

```tsx
const saveMutation = useMutation({
  mutationFn: async () => { /* existing */ },
  onSuccess: () => {
    setIsSaved(true);
    queryClient.invalidateQueries({ queryKey: ['kitchen-queue', user?.id] });
    // existing alert
  },
});
```

### Friends blocking — real queries

**File:** `app/friends.tsx` (from Plan 1) gets real Blocked data.

```ts
async function fetchBlocked(userId: string) {
  const { data } = await supabase
    .from('follows')
    .select('follower:profiles!follower_id(id, display_name, username, avatar_url)')
    .eq('following_id', userId)
    .eq('status', 'blocked');
  return (data ?? []).map((row: any) => row.follower).filter((p: any) => !!p?.id);
}

async function blockUser(blockerId: string, targetId: string) {
  // Insert a "blocked" follow row. Blocker is the "following" side, target is the "follower" side.
  // This feels backwards but matches the existing follows table shape.
  await supabase.from('follows').upsert({
    follower_id: targetId,
    following_id: blockerId,
    status: 'blocked',
  }, { onConflict: 'follower_id,following_id' });
}

async function unblockUser(blockerId: string, targetId: string) {
  await supabase.from('follows')
    .delete()
    .eq('follower_id', targetId)
    .eq('following_id', blockerId)
    .eq('status', 'blocked');
}
```

**Filter blocked users out of feeds and search:**
- `app/(tabs)/feed.tsx` — following feed query filter: exclude posts where actor is in your blocked list
- `app/people-search.tsx` — exclude blocked users from search results
- `app/(tabs)/explore.tsx` — exclude blocked creators' recipes

**Implementation:** on initial profile load, fetch the user's blocked list once into a Zustand store slice (`useAuthStore().blockedIds: Set<string>`) and filter client-side. Avoids re-querying on every feed render.

### People search — verify it's wired

**File:** `app/people-search.tsx`

The v2 impl shipped people-search. Verify it actually queries `profiles` table with `ilike` filters on `display_name` + `username`, limit 20, and that the follow button writes to `follows`. If it's a stub, wire it up.

### Drafts — verify the query path

**File:** `app/(tabs)/kitchen.tsx`

Verify the "Your recipes" grid shows draft recipes (where `is_public = false`). The existing query already does `created_by = user.id` without filtering `is_public`, so drafts should appear. Spot-check a draft and confirm the DRAFT badge renders.

---

## Task list

### Migrations (Drew runs after implementer writes SQL)

- [ ] Write `supabase/migrations/008_circles.sql`
- [ ] Write `supabase/migrations/009_user_fridge.sql`
- [ ] Write `supabase/migrations/010_follows_blocking.sql`
- [ ] Drew applies all three in Supabase dashboard and verifies tables exist

### Code — circles real data

- [ ] `lib/circles-queries.ts` — new file with `fetchMyCircles`, `fetchCircle`, `fetchCircleMembers`, `createCircle`, `inviteToCircle`, `removeFromCircle`, `createRitual`, `postToRitual`
- [ ] `app/(tabs)/feed.tsx` — swap `getStubCircles()` for `useQuery(['my-circles', userId], () => fetchMyCircles(userId))`
- [ ] `app/(tabs)/profile.tsx` — same swap in Your Circles section
- [ ] `app/circle/[id].tsx` — swap stub for `useQuery(['circle', id], () => fetchCircle(id))` + `useQuery(['circle-members', id], () => fetchCircleMembers(id))`
- [ ] `lib/circles-stub.ts` — delete (or keep for testing under a DEV flag)

### Code — fridge real data

- [ ] `lib/fridge-store.ts` — rewrite with Supabase calls, same function signatures
- [ ] `app/fridge.tsx` — spot-check no changes needed; if react-query isn't wrapping the fridge calls, add it

### Code — queue polish

- [ ] `app/recipe/[id]/index.tsx` — add `queryClient.invalidateQueries(['kitchen-queue', user.id])` to save mutation's onSuccess

### Code — friends blocking

- [ ] `app/friends.tsx` — add real `fetchBlocked`, `blockUser`, `unblockUser` implementations, wire to the Blocked tab
- [ ] `store/auth.ts` — add `blockedIds: Set<string>` slice, populate on profile load
- [ ] `app/(tabs)/feed.tsx` — client-side filter feed_items by actor not in `blockedIds`
- [ ] `app/people-search.tsx` — filter search results by profile.id not in `blockedIds`
- [ ] `app/(tabs)/explore.tsx` — filter recipes by creator not in `blockedIds`
- [ ] Add a "Block" action to row menus on `/user/[id]` profile pages (if the page exists — verify)

### Verification

- [ ] People search is wired to real `profiles` table (not a stub) — audit and fix if stub
- [ ] Draft recipes appear in Kitchen > Your recipes with DRAFT badge — manual test

---

## Testing (Drew walks this after implementation)

1. Run migrations 008, 009, 010 in Supabase SQL editor
2. Home circle row: shows real circles you're a member of (seed an admin row for yourself via SQL if needed, or build a circle via the new create flow)
3. Kitchen > Cooking soon: tap "save" on a recipe detail, queue updates without needing to navigate away
4. Fridge: add ingredients, kill and relaunch the app — ingredients persist (via Supabase, not AsyncStorage)
5. Second device (simulator): fridge syncs
6. Friends > Blocked: block a user from /user/[id], they appear in Blocked tab, their posts stop showing in feed
7. Unblock: user reappears in feed
8. Create a circle: flow works end-to-end (name, description, save)
9. Invite a user to the circle: member list updates
10. Post a ritual: it shows on the circle's wooden table

## Done =

- Migrations 008, 009, 010 applied to Drew's Supabase
- All circle/fridge/friends code paths use real data (stubs deleted or feature-flagged)
- Blocking filters work across feed, explore, search
- Queue updates optimistically
- tsc does not grow from baseline
- Manual testing checklist passes

## Notes

- **Circle seeding for testing:** after migrations run, Drew may want to SQL-insert a circle for himself so Home has something to show immediately. Script a helper in `scripts/seed/circle-seed.sql` that creates 1 test circle with Drew as admin + 1 ritual — one-line fix for the empty-state onboarding friction.
- **Realtime:** postgres changes on `circles`, `circle_members`, `circle_ritual_posts` should probably be added to realtime publication for multi-device sync. Optional for v1; add if it's trivial.
