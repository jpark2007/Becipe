# Plan 1 — UI Polish Round 2

**Date:** 2026-04-15
**Branch:** `ak-ui-v2` (local only, do NOT push, do NOT merge)
**Run in:** a new chat. Self-contained, subagent-ready. ~8 discrete commits.

## Context

Drew tested the v2 redesign on iOS simulator after the 22-commit implementation pass (commits `aa1f0a91` through `c7102f51`). Everything works; these are the polish items that surfaced during manual QA. No new features, no new routes beyond one small palate editor page.

## Tasks — each is a single commit

### 1. Home heading: "circle" → "friends"

**File:** `app/(tabs)/feed.tsx`

Drew's rule: "only say *circle* in circle-specific space."

Change the `EditorialHeading` text under the wordmark from `"See what your circle\nis "` + emphasis `"cooking"` to `"See what your friends\nare "` + emphasis `"cooking"`. Preserve the existing layout, just swap the text.

**Commit:** `fix(home): heading says 'friends' instead of 'circle'`

### 2. Kitchen IMPORTED badge no longer covers title

**File:** `app/(tabs)/kitchen.tsx`

Current bug (line 139–158): badges are rendered as an absolute overlay at `top: 6, left: 6, zIndex: 2`, which lands directly on top of the recipe card's title text. The title "Barbecued spatchcock chicken with vermouth sauce" is obscured.

**Fix:** reflow badges to be inline *above* the RecipeCard rather than overlapping it. Render a small horizontal row of chip-style badges (DRAFT ochre, IMPORTED muted) with `marginBottom: 6`, then render the `<RecipeCard />` below. Drop the `position: absolute` and `zIndex` on the badges.

Preserve the existing `isDraft`/`isImported` detection logic (`r.is_public === false`, `r.source_type && r.source_type !== 'manual'`).

**Commit:** `fix(kitchen): imported badge no longer covers recipe card title`

### 3. "+" modal — equal-size action buttons

**File:** `app/add-sheet.tsx`

Drew: "make log a try same size" as Add Recipe.

Currently the sheet has Add Recipe as a big primary clay button and Log a Try as a smaller secondary link. Make them visually equal: both ~56pt tall, both full width, both with the same padding. Distinguish by color only — Add Recipe stays clay (primary), Log a Try becomes a card/outline style (secondary but same size).

Small × close button top-right of the sheet stays.

**Commit:** `fix(add-sheet): equal-size Add Recipe and Log a Try buttons`

### 4. Voice waveform icon — use a real glyph, not the tilde fallback

**Files:**
- `app/add-recipe.tsx` — voice dictation button
- `app/recipe/[id]/cook.tsx` — line ~252 footer mic button
- `app/recipe/[id]/voice-cook.tsx` — main mic icon

Drew: "voice flow looks bad. it should be like not ~. that's what u put."

The prior agent rendered a tilde-or-similar text glyph as a placeholder. Replace with `MaterialCommunityIcons` name `waveform` (or `waveform-bold`) from `@expo/vector-icons`. Import example:

```tsx
import { MaterialCommunityIcons } from '@expo/vector-icons';
// <MaterialCommunityIcons name="waveform" size={24} color={colors.clay} />
```

`@expo/vector-icons` is already in the project (used elsewhere — verify with a quick grep). Size and color tokens per each call site: add form uses a standalone button, cook.tsx footer uses a pill, voice-cook uses a larger icon. Keep sizing consistent with the existing button footprint.

**Commit:** `fix(voice): real waveform icon everywhere the mic used to render`

### 5. Save-to-Queue is more discoverable on recipe detail

**File:** `app/recipe/[id]/index.tsx`

The save mutation already exists at line 63 (writes to `saved_recipes`), wired to a `♡ → ♥` heart icon in the header top-right. The problem is users don't connect "heart" → "add to my queue."

**Fix:** keep the heart in the header for muscle memory, but add a visible secondary CTA on the main action area below "start cooking →" and "log a try":

- New third button: "**Add to queue**" (outline style, bookmark icon + label)
- Tapping writes the same `saveMutation`
- Disabled + label changes to "In your queue" once saved (track local `isSaved` state, same as the heart)
- Success toast: "Added to your queue →" (brief, dismissible, uses existing Alert OR a simple in-app banner)

Visual: match the existing `tryBtn` outline style (`styles.tryBtn` and `styles.tryBtnText`), stacked below `log a try`.

**Commit:** `feat(recipe): explicit Add-to-Queue button below start-cooking CTA`

### 6. Palate editor — new inline page, no more quiz redirect

**New file:** `app/palate-editor.tsx` (root-level push, NOT under `(onboarding)`)

**Background on the bug:** `profile.tsx:240` routes "edit your palate" to `/(onboarding)/palate-quiz`. The `AuthGate` in `app/_layout.tsx:68–79` has:
```ts
} else if (session && hasPalate && (inAuthGroup || inOnboarding)) {
  router.replace('/(tabs)/feed');
}
```
Since the user already has a palate vector, the moment they land in the onboarding segment the gate bounces them to feed. That's why it "takes me to home."

**Real fix:** build a dedicated editor outside the onboarding group. New route `app/palate-editor.tsx`.

**UI choice — pentagon radar, not sliders:**

Drew wants "a cooler ui thing instead of slider." Build a draggable pentagon/radar chart using `react-native-svg` (already installed — verify). Five axes (salt, sweet, umami, spice, acid) as vertices of a regular pentagon. Each axis is a 0–100 scale from center (0) to vertex (100). The user's current palate is a filled polygon inside the pentagon.

- Five draggable handles at each axis position
- Drag a handle along its axis line to adjust that value
- Polygon fill updates live
- Axis labels around the pentagon
- Numeric readout below ("Salt 55 · Sweet 50 · Umami 60 · Spice 45 · Acid 50") for precision
- A reset-to-neutral button
- A save button at the bottom (clay primary) — writes back to `profiles.palate_vector` via supabase update, invalidates profile query in react-query cache, navigates back

**If pentagon drag gets hairy, fallback:** clean slider UI with ink-on-parchment styling — five horizontal tracks, bigger thumb, labeled tick marks at 0/50/100. Still not the current basic slider, but simpler than SVG drag. Pick the slider fallback only if the pentagon takes more than one commit to get working.

**Fix the profile button:** change `profile.tsx:240` from `router.push('/(onboarding)/palate-quiz' as any)` to `router.push('/palate-editor' as any)`.

**Register the new route:** in `app/_layout.tsx` root Stack, add `<Stack.Screen name="palate-editor" options={{ headerShown: false }} />`.

**Commit:** `feat(palate): inline palate editor with pentagon UI (fix quiz redirect)`

### 7. Friends → standalone page, not a section in You

**New file:** `app/friends.tsx` (root-level push)

**Current state:** `app/(tabs)/profile.tsx` has a Friends section with `Followers · Following · Blocked` pill sub-nav rendering inline below the Your Circles section. Drew: "for friends lets make it like bring u to another page bc it will get hard if u have tons."

**Changes:**

1. **Create `app/friends.tsx`** — full-screen push. Contains the pill sub-nav (`Followers · Following · Blocked`) and the list rendering. Lift the existing logic from `profile.tsx` — `fetchFollowers`, `fetchFollowing`, the row rendering. Keep Blocked as a stub returning an empty array.
2. **`app/(tabs)/profile.tsx`** — remove the inline Friends section. Replace with a single `Pressable` row styled as a "Friends →" link (see next task for the visual distinction from circles).
3. **Stat row tap targets** — the Followers/Following count buttons in the stats row currently scroll to the friends section. Change them to `router.push('/friends?tab=followers')` and `router.push('/friends?tab=following')` respectively. The `friends.tsx` screen reads `useLocalSearchParams()` to set the initial tab.
4. **Register the route** in `app/_layout.tsx`: `<Stack.Screen name="friends" options={{ headerShown: false }} />`.

**Commit:** `feat(friends): standalone /friends page with followers/following/blocked tabs`

### 8. Friends row visual distinction from Circle bars

**File:** `app/(tabs)/profile.tsx`

After Task 7, the You tab has Your Circles (rendered as editable bars via `<CircleCard variant="bar" />`) and a single Friends row. Drew: "make sure following or friends one doesn't look too similar."

**Fix:** make the Friends entry a single `Pressable` row that is clearly different from the circle bars:

- Different background: `colors.card` with a thin `colors.border` outline, NOT the colored left-border treatment that CircleCard uses
- Different height: 48–52pt, shorter than the circle bars (which are ~64pt)
- Single line of text: "**Friends**" in Inter_700Bold + right-aligned chevron `›`
- Small subtext under "Friends": `"{followerCount} followers · {followingCount} following"` in muted Inter_500Medium 11pt
- No color accent, no ritual name, no progress pill

So the visual hierarchy reads:
- Circles = colored accent bars with ritual metadata (rich, plural, social)
- Friends = single slim row with chevron (simple, one destination)

**Commit:** `fix(profile): friends row visually distinct from circle bars`

---

## Implementation notes for the subagent

- **Branch:** stay on `ak-ui-v2`, do not push.
- **Tsc baseline:** run `npx tsc --noEmit 2>&1 | wc -l` at the start. Your end count must be ≤ start count. Current baseline is 19 lines from the v2 implementation pass.
- **One commit per numbered task.** Conventional messages as listed. End each with `Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>`.
- **`@expo/vector-icons` is already installed** via Expo SDK. If `MaterialCommunityIcons` import fails, use `Ionicons` name `pulse` or any waveform-ish equivalent.
- **`react-native-svg` availability:** verify it's installed (`node_modules/react-native-svg`). If not, use the slider fallback for Task 6 — do NOT add a new dependency just for the palate editor.
- **Route registration:** every new root-level route (`palate-editor`, `friends`) must be registered in `app/_layout.tsx` root Stack, or expo-router will fail to navigate.
- **Do not fix pre-existing tsc noise.** Deno imports, `App/` vs `app/` casing, stale `scripts/seed/run.ts` — not yours.
- **No schema changes.** No new migrations.
- **No backend work.** Palate save uses existing `profiles.palate_vector` jsonb column.

## Testing checklist (Drew walks this after)

1. Home: header now reads "See what your friends are cooking" with "cooking" in sage
2. Kitchen > Your Recipes: IMPORTED/DRAFT badges sit *above* the card, title fully visible
3. "+" sheet: both buttons same size, Log a Try no longer tiny
4. Add Recipe / cook mode / voice-cook: waveform icon is a real glyph, not a tilde
5. Recipe detail: "Add to queue" button visible below "log a try", tapping it adds to Kitchen > Cooking soon, button disables + relabels to "In your queue"
6. You > "edit your palate →": routes to the new palate editor (pentagon or sliders), NOT home; adjusting and saving persists across app restart
7. You tab: Friends is a single slim row, not a multi-section block; tapping it pushes to /friends
8. /friends: pill sub-nav works, Followers/Following show real data, Blocked is empty stub
9. Stats row tap on Followers/Following: routes to /friends with the correct tab active
10. Circles bars and Friends row look obviously different in the You tab

## Done =

- 8 commits landed in order
- tsc ≤ 19
- Branch local only
- Drew can walk the 10-item testing checklist cleanly
