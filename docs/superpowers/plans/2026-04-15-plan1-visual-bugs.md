# Plan 1 — Visual Bug Sweep

**Date:** 2026-04-15
**Branch:** `ak-ui-v2` (local only, do NOT push, do NOT merge)
**Baseline tsc:** 34 lines. Must stay ≤34.

Drew tested on iOS simulator and flagged 4 visual bugs. Each is surgical — no redesigns.

**Designed to run in parallel with Plan 2.** Files in this plan do NOT overlap with Plan 2 files.

## Files (exactly these 4)

- `app/(tabs)/feed.tsx`
- `app/(tabs)/profile.tsx`
- `app/(tabs)/explore.tsx`
- `app/recipe/[id]/index.tsx`

Do not touch any other files.

---

## Task P1.1 — Shrink the oversized Discover header (feed.tsx)

**Bug:** The "See what your circle is cooking" heading at the top of the feed feels too big and crowds the wordmark + pill tabs.

**Fix:**
1. In `app/(tabs)/feed.tsx`, find the `renderHeader` function (~line 174).
2. Change the `<EditorialHeading size={26} …>` → `size={20}`.
3. In the styles at bottom, change `headerBlock.paddingTop: 14` → `paddingTop: 6` and reduce `wordmarkRow.marginBottom: 14` → `marginBottom: 10`.
4. Reduce `pillRow.marginTop: 18` → `marginTop: 12`.

**Acceptance:** Header looks compact on iPhone 15/16 simulator; wordmark, heading, and pills all fit with breathing room above the first recipe card.

---

## Task P1.2 — Fix the profile heading ("kitchen" is showing but "Your" is missing)

**Bug:** In `app/(tabs)/profile.tsx` the `<EditorialHeading size={30} emphasis="kitchen" …>{'Your\n'}</EditorialHeading>` is rendering only the emphasis word — "Your" is not visible on iPhone 15 simulator.

**Root cause:** `components/EditorialHeading.tsx` concatenates `{children}{' '}<Text>{emphasis}</Text>`. When children ends with `\n`, RN's inline Text rendering collapses the newline + leading space oddly on iOS. Net effect: "Your" renders off-position or gets clipped.

**Fix:** Replace the fragile children+emphasis pattern with two stacked headings. In `app/(tabs)/profile.tsx` around line 113, change:

```tsx
<EditorialHeading size={30} emphasis="kitchen" emphasisColor="sage">
  {'Your\n'}
</EditorialHeading>
```

to:

```tsx
<View>
  <EditorialHeading size={30}>{'Your'}</EditorialHeading>
  <EditorialHeading size={30} emphasis="kitchen" emphasisColor="sage">{''}</EditorialHeading>
</View>
```

That renders "Your" on line 1 (ink black) and "kitchen" on line 2 (sage). No newline inside children, no inline concatenation, no clipping.

**Important:** Do NOT modify `components/EditorialHeading.tsx` itself — that component is used by many screens and Plan 2 also depends on it behaving identically. Only change the usage inside profile.tsx.

**Acceptance:** Profile screen top reads "Your" (black) above "kitchen" (sage), both fully visible below the notch.

---

## Task P1.3 — Exclude current user from Explore > People lists (explore.tsx)

**Bug:** On the Explore > People tab, the current user sometimes appears in their own "Suggested Cooks" list. Screenshot showed this clearly.

**Root cause:** The `people` query fires before auth is ready, so `user?.id` is `undefined`, and `fetchProfiles(search, undefined)` skips the `.neq('id', excludeUserId)` filter entirely (line 89 of explore.tsx).

**Fix:** In `app/(tabs)/explore.tsx`, around line 181, change the query's `enabled` from:
```tsx
enabled: mode === 'people',
```
to:
```tsx
enabled: mode === 'people' && !!user?.id,
```

This guarantees the query never runs without a known user id, so the exclusion filter always applies.

**Also** (defense in depth): in `fetchProfiles` (~line 84), if `excludeUserId` is falsy, return an empty array early rather than fetching everyone. Change:
```tsx
async function fetchProfiles(search: string, excludeUserId?: string) {
  let query = supabase
    .from('profiles')
    .select('id, display_name, username, avatar_url, created_at');

  if (excludeUserId) {
    query = query.neq('id', excludeUserId);
  }
```
to:
```tsx
async function fetchProfiles(search: string, excludeUserId?: string) {
  if (!excludeUserId) return [];
  let query = supabase
    .from('profiles')
    .select('id, display_name, username, avatar_url, created_at')
    .neq('id', excludeUserId);
```

**Acceptance:** On Explore > People, the current user never appears in suggested cooks or search results, regardless of auth timing.

---

## Task P1.4 — Close the big top gap on recipe detail (recipe/[id]/index.tsx)

**Bug:** On recipe detail screen, there's a large empty bone-colored gap between the notch and the back-arrow button. Screenshots show ~60-80pt of wasted space before content starts.

**Root cause:** `app/recipe/[id]/index.tsx` wraps its ScrollView in a `SafeAreaView` (react-native-safe-area-context) that honors all edges additively. Top inset (~59pt on iPhone 15) + the `head` style's `paddingTop: 14` = ~73pt of top padding, which is too much because the stack navigator isn't showing a header.

**Fix:** In `app/recipe/[id]/index.tsx`:

1. Reduce `styles.head.paddingTop` from `14` to `0` and `paddingBottom` from `26` to `16` (line ~277).
2. That's it. Do not remove the SafeAreaView — the top inset is still needed so the back button doesn't sit under the notch. We're just removing the double padding.

**Also check:** if there's a `Stack.Screen` with a header visible, confirm `headerShown: false` is set somewhere in the stack layout. If you find it's already hidden, move on. If you find it's showing an empty header, that's a second cause — fix it by adding `options={{ headerShown: false }}` to this screen's route.

**Acceptance:** On recipe detail, the back button sits roughly 16pt below the notch with no big empty gap. Hero card feels anchored.

---

## Self-verify + commit

After all 4 tasks:

1. Run:
   ```bash
   cd /Users/drewkhalil/Documents/Becipe && npx tsc --noEmit 2>&1 | wc -l
   ```
   Must be ≤34. If >34, inspect new errors and fix.

2. Stage only the 4 files you edited. Do NOT `git add -A`.

3. Commit with one commit:
   ```bash
   git commit -m "$(cat <<'EOF'
   fix(ui): visual bug sweep — feed header, profile heading, people filter, recipe top gap
   
   Four surgical fixes from iOS simulator testing:
   - feed.tsx: shrink Discover header (size 26 → 20) and tighten header spacing
   - profile.tsx: stack 'Your' and 'kitchen' as two EditorialHeadings so both render
   - explore.tsx: gate people query on !!user?.id and early-return fetchProfiles when missing
   - recipe/[id]/index.tsx: drop head paddingTop 14 → 0 so back button sits flush under notch
   
   Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
   EOF
   )"
   ```

4. Report final tsc count and commit SHA.

---

## Do NOT

- Push to remote
- Switch branches
- Touch any file outside the 4 listed
- Modify `components/EditorialHeading.tsx`
- Restructure or refactor anything
- Add new features
- Run the simulator (Drew will verify)
