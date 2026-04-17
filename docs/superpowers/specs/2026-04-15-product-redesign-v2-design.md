# Product Redesign v2 — Design Spec

**Date:** 2026-04-15
**Branch:** `ak-ui-v2` (local only — do NOT push, do NOT merge)
**Status:** APPROVED — ready for implementation
**Baseline tsc:** whatever the branch tip produces at the start of implementation. Do not grow it. Existing noise (edge-function Deno imports, `App/` vs `app/` casing, stale `scripts/seed/run.ts`) is pre-existing and not owned by this cycle.

## Spec review applied

Spec was reviewed by a separate subagent after initial writing. Fixes applied inline: flattened route structure (no nested `add-sheet/` folder), corrected ingredient dictionary path to `lib/ingredients.ts`, added `source_type`-based imported badge (schema was unambiguous after verification), added cook.tsx footer mic swap to the surgical bug list, corrected cook-mode auto-log hook location to `cook.tsx:242`, clarified that `voice-cook.tsx` does NOT share step state. Minor contradictions on tsc baseline and circle page routing resolved.

## Context

Drew tested the v2 shell (4-tab layout + circles + voice stubs + seed migration) on iOS simulator and flagged a mix of surgical bugs and IA problems. After brainstorming, the resolution is a single implementation cycle that restructures the tab IA, replaces the Circles tab with a new Kitchen tab, moves people/circles management into the You tab, cleans up several surgical bugs, and adds an ingredient-emoji system. **No schema changes, no backend work.** All data uses existing tables; new surfaces that require backend (real circles, fridge sync, voice STT, blocking) run on stubs or device-local storage for this cycle.

## Out of scope (tracked as future work)

1. **Pollinations seed image reliability.** Only ~3 of 50 recipe covers in `007_seed_becipe_content.sql` render. A follow-up SQL migration will replace the failing URLs with a more reliable source after this cycle lands and Drew confirms everything else works.
2. **Real backend for new surfaces:**
   - Circles (tables for `circles`, `circle_members`, `circle_rituals`, `circle_ritual_posts`)
   - Voice dictation + cook-mode speech-to-text
   - Fridge sync (AsyncStorage → `user_fridge` table)
   - Friends blocking (`follows_blocks` table)
3. Circle admin vs member permission gating in You > Your Circles (admin flag comes from stub data only)
4. Explore filters (cuisine / time / difficulty chips) — palate-only in v1
5. Push notifications, comments UI, analytics, error tracking
6. The blue circled gear icon Drew sees in top-right of simulator screenshots — confirmed as an Expo Go dev-client overlay, disappears in production builds. Not touched in this cycle.
7. URL/TikTok import parser correctness. The add-recipe form will have a paste-link input that calls whichever `parse-video`/`parse-recipe` edge function exists; if those are currently broken (regex-based or Apple-native half-migrated), do not attempt to fix. Just wire the UI.

These are explicitly deferred. Nothing in this spec should try to solve them.

---

## Information Architecture (v3)

### Tab structure

**4 content tabs + floating "+" overlay** (the "+" is a modal trigger, not a tab route):

| Position | Tab | Purpose |
|----------|-----|---------|
| 1 | Home | People-you-follow activity + circles jump-off |
| 2 | Explore | Recipe discovery via palate match |
| — | + | Opens modal sheet (Add Recipe / Log a Try) |
| 3 | Kitchen | Your cookbook + fridge utility |
| 4 | You | Identity + social management |

Visual order in the tab bar, left to right: `Home · Explore · + · Kitchen · You`

### Conceptual split

- **Home** is about *other people*. What the cooks you follow are making. Your circles are a navigation jump-off at the top.
- **Explore** is about *discovery*. Recipes you don't know yet, ranked by palate match.
- **"+"** is about *creating*. The only two verbs: add a recipe, log a try.
- **Kitchen** is about *your own cooking practice*. Things you plan to cook (Queue), things you've made (My Recipes), what's in your fridge (sub-screen).
- **You** is about *identity and relationships*. Profile, palate, the circles you're in, the people you follow, sign out.

No surface does two jobs. No overlap. Home no longer pretends to be "Discover"; Explore is the only discovery surface.

---

## Surfaces

### Home (`app/(tabs)/feed.tsx`)

**Purpose:** activity from people you follow + circles jump-off.

**Layout, top to bottom:**

1. **Compact header** — wordmark "becipe" on the left, small search icon on the right. The search icon opens a people-search modal sheet (see People Search below).
2. **Circle row** — horizontal scroll of `CircleCard` components (new component). Each card is typographic, ~160×100, no photo. Cards show circle name in bold, current ritual name in smaller text, and a progress pill ("3/4"). Color accent is derived deterministically from circle id via `colorForCircleId()`. Tapping a card pushes to the circle page (existing wooden table / ritual / members screen). Cap visible to 2–3 cards; overflow scrolls horizontally. Sort by ritual ending soonest. Hidden entirely if user has zero circles.
3. **Following feed** — chronological list of `FeedCard` items from everyone the user follows, regardless of circle membership. Reuses existing `fetchFeed()` query (follow-graph based `feed_items`).

**Kill:** the current `Discover · Following` pill tabs. Home is always the following feed now. The "Discover" concept moves to Explore.

**Empty state (no follows, no circles):** "Follow cooks or join a circle to see activity here" with the existing suggested-users list underneath.

**Data sources:** `feed_items` (existing), `circles-stub` (new mock file), `follows` (existing, for suggested-users fallback).

### Explore (`app/(tabs)/explore.tsx`)

**Purpose:** "recipes that match your palate." One surface, one job.

**Layout:**
- Editorial section header "For your palate" in sage
- Below: grid or vertical list of recipes sorted by palate-match score (descending)
- Each card uses `RecipeCard` in the existing `plate` variant, optionally with the match score rendered as a small ochre pill in the corner (e.g. "89%")

**Data:**
- Query all public recipes (`recipes where is_public = true`), limit 100
- Client-side sort by `matchScore(parsePalate(userPalate), parsePalate(recipe.palate_vector))` descending (these utilities already exist in `lib/palate.ts`)
- Cap visible at 50

**Empty state (no palate vector):** "Finish your palate quiz to see matches" + button routing to `/(onboarding)/palate-quiz`. Migration 006 backfilled existing users with a neutral palate, so this empty state is rare but possible.

**No filters in v1** (defer cuisine/time/difficulty). Palate-only ranking. Filters are listed in Future Work.

### Kitchen (`app/(tabs)/kitchen.tsx` — new file, replaces `circles.tsx`)

**Purpose:** your cookbook — things you plan to cook, things you've made, and your fridge utility as a sub-screen.

**Route rename:** the tab currently registered as `circles` becomes `kitchen`. Update `app/(tabs)/_layout.tsx` TAB_ORDER and screen registration accordingly. Delete the old `app/(tabs)/circles.tsx`.

**Layout, top to bottom:**

1. **Page header** — editorial heading "Your Kitchen"
2. **Queue section**
   - Subheading "Cooking soon" + count pill + a small `🧊 Fridge →` link in the top-right of the section header
   - Vertical list of queue items rendered as `RecipeCard` (plate variant)
   - Data source: `saved_recipes where user_id = me`, joined to `recipes`. UI copy says "Queue" everywhere; schema stays as `saved_recipes` (no rename).
   - Each card has a small × button in the top-right corner → delete from `saved_recipes`. No swipe-to-delete (keeps the component simple; add swipe later if needed).
   - Empty state: "Save recipes you want to try — they'll show up here."
3. **My Recipes section**
   - Subheading "Your recipes" + count pill
   - Grid of `RecipeCard` for recipes where `created_by = user.id`
   - Badges on cards:
     - `is_public = false` → small "DRAFT" badge (ochre)
     - `source_type != 'manual'` → small "IMPORTED" badge (muted). The schema has a clean `source_type` check-constrained column (`'manual' | 'url' | 'tiktok' | 'instagram'`), so this is unambiguous.
   - Tap card → recipe detail. Drafts get an "Edit" CTA stub on the detail screen; actual edit UI is out of scope.
   - Empty state: "No recipes yet. Tap the + button to add your first."

**Fridge sub-screen (`app/fridge.tsx` — new file, root-level push)**

- Back arrow top-left (pushes off Kitchen, so back arrow is correct)
- Heading "Your Fridge"
- Vertical list of ingredients on hand
- Each row: ingredient name + tap × to remove (same pattern as Queue — no swipe)
- Add input at the top with autocomplete from the existing ~500 ingredient dictionary at `lib/ingredients.ts` (shipped in commit 6bc9d5af)
- Big clay CTA at the bottom: "**What can I make tonight?**"
  - Filters Queue + My Recipes by % of ingredients present in fridge
  - Shows a ranked list (sort by % match descending)
  - Threshold: ≥60% match → shows. Below 60% → hidden.
- Storage: device-local via AsyncStorage, keyed `becipe.fridge.${user.id}`. Format: `{ items: Array<{ name: string, addedAt: string }> }`. Wrapper lives in `lib/fridge-store.ts` (new file).
- Empty state: "Add what's in your fridge to see what you can cook."

### You (`app/(tabs)/profile.tsx`)

**Purpose:** identity + relationships + settings.

**Restacked layout, top to bottom:**

1. **Header block** — avatar (2-char initials, deterministic color), display name, @handle, "edit profile" button (stub `onPress={() => {}}` OK — spec'd but not in scope)
2. **Stats row** — Tries · Followers · Following
   - Tapping **Followers** or **Following** jumps to the Friends section below (scroll-to or stack push — implementer picks; scroll-to is fine)
3. **Palate card** — existing layout, but the "edit your palate →" button now routes via `router.push('/(onboarding)/palate-quiz')`. That screen already exists.
4. **Your Circles** *(new section)* — editable bars per circle
   - Each bar: circle name + ritual name + small right-chevron
   - Tap → full circle page (existing wooden table screen), with edit UI *if user is admin*. Admin check against stub data for now. Members get read-only view.
   - Data source: `circles-stub.ts` (mock). Real schema is Future Work.
   - Empty state: "You're not in any circles yet" (no action button — circles are created via invitation in v1, not self-service).
5. **Friends** *(new section)* — pill sub-nav at top: `Followers · Following · Blocked`
   - Each sub-view is a vertical list of rows: avatar + name + action button
   - Followers row action: "Remove" (deletes the follow row)
   - Following row action: "Unfollow" (deletes the follow row)
   - Blocked row action: "Unblock" (stub — no `follows_blocks` table yet)
   - Tap row (not button) → `/user/[id]`
   - Empty states per sub-view
6. **Sign out** button

**Kill:** the "Your recipes" grid currently rendered in `profile.tsx`. Kitchen owns My Recipes now; You tab does not duplicate it.

### "+" modal sheet

**Route:** `app/add-sheet.tsx` (new, root-level — NOT under `(tabs)`, NOT nested with other add-sheet children). Registered in `app/_layout.tsx` root Stack with `presentation: 'formSheet'` (iOS native) or fall back to `'modal'`.

**Entry:** the "+" button in `CustomTabBar` (`app/(tabs)/_layout.tsx`) changes its press handler from `router.push('/(tabs)/add')` to `router.push('/add-sheet')`.

**Sheet contents:** two stacked actions

- **Add a Recipe** — big clay primary button, full width, ~56pt tall
- **Log a Try** — smaller secondary link below, ~40pt tall, muted text

Tapping outside the sheet, pulling down, or hitting a small × in the corner closes it.

**Tapping "Add a Recipe"** → pushes `app/add-recipe.tsx` (new file, root-level sibling) which is the full add-recipe form.

**Tapping "Log a Try"** → pushes `app/try-picker.tsx` (new file, root-level sibling).

**Delete the current `app/(tabs)/add.tsx`.** Lift its form content into `app/add-recipe.tsx`.

### Add Recipe form (`app/add-recipe.tsx`)

**Content** (adapted from current `(tabs)/add.tsx`):

1. **Paste a link input** at the very top — "Paste a TikTok or recipe URL" placeholder. On submit, calls existing `parse-video` or `parse-recipe` edge function (detects by URL shape), pre-fills the rest of the form. Errors inline on failure. (The edge functions currently use Apple native stuff per Drew's note — out of scope to rewrite, just wire the UI to whatever exists.)
2. **Manual entry fields** — title, description, cuisine, difficulty, prep/cook time, servings, ingredients (repeatable rows with name + amount + unit, using the existing autocomplete from commit 7d55f0ca), steps (repeatable rows), tips (repeatable rows), cover photo picker
3. **Voice dictation button** — sound-wave icon (swap from mic). Tapping opens the existing voice-dictation stub flow. No backend change.
4. **Publish toggle** at the bottom — off by default
5. **Save button** (primary, clay)
   - If publish toggle off: label reads "Save as draft", always enabled once title is non-empty, inserts with `is_public = false`
   - If publish toggle on: label reads "Publish", enabled only when title + ≥1 ingredient + ≥1 step are filled, inserts with `is_public = true`. On click with invalid state, show inline field errors.

### Log a Try recipe picker (`app/try-picker.tsx`)

**Purpose:** let the user log a try without knowing the recipe's id, from a fresh app-open.

**Layout, top to bottom:**

1. Heading "What did you cook?"
2. **Section: "From your Queue"** — horizontal scroll of queue cards (small variant of `RecipeCard`)
3. **Section: "Recently cooked"** — vertical list of last ~10 tries from `recipe_tries where user_id = me order by tried_at desc limit 10`, deduped by `recipe_id`
4. **Search input at the bottom** — as-you-type filter by recipe title (`recipes.title ilike %term%`). Results replace the two sections above while typing.

Tapping any result → `router.replace('/try/[id]')` with the selected recipe id. The existing `try/[id].tsx` form handles the rating/photo/note/post flow unchanged.

### Cook Mode auto-log prompt (`app/recipe/[id]/cook.tsx`)

**Trigger:** user taps "finish" on the last step of cook mode. `cook.tsx` already tracks `stepIndex` and `isDone = stepIndex === steps.length - 1` (line ~98), and the button at line ~242 has an `onPress={() => (isDone ? router.back() : goTo(stepIndex + 1))}` pattern. Replace the `router.back()` branch with a call that shows the prompt first, then routes.

**Behavior:** show a full-screen overlay card (or a modal dialog):
- Heading "Log your try?"
- Body "How did it turn out? Share a rating so others can see."
- Primary button: "Log a try" → `router.replace('/try/[id]')` with the current recipe id
- Secondary link: "Not now" → `router.back()`

`voice-cook.tsx` has its own separate state and does NOT share step logic with `cook.tsx` — only `cook.tsx` needs this hook. Purely additive.

### People search modal (`app/people-search.tsx`)

**Route:** root-level modal, `presentation: 'modal'`.

**Entry:** search icon in Home header.

**Content:**
- Search input at top
- Below: list of profiles matching `profiles.display_name ilike %term% or profiles.username ilike %term%`, limit 20
- Each row: avatar + display name + @handle + follow/unfollow button
- Tapping row (not button) → `/user/[id]`

Reuses existing `/user/[id]` screen and existing follow mutation from `feed.tsx` (extract to a hook if useful).

### Circle page (existing wooden table)

The wooden table / ritual / members screen already exists from commit `cb2aa8ef`. It's currently reachable from the Circles tab. After this redesign:

- **Entry points:** Home circle cards (push from Home stack) and You > Your Circles bars (push from Profile stack)
- **Back arrow** now makes sense because the page is always a stack child
- **Data source:** `circles-stub.ts` — same mock data everywhere
- **No UI changes to the page itself** — just rewire how it's reached

---

## New files / deletions / renames

### New files

```
lib/avatar.ts                         # initialsFor + colorForUserId + colorForCircleId
lib/ingredient-emoji.ts               # emoji lookup + normalization
lib/circles-stub.ts                   # mock circles data
lib/fridge-store.ts                   # AsyncStorage wrapper
components/CircleCard.tsx             # circle card/bar component
app/(tabs)/kitchen.tsx                # Queue + My Recipes + Fridge link
app/fridge.tsx                        # Fridge sub-screen (root-level push)
app/add-sheet.tsx                     # modal sheet with 2 action buttons
app/add-recipe.tsx                    # add recipe form (root-level push from sheet)
app/try-picker.tsx                    # log-a-try recipe picker (root-level push from sheet)
app/people-search.tsx                 # people search modal
```

**Note on route structure:** all new modal/push screens are **root-level siblings**, not nested under `add-sheet/`. Expo-router treats a file and a same-named directory as a layout segment, which would break the modal hosting. Flat is correct. The `add-sheet.tsx` modal pushes `add-recipe.tsx` or `try-picker.tsx` as siblings, not children.

### Deletions

```
app/(tabs)/add.tsx                    # moved to add-sheet/add-recipe.tsx
app/(tabs)/circles.tsx                # replaced by kitchen.tsx
```

### Modified

```
app/_layout.tsx                       # register add-sheet, try-picker, people-search, fridge as root stack screens
app/(tabs)/_layout.tsx                # TAB_ORDER update, safe-area bottom padding, "+" press handler change
app/(tabs)/feed.tsx                   # kill Discover pill, add circle row + search icon header
app/(tabs)/explore.tsx                # rewrite as palate-match grid
app/(tabs)/profile.tsx                # restack, wire palate edit, add circles + friends sections, kill recipes grid
app/recipe/[id]/index.tsx             # ingredient emoji, tighten head+hero padding, avatar update
app/recipe/[id]/cook.tsx              # add last-step log-a-try prompt
app/recipe/[id]/voice-cook.tsx        # sound-wave icon swap
components/FeedCard.tsx               # avatar update (2 initials + color)
components/RecipeCard.tsx             # avatar update in byline (if present)
```

---

## Design tokens & shared utilities

### `lib/avatar.ts`

```ts
export function initialsFor(displayName: string | null | undefined): string {
  if (!displayName) return '?';
  const trimmed = displayName.trim();
  if (!trimmed) return '?';
  const parts = trimmed.split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  // single word → first two chars
  return trimmed.slice(0, 2).toUpperCase();
}

export function colorForUserId(id: string): string {
  // Deterministic hash → palette index. Reuse the 5 avatar colors already
  // defined in lib/theme.ts (avJ, avE, avS, avM, avD).
  // Lift the implementation from the existing colorForUser() in profile.tsx:20.
}
```

Every avatar render site imports from here. No more per-file copies.

### `lib/ingredient-emoji.ts`

```ts
// Approx 150-entry map. Examples:
const EMOJI_MAP: Record<string, string> = {
  egg: '🥚',
  butter: '🧈',
  salt: '🧂',
  onion: '🧅',
  garlic: '🧄',
  tomato: '🍅',
  potato: '🥔',
  carrot: '🥕',
  lemon: '🍋',
  // ... full list during implementation, target ~150 covering common items
};

// Normalization: strip common adjectives so "kosher salt" → "salt"
const STRIP_WORDS = [
  'kosher', 'sea', 'fine', 'coarse', 'flaky', 'unsalted', 'salted',
  'yellow', 'red', 'white', 'green', 'sweet', 'bitter',
  'fresh', 'dried', 'ground', 'whole', 'large', 'small', 'medium',
  'extra', 'virgin', 'all-purpose', 'plain',
];

export function emojiFor(ingredientName: string): string | null {
  const normalized = ingredientName
    .toLowerCase()
    .split(/\s+/)
    .filter(w => !STRIP_WORDS.includes(w))
    .join(' ');
  return EMOJI_MAP[normalized] ?? null;
}
```

Consumption in `app/recipe/[id]/index.tsx` ingredient list:
- Replace `<Plate uri={recipe.cover_image_url} size={44} />` with a small emoji `<Text style={{fontSize: 22}}>{emojiFor(ing.name) ?? '·'}</Text>`
- Wrap in a 32×32 rounded container for layout consistency if needed

### `lib/circles-stub.ts`

Mock data for 3 circles:
```ts
export const STUB_CIRCLES = [
  { id: 'c1', name: 'The Dinner Group', memberCount: 4,
    ritual: { name: 'Sour & Bright', posted: 3, total: 4, endsAt: '2026-04-19' },
    isAdmin: true },
  { id: 'c2', name: 'College Friends', memberCount: 6,
    ritual: { name: 'One-Pan Wonders', posted: 2, total: 6, endsAt: '2026-04-20' },
    isAdmin: false },
  { id: 'c3', name: 'Weeknight Crew', memberCount: 3,
    ritual: null, isAdmin: true },
];

export function getStubCircles() { return STUB_CIRCLES; }
export function getStubCircle(id: string) { return STUB_CIRCLES.find(c => c.id === id); }
```

Real schema is Future Work. Every circles surface reads from this until the backend lands.

### `lib/fridge-store.ts`

AsyncStorage wrapper. Key: `becipe.fridge.${userId}`. Value: JSON `{ items: [{ name, addedAt }] }`.

```ts
export async function getFridge(userId: string): Promise<FridgeItem[]>;
export async function addToFridge(userId: string, name: string): Promise<void>;
export async function removeFromFridge(userId: string, name: string): Promise<void>;
export async function clearFridge(userId: string): Promise<void>;
```

### `components/CircleCard.tsx`

Props:
```ts
type Props = {
  circle: { id: string; name: string; ritual: { name: string; posted: number; total: number } | null };
  variant?: 'card' | 'bar';  // card = Home row, bar = You list
  onPress: () => void;
};
```

- `variant='card'`: ~160×100, rounded 18, colored left border (4px) from `colorForCircleId(circle.id)`. Name in Inter_700Bold 14. Ritual name underneath in Inter_500Medium 11 sage. Progress pill bottom-right.
- `variant='bar'`: full-width, height ~64, rounded 14, same color accent as a 4px left border. Name + ritual name on the left, right chevron on the right.
- No image, ever.

Add `colorForCircleId(id: string)` to `lib/avatar.ts` (same hash trick, different palette — sage/clay/ochre/deep variants).

### Tab bar safe-area fix

`app/(tabs)/_layout.tsx` line 83: replace `paddingBottom: 22` with `paddingBottom: insets.bottom + 6` using `useSafeAreaInsets()` from `react-native-safe-area-context`. Import at top. Pass down to `CustomTabBar` via a wrapping component that reads insets (function components can use the hook directly).

### Recipe detail header compression

`app/recipe/[id]/index.tsx`:
- `styles.head.paddingBottom` 16 → 8
- `styles.hero.paddingVertical` 26 → 18
- Move `styles.eyebrow` to render inline between head buttons and the hero card OR absorb it into the hero itself (implementer decides — goal is to lose ~30–40px of vertical dead space above the title)

---

## Data model usage (no schema changes)

| Feature | Table(s) | Notes |
|---------|----------|-------|
| Queue | `saved_recipes` | UI-only rename, schema unchanged |
| My Recipes | `recipes` where `created_by = me` | Draft = `is_public = false`, imported = `source_url not null` |
| Following feed | `feed_items` | Existing query |
| Explore | `recipes` where `is_public = true` | Client-side palate sort |
| People search | `profiles` | `ilike` on display_name + username |
| Friends > Followers | `follows` where `following_id = me` | |
| Friends > Following | `follows` where `follower_id = me` | |
| Friends > Blocked | stub | Returns empty array; future table |
| Circles | `lib/circles-stub.ts` | Mock data |
| Fridge | AsyncStorage | Device-local; future table |

---

## Surgical bugs covered in this cycle

1. **Ingredient thumbnails show cover image instead of ingredient image** — `app/recipe/[id]/index.tsx:174`. Fix: emoji lookup per ingredient.
2. **"Edit your palate" is a no-op** — `app/(tabs)/profile.tsx:168`. Fix: route to `/(onboarding)/palate-quiz`.
3. **Bottom tab bar has extended blank space** — `app/(tabs)/_layout.tsx:83`. Fix: safe-area inset.
4. **Mic icon in add screen** — swap to sound-wave icon.
5. **Mic icon in cook-mode voice-cook** — `app/recipe/[id]/voice-cook.tsx`. Swap to sound-wave icon.
5b. **Mic icon in cook mode footer** — `app/recipe/[id]/cook.tsx:252` renders a 🎤 button that launches voice-cook. Swap to sound-wave so the whole voice surface is consistent.
6. **"+" opens as stack push instead of modal sheet** — `app/(tabs)/_layout.tsx:34`. Fix: route to root-level `/add-sheet` with `presentation: 'formSheet'`.
7. **Avatars use single initial and fixed color** — audit every avatar render site, use new `initialsFor()` + `colorForUserId()`.
8. **Recipe detail has ~40px dead beige space above title** — `app/recipe/[id]/index.tsx`. Fix: compress `head` and `hero` padding.

---

## Testing (manual, iOS simulator)

After implementation, Drew will walk this list:

1. **Tab bar:** 4 tabs (`Home · Explore · + · Kitchen · You`) + center "+", no extended bottom space
2. **Tap "+":** sheet slides up from bottom, 2 buttons visible, tap outside to dismiss
3. **Add Recipe flow:** tap "+", tap Add Recipe, see paste-link input at top, fill manual fields, "Save as draft" enabled with title only, toggle Publish on → button requires ingredients+steps
4. **Log a Try from "+":** tap "+", tap Log a Try, see Queue + Recently cooked + search, tap a queue card → try form pre-filled
5. **Cook mode auto-log:** open a recipe, tap "start cooking", complete last step, see "Log your try?" prompt
6. **Home:** top header has wordmark + search icon; circle row renders below (mock data, 3 cards); following feed below
7. **Home search icon:** tap it, people-search sheet opens, typing filters profiles
8. **Explore:** recipes sorted by palate match, match score pill visible on cards
9. **Kitchen tab:** top section is Queue (saved_recipes data), "🧊 Fridge →" link on the right, bottom is My Recipes grid
10. **Fridge:** tap Fridge link → full screen, add an ingredient via autocomplete, "What can I make tonight?" returns ranked list
11. **Recipe detail:** ingredient list shows emojis (🥚 for egg, 🧂 for salt, etc.), bullet dot for unknowns, beige gap above title is tight
12. **You tab:** avatar has 2 initials + color, stack order is header → stats → palate → circles → friends → sign out, no standalone recipes grid
13. **Palate edit:** tap "edit your palate →" in You, routes to palate quiz
14. **Friends:** tap Followers/Following sub-pills, lists render; tap a row → /user/[id]
15. **Avatars everywhere:** feed cards, recipe byline, suggested users, profile header — all 2-initial + color
16. **Creator tappability:** tap a creator name on a recipe card in any feed, routes to /user/[id]
17. **Tsc baseline:** ≤34 lines

---

## Implementation task list

Grouped by dependency order. Each bullet is a single commit, conventional `type(scope): subject` message.

### Foundation (no dependencies — land first)

- [ ] `lib/avatar.ts` — initialsFor + colorForUserId + colorForCircleId
- [ ] `lib/ingredient-emoji.ts` — ~150-entry map + normalization
- [ ] `lib/circles-stub.ts` — 3 mock circles with rituals
- [ ] `lib/fridge-store.ts` — AsyncStorage wrapper
- [ ] `components/CircleCard.tsx` — card + bar variants

### Tab structure + routing

- [ ] `app/(tabs)/_layout.tsx`:
  - `TAB_ORDER` becomes `['feed', 'explore', 'add', 'kitchen', 'profile']` — note `'add'` stays as a sentinel for the "+" visual slot, it is NOT a real tab route anymore
  - Remove `<Tabs.Screen name="add" />` registration (the file is deleted)
  - Remove `<Tabs.Screen name="circles" />`, add `<Tabs.Screen name="kitchen" />`
  - CustomTabBar's `'add'` branch: change handler from `router.push('/(tabs)/add')` to `router.push('/add-sheet')`
  - Update `TAB_LABELS` and `TAB_ICONS` maps: drop `circles`, add `kitchen: 'Kitchen'` with an appropriate glyph
  - Wrap the tab bar with `useSafeAreaInsets()` — replace hardcoded `paddingBottom: 22` with `insets.bottom + 6`
- [ ] Delete `app/(tabs)/add.tsx`
- [ ] Delete `app/(tabs)/circles.tsx`
- [ ] `app/_layout.tsx` — register `add-sheet`, `add-recipe`, `try-picker`, `people-search`, `fridge` as root Stack screens. `add-sheet` and `people-search` get `presentation: 'formSheet'` (iOS) or `'modal'` (fallback). `add-recipe`, `try-picker`, `fridge` are full-screen pushes (default presentation). Do NOT touch the existing `circle/[id]` page — it stays at its current route, just rewire entry points in Home and You. No new circle route needed.

### "+" modal

- [ ] `app/add-sheet.tsx` — 2-action sheet (Add Recipe / Log a Try)
- [ ] `app/add-recipe.tsx` — full add form lifted from deleted `(tabs)/add.tsx`, plus a "Paste a link" input at the top, plus a draft/publish toggle at the bottom, plus a sound-wave voice dictation button (replacing the old mic icon)
- [ ] `app/try-picker.tsx` — Queue + Recent + Search picker; tapping a result calls `router.replace('/try/[id]')`

### Home redesign

- [ ] `app/people-search.tsx` — lightweight search modal (land first so the feed task can reference it)
- [ ] `app/(tabs)/feed.tsx` — kill Discover pill, add header with search icon (→ opens `people-search`), add circle row above feed (reads from `circles-stub`), use Following as the only data source, reuse existing suggested-users empty state

### Explore rewrite

- [ ] `app/(tabs)/explore.tsx` — replace with palate-match grid

### Kitchen + Fridge

- [ ] `app/(tabs)/kitchen.tsx` — Queue + Fridge link + My Recipes
- [ ] `app/fridge.tsx` — fridge screen with autocomplete and "what can I make" CTA (root-level push, not nested)

### You tab restack

- [ ] `app/(tabs)/profile.tsx` — restack order, wire palate edit, add Your Circles section (reads stubs), add Friends section, remove standalone recipes grid
- [ ] Friends sub-nav can live inline in profile.tsx or be factored into a `components/FriendsSection.tsx` — implementer picks

### Recipe detail polish

- [ ] `app/recipe/[id]/index.tsx` — emoji ingredient rows, compress head+hero padding, avatar update
- [ ] `app/recipe/[id]/cook.tsx` — last-step "Log your try?" prompt (hook at line ~242 where finish button calls `router.back()`) AND swap footer 🎤 at line ~252 to sound-wave icon
- [ ] `app/recipe/[id]/voice-cook.tsx` — sound-wave icon (e.g. `MaterialCommunityIcons` name `waveform` or `waveform-bold`, or any equivalent from expo-vector-icons the implementer finds cleanest)

### Avatars everywhere (sweep)

Grep `components/` and the app tree for any place that renders an avatar initial, a single-letter fallback, or imports `colorForUser`. Sweep all hits to use `initialsFor` + `colorForUserId` from `lib/avatar.ts`. Known hits (non-exhaustive):

- [ ] `components/FeedCard.tsx` — use `initialsFor` + `colorForUserId`
- [ ] `components/RecipeCard.tsx` — same, if it renders creator avatars
- [ ] `app/(tabs)/feed.tsx` — suggested users avatar update
- [ ] `app/(tabs)/profile.tsx` — header avatar update (it already uses a local `colorForUser` — remove local copy, import from lib/avatar)
- [ ] `app/recipe/[id]/index.tsx` — byline mini-avatar update
- [ ] `app/user/[id].tsx` — header avatar update

---

## Definition of done

- All 8 surgical bugs fixed and manually verified
- 4 content tabs render correctly: `Home · Explore · + · Kitchen · You`
- "+" opens as a bottom-sheet modal with Add Recipe + Log a Try
- Kitchen tab shows Queue from `saved_recipes` + My Recipes from `created_by = me`, Fridge sub-screen reachable
- You tab restacked with working palate edit, circles stub bars, and Friends section
- All avatars use 2-initial + deterministic color
- Ingredient list in recipe detail uses emoji lookup
- Home circle row + following feed both render; search icon opens people search
- Explore renders palate-sorted recipes
- tsc did not grow from the implementation-start baseline
- Branch remains local only, not pushed, not merged
- Drew can walk the 17-item manual testing checklist

## Notes for the implementer

- **Stay on `ak-ui-v2`.** Do not push, do not merge, do not rebase against main.
- **One commit per task bullet.** Conventional commit messages: `feat(kitchen): queue + my recipes sections`, `fix(ui): tab bar safe-area padding`, etc.
- **Tsc:** run `npx tsc --noEmit 2>&1 | wc -l` before you start and again at the end. Your number must be ≤ starting number. Existing noise from edge-function Deno imports, `App/` vs `app/` casing, and `scripts/seed/run.ts` is not yours to fix.
- **Circles are mock.** Do not try to wire real Supabase queries for circles. Read from `lib/circles-stub.ts` everywhere.
- **Fridge is local.** AsyncStorage only, keyed per user. Do not add a migration.
- **Drafts use existing `is_public` column.** No schema work.
- **URL/TikTok import:** wire the paste-link input to whichever parse function currently exists. If it returns garbage, that's Future Work — do not try to fix it in this cycle. Just ensure the form handles success, failure, and empty-response cases without crashing.
- **Cook-mode "Log your try?" prompt:** hook at `cook.tsx:242` where the finish button currently calls `router.back()` when `isDone` is true. Replace that branch to show the prompt, then route. `voice-cook.tsx` does NOT share step logic — only `cook.tsx` needs this.
- **Creator tappability:** any `FeedCard` / `RecipeCard` / recipe-detail byline that renders a creator name or avatar should wrap it in a `Pressable` → `router.push('/user/${creatorId}')`. Low-effort sweep, real UX win.
- **When in doubt about visual details**, prefer fewer lines of code over more. The design tokens in `lib/theme.ts` are the only source of color/radius/shadow — never hardcode hex.
- **`useSafeAreaInsets()`:** custom tab bar is a child of `Tabs`, which is inside the SafeAreaProvider set up by expo-router. You can call the hook directly in `CustomTabBar`. No need to lift state.
