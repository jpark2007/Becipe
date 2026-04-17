# Dishr UI Rehaul v2 — Fix Plan

> **For agentic workers:** Use superpowers:subagent-driven-development to implement. Steps use checkbox (`- [ ]`) syntax.

**Context:** Drew tested `ak-ui-v2` in iOS simulator on 2026-04-15 and hit blockers. Full bug list is in `docs/superpowers/status/ui-rehaul-v2-handoff.md`. This plan addresses every issue marked 🔴 or 🟡 there.

**Goal:** Unblock testing, fix the safe-area layout bugs, harden the onboarding flow against schema mismatches, and leave `ak-ui-v2` in a state where Drew can test every rehauled screen.

**Scope:** Local branch work only. No pushes, no merges to main.

**tsc baseline:** 34 lines. Every task must keep `npx tsc --noEmit 2>&1 | wc -l` at 34 or below.

**Architecture:** All fixes are surgical — no redesigns, no new components, no new screens. The heaviest change is swapping `SafeAreaView` imports across ~5 files.

**Tech stack:** Same as parent plan (Expo SDK 55, RN 0.83, expo-router, Supabase, Zustand, React Query). `react-native-safe-area-context` is already installed (Expo ships with it, used by expo-router).

---

## Dependency Graph

```
F1 (apply migration 006) ─┐
                          ├─→ unblocks Drew's testing
F2 (SafeAreaView swap)   ─┤
F3 (clipping audit)       ─┘ ← depends on F2
F4 (quiz defensive path)    ← independent, can land in parallel
F5 (verify-email restyle)   ← nice-to-have, independent
F6 (final smoke + commit)
```

F1 is a **human action** (or a bash-run via supabase CLI), not a code task. The rest are code.

---

## Out-of-Scope (Explicit YAGNI)

- ❌ Redesigning anything that Drew hasn't seen yet. Feed, detail, cook, etc. stay as-is — just unblock them so he can actually see them.
- ❌ Hardening the voice cook screen (still UI-only stub)
- ❌ Web rendering — iOS is the target
- ❌ Pushing the branch
- ❌ Real circles backend
- ❌ Fixing the auth-flicker race (existing users briefly see onboarding) — low priority, visual only
- ❌ Re-adding recipe description / moving steps back to detail — that's a product decision, not a bug

---

## Task List

---

### Task F1: Apply migration 006 to the live Supabase

**Type:** Human action (or CLI command from a machine with service-role access).

**Why:** Without this, the palate quiz errors out on save ("Could not find the 'palate_vector' column"). Every other fix is downstream of this.

**Who:** Drew or jpark2007, depending on who has Supabase access. Next Claude session should ask Drew which path to take.

- [ ] **Option A: Supabase dashboard SQL editor**

  1. Log into the Supabase dashboard for the Dishr project
  2. Open SQL Editor (service_role context)
  3. Paste the contents of `/Users/drewkhalil/Documents/Becipe/supabase/migrations/006_palate_vector.sql`
  4. Run. Expected output: `ALTER TABLE` x2, `UPDATE profiles` (N rows backfilled)
  5. Verify with `select id, palate_vector from profiles limit 5;` — every row should have the neutral vector `{"salt":50,"sweet":50,"umami":50,"spice":50,"acid":50}`
  6. Verify with `select column_name from information_schema.columns where table_name = 'recipes' and column_name = 'palate_vector';` — should return one row

- [ ] **Option B: supabase db push (if Drew has CLI + linked project)**

  ```bash
  cd /Users/drewkhalil/Documents/Becipe
  supabase db push
  ```

  This applies every unapplied migration in order. If migration 005 (seed support) also hasn't been applied, it'll run that first — verify with `supabase migration list` before pushing.

- [ ] **Acceptance**

  - Sign up a new test account in the simulator
  - Reach the palate quiz
  - Move sliders, tap "continue →"
  - App navigates to feed instead of showing the "Could not save" alert

- [ ] **If it fails:** If F4 (defensive fallback) has landed by the time F1 is being applied, the quiz will no longer block on save — it'll store locally and try again later. That gives Drew more room to breathe. Otherwise, re-read the error and check the SQL editor returned no error.

---

### Task F2: Swap SafeAreaView imports + wire bottom insets

**Files (5 + verify-email later):**
- Modify: `app/(onboarding)/welcome.tsx`
- Modify: `app/(onboarding)/palate-quiz.tsx`
- Modify: `app/(tabs)/circles.tsx`
- Modify: `app/recipe/[id]/voice-cook.tsx`
- Modify: `app/recipe/[id]/index.tsx`

**Why:** RN's built-in `SafeAreaView` is deprecated and does not reliably inset the bottom home-indicator area on iPhone 15/16. The floating CTA on the welcome screen is clipping. The quiz header is crowded at the top. Likely affects more screens once Drew sees them.

**Dependency:** `react-native-safe-area-context` is already installed (comes with Expo). We just need to use it.

- [ ] **Step 1: Verify react-native-safe-area-context is available**

```bash
cd /Users/drewkhalil/Documents/Becipe
npm list react-native-safe-area-context
```

Expected: version output, no errors. If missing, `npx expo install react-native-safe-area-context`.

- [ ] **Step 2: For each of the 5 files above, swap the import**

Before:
```typescript
import { View, Text, Pressable, StyleSheet, SafeAreaView } from 'react-native';
```

After:
```typescript
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
```

**Important:** `react-native-safe-area-context`'s `SafeAreaView` defaults to honoring **all** edges (top, right, bottom, left) in **additive mode** — it adds insets *on top of* existing padding, it doesn't replace them. Any `paddingBottom` / `marginBottom` you leave in place will stack on top of the home-indicator inset.

- [ ] **Step 3: For `welcome.tsx` specifically, verify the CTA clears the home indicator**

The current code has `marginBottom: 32` on the CTA. With the new additive-mode SafeAreaView, bottom inset (≈34pt on iPhone 15/16) stacks on top of this, so the button will sit ~66pt above the bottom edge — probably too high.

**Recommendation:** drop `marginBottom` to `0` (or at most `8`) and let the safe-area bottom inset do the work. **Visually verify on the iOS simulator** that the CTA has roughly 16pt clearance above the home indicator — if it looks too high, reduce further; if it looks clipped, bump up. Don't hardcode a number without checking.

```typescript
cta: {
  // ... existing props
  marginBottom: 0,   // was 32 — additive safe-area inset handles clearance
},
```

- [ ] **Step 4: For `palate-quiz.tsx`, verify the top header has breathing room**

The current `paddingHorizontal: 24` is fine — just make sure `<SafeAreaView>` wraps everything and the top header row has `paddingTop: 14` still. The new SafeAreaView will add the notch inset automatically.

- [ ] **Step 5: Verify on simulator**

Run `npx expo start`, open iOS simulator, navigate to welcome screen. Confirm:
- ✅ "◆ becipe" wordmark is below the notch, not under it
- ✅ "let's go →" CTA has clearance above the home indicator
- ✅ Tap through to palate-quiz, confirm top `←` button isn't under the notch

- [ ] **Step 6: Run type-check**

```bash
npx tsc --noEmit 2>&1 | wc -l
```

Expected: ≤34 lines (baseline). The new SafeAreaView has slightly different prop types — if it adds errors, adapt the usage.

- [ ] **Step 7: Commit**

```bash
git add app/\(onboarding\)/welcome.tsx \
        app/\(onboarding\)/palate-quiz.tsx \
        app/\(tabs\)/circles.tsx \
        app/recipe/\[id\]/voice-cook.tsx \
        app/recipe/\[id\]/index.tsx
git commit -m "$(cat <<'EOF'
fix(layout): swap to react-native-safe-area-context SafeAreaView

The built-in React Native SafeAreaView is deprecated in RN 0.83 and
does not reliably inset the bottom home-indicator area. Swapping to
react-native-safe-area-context's SafeAreaView (already in the tree
via Expo) fixes welcome-screen CTA clipping, palate-quiz header
crowding, and the deprecation warning.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task F3: Audit remaining rehauled screens for clipping

**Files:** no edits in this task unless issues found. This is a **verification pass** after F2 lands.

**Why:** Drew flagged that "not fitting on screen" might be app-wide. F2 fixes the 5 files that use deprecated SafeAreaView, but other screens (feed, cook, try, profile, etc.) use different layout patterns and may still clip. We need to walk through each screen on the simulator and look for problems.

**Checklist (per screen):** Does the top header clear the notch? Does the bottom CTA or last content item clear the home indicator / tab bar? Does a ScrollView's bottom have enough padding? Are there obvious overflows?

- [ ] **Step 1: Review each screen's SafeAreaView / padding strategy**

For each file below, read the top-level container and its `paddingBottom`/`paddingTop`. Flag anything that looks suspicious (hardcoded bottom margin < 24 when there's a CTA, no SafeAreaView, `paddingTop` < 20 when there's no navigation header).

- `app/(tabs)/feed.tsx`
- `app/(tabs)/explore.tsx`
- `app/(tabs)/add.tsx`
- `app/(tabs)/profile.tsx`
- `app/(tabs)/circles.tsx` (already fixed in F2)
- `app/recipe/[id]/cook.tsx`
- `app/try/[id].tsx`
- `app/user/[id].tsx`
- `app/(auth)/login.tsx`
- `app/(auth)/signup.tsx`

- [ ] **Step 2: For any flagged file, apply the same fix pattern**

If the screen uses `from 'react-native'` SafeAreaView, swap it. If it uses no SafeAreaView but has a sticky bottom CTA, add `SafeAreaView` from `react-native-safe-area-context` around the root. If it has a `ScrollView` without `contentContainerStyle={{ paddingBottom: 100 }}` and has content close to the tab bar, add the padding.

- [ ] **Step 3: Run the simulator and visually verify each screen**

Open iOS simulator. For each screen:
1. Navigate to it
2. Scroll to the bottom (if scrollable)
3. Verify nothing clips under the tab bar / home indicator
4. Screenshot for Drew if anything looks off

Take notes on anything that's **visually off but not clipping** — those are candidates for Drew's next round of feedback, not for this task.

- [ ] **Step 4: Commit any fixes**

If Step 2 produced any edits, commit with:

```bash
git commit -m "fix(layout): audit and harden bottom-padding on rehauled screens"
```

If no edits were needed, skip the commit.

---

### Task F4: Defensive palate quiz save path

**Files:**
- Modify: `app/(onboarding)/palate-quiz.tsx`

**Why:** Belt and suspenders. If the migration hasn't been applied (like B1), or if a future schema change breaks the column, the quiz currently wedges the user with a modal alert and no way forward. Add a local fallback so the user can continue, and the app retries the save later.

**Scope:** small, surgical change. Don't redesign the quiz.

- [ ] **Step 1: Read the current `handleSave` function**

Current shape:
```typescript
async function handleSave() {
  if (!profile) return;
  setSaving(true);
  const { data, error } = await supabase
    .from('profiles')
    .update({ palate_vector: vector })
    .eq('id', profile.id)
    .select()
    .single();
  setSaving(false);
  if (error) {
    Alert.alert('Could not save', error.message);
    return;
  }
  setProfile(data);
  router.replace('/(tabs)/feed');
}
```

- [ ] **Step 2: Add local-storage fallback with per-user key**

After the error branch, before returning. **Namespace the AsyncStorage key by user id** so signing out on a shared simulator doesn't leak palate to the next user:

```typescript
if (error) {
  // If the column doesn't exist yet (migration not applied), don't wall the user.
  // Store the palate locally (per-user), set an in-memory profile stub, and continue.
  const isSchemaMissing = error.message.includes('palate_vector')
    || error.message.includes('schema cache');
  if (isSchemaMissing) {
    // Optimistically set the profile in-memory so the auth gate lets us through
    setProfile({ ...profile, palate_vector: vector } as typeof profile);
    // Persist locally, namespaced by user id, so we survive relaunch and don't leak
    try {
      await AsyncStorage.setItem(
        `@dishr/palate_vector_fallback:${profile.id}`,
        JSON.stringify(vector)
      );
    } catch { /* non-fatal */ }
    router.replace('/(tabs)/feed');
    return;
  }
  Alert.alert('Could not save', error.message);
  return;
}
```

And add the import at the top:

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
```

`@react-native-async-storage/async-storage` is already in the dependency tree (used by `lib/supabase.ts`).

- [ ] **Step 3: On profile fetch, rehydrate the fallback — in `app/_layout.tsx`, NOT the store**

**Pin this to `app/_layout.tsx` lines ~53-57**, inside the profile fetch effect, immediately after `setProfile(data)`. The store has no fetch logic, so patching it there would never run. The profile fetch effect is the only place the profile gets hydrated from Supabase, and it's where a missing `palate_vector` needs to be rescued from local storage.

Rough shape (adapt to the actual lines in _layout.tsx):

```typescript
// inside the effect that fetches profile after session change:
const { data } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', session.user.id)
  .single();

if (data) {
  // Rehydrate palate fallback if the DB row has no palate_vector
  if (!data.palate_vector) {
    try {
      const raw = await AsyncStorage.getItem(
        `@dishr/palate_vector_fallback:${data.id}`
      );
      if (raw) {
        data.palate_vector = JSON.parse(raw);
      }
    } catch { /* non-fatal */ }
  }
  setProfile(data);
}
```

This is a **local-only merge** — do NOT retry the Supabase write from here (that'd race with the profile fetch callback chain).

- [ ] **Step 3b: Clear the fallback on sign-out**

Find the sign-out handler in `app/(tabs)/profile.tsx` (or wherever `supabase.auth.signOut()` is called). Before or after the sign-out, clear the namespaced key so the next user on the same device doesn't inherit it:

```typescript
if (profile?.id) {
  try {
    await AsyncStorage.removeItem(`@dishr/palate_vector_fallback:${profile.id}`);
  } catch { /* non-fatal */ }
}
await supabase.auth.signOut();
```

- [ ] **Step 4: Retry the save opportunistically**

Optional belt-and-suspenders: after the fallback rehydrate, if there's a pending fallback AND the profile was successfully fetched from Supabase, try one more time to write the column. If it succeeds, delete the AsyncStorage key. If it fails with the same schema error, leave it alone.

Skip this step if it adds too much complexity — the local fallback alone is enough to unblock.

- [ ] **Step 5: Run type-check**

```bash
npx tsc --noEmit 2>&1 | wc -l
```

Must be ≤34.

- [ ] **Step 6: Commit**

```bash
git add app/\(onboarding\)/palate-quiz.tsx app/_layout.tsx app/\(tabs\)/profile.tsx
git commit -m "fix(onboarding): local-storage fallback when palate_vector column is missing

Gracefully handle the case where migration 006_palate_vector has not
been applied yet (or any future schema mismatch). Store the quiz
result in AsyncStorage and set the in-memory profile so the auth gate
lets the user through to the feed. Persists across relaunches.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task F5 (optional): Rehaul verify-email.tsx

**File:**
- Modify: `app/(auth)/verify-email.tsx`

**Why:** It's the one screen that didn't get touched in the v2 rehaul. Still uses `INK`, `CREAM`, `TERRA`, `BORDER` hardcoded constants. Low priority but trivial to fix now that the pattern is established.

**Skip this task if Drew is time-constrained.** Users only see verify-email for a few seconds during signup.

- [ ] **Step 1: Read the existing file**

- [ ] **Step 2: Apply the auth-screen pattern from login/signup**

- Bone background
- `◆ becipe` wordmark at top
- `<EditorialHeading>` with an emphasis word (e.g., "check your **inbox**")
- Instructions text (Inter_500Medium, muted)
- Any existing resend button styled as a sage or clay pill
- Import `react-native-safe-area-context`'s SafeAreaView

- [ ] **Step 3: Preserve existing logic** (any resend mutation, any navigation back to login)

- [ ] **Step 4: tsc + commit**

```bash
git add app/\(auth\)/verify-email.tsx
git commit -m "feat(auth): restyle verify-email to match v2 design system"
```

---

### Task F6: Final smoke test + clean status

**Files:** none edited. Verification + optional commit.

- [ ] **Step 1: Re-run tsc**

```bash
cd /Users/drewkhalil/Documents/Becipe
npx tsc --noEmit 2>&1 | wc -l
```

Must be ≤34 (baseline).

- [ ] **Step 2: Boot metro briefly**

```bash
npx expo start --no-dev --offline > /tmp/metro.log 2>&1 &
PID=$!
sleep 8
kill $PID 2>/dev/null
head -40 /tmp/metro.log
```

Check for import errors or module-not-found issues.

- [ ] **Step 3: Count commits ahead of main**

```bash
git log --oneline main..ak-ui-v2 | wc -l
```

Expected: 29-32 (was 27 after v2 rehaul, plus F2 + F3 + F4 + maybe F5).

- [ ] **Step 4: git status should be clean**

```bash
git status --short
```

Expected: same pre-existing stragglers as session start (`.env`, `supabase/.temp/cli-latest`, `docs/IDEAS-product-redesign.md`, etc.). No new files uncommitted.

- [ ] **Step 5: Tell Drew what to test**

Report which fixes landed, which commits they're in, and what Drew should now re-test on the simulator:

1. Sign up a fresh account → onboarding → palate quiz → continue → feed (should work if F1 was applied; should still work via fallback if F1 wasn't applied and F4 landed)
2. Walk through the feed, tap a recipe card, check detail → cook → voice cook → back
3. Add a recipe (manual mode first; share intent if feeling thorough)
4. Profile → sign out → log in

If he screenshots anything that looks wrong, we iterate.

---

## Self-Review Checklist

- [ ] **Spec coverage:** Every bug in the handoff doc (B1-B8) addressed?
  - B1 (blocker) → F1 (apply migration) + F4 (defensive fallback)
  - B2 (welcome CTA clipping) → F2
  - B3 (quiz header cramped) → F2
  - B4 (possibly app-wide clipping) → F3
  - B5 (gear button) → ignored (dev launcher)
  - B6 (web broken) → ignored (out of scope)
  - B7 (SafeAreaView warning) → F2 (same fix)
  - B8 (xcrun timeout) → ignored (infra)
- [ ] **Placeholder scan:** no "TBD" or "similar to prior task" — every step has a concrete action
- [ ] **Type consistency:** imports and types match across tasks
- [ ] **Dependencies:** F3 blocked on F2; F4 can run in parallel; F1 is a human action; F5 optional; F6 last

---

## Execution Notes for Subagents

1. **F1 is NOT a code task.** Don't try to apply the migration from a subagent. Ask Drew which path he's taking or note it as a human TODO at the end of the session.
2. **F2 is the highest-value code fix.** Land it first. It unblocks simulator testing visually even before F1 is applied.
3. **F4 is defensive** — land it even if F1 is "definitely happening." Schema mismatches will happen again.
4. **F3 is an audit pass**, not a rewrite. Don't restructure screens that look fine.
5. **Never push to remote.** `ak-ui-v2` stays local.
6. **If you see a new bug** not in the handoff doc, don't fix it — add it to the handoff doc under a new bug letter and flag it in the final report.
