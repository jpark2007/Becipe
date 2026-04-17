# Dishr UI Rehaul v2 — Testing Handoff

**Date:** 2026-04-15
**Branch:** `ak-ui-v2` (27 commits ahead of `main`, nothing pushed)
**Status:** Rehaul shipped, Drew tested in iOS simulator, hit a blocker.

> **If you're a fresh Claude picking this up:** The full context is in this file + the original plan at `docs/superpowers/plans/2026-04-14-ui-rehaul-v2.md` + the fix plan at `docs/superpowers/plans/2026-04-15-ui-rehaul-v2-fixes.md`. Read this first, then the fix plan, then ask Drew what he wants to tackle first.

---

## Where we are

1. Built an HTML mockup at `docs/mockups/becipe-mockup.html` (7 screens, B-language → floating plates → voice cook variant). Drew approved the design.
2. Wrote a 27-task plan on 2026-04-14: design system + palate onboarding + 6 screen restyles + mocked Circles + voice cook stub + 10 seed recipes with AI photos.
3. Plan was code-reviewed before execution; critical issues were fixed (Plate Android shadow, parsePalate guard, seed SQL pgcrypto, existing-user palate backfill).
4. Executed via subagent-driven-development in 7 batches. All 27 commits landed on `ak-ui-v2`.
5. Final review by code-reviewer agent: approved for user testing. tsc held at 34 (baseline, zero new errors).
6. Drew pulled the branch, booted iOS simulator, hit blockers (documented below).

## What got built (on `ak-ui-v2`)

### Foundation
- `lib/theme.ts` — design tokens (bone/sage/clay/ochre, Inter, spacing, radius, shadow)
- `lib/palate.ts` + `lib/palate.test.ts` — `PalateVector` type, `matchScore()`, `parsePalate()` runtime guard
- `lib/seed-images.ts` — pollinations.ai URL builder
- `supabase/migrations/006_palate_vector.sql` — adds `palate_vector jsonb` to profiles + recipes, backfills existing users with neutral vector
- `supabase/seeds/001_seed_recipes.sql` — 10 canonical recipes with palate vectors + pollinations.ai photo URLs

### Components
- `components/Plate.tsx` — circular floating plate photo (outer-shadow / inner-clip pattern for Android)
- `components/EditorialHeading.tsx` — mixed-weight headline ("What should we **cook**")
- `components/MatchPill.tsx` — sage diamond "◆ 94% match" badge
- `components/RitualCard.tsx` — clay-soft ritual card
- `components/MemberRing.tsx` — avatar ring for circle home

### Onboarding (new)
- `app/(onboarding)/_layout.tsx`
- `app/(onboarding)/welcome.tsx`
- `app/(onboarding)/palate-quiz.tsx` (5 sliders writing `profiles.palate_vector`)
- Auth gate in `app/_layout.tsx` routes new users (no palate) → onboarding → tabs

### Screens rehauled
- `app/(auth)/login.tsx`, `signup.tsx` — editorial auth
- `app/(tabs)/_layout.tsx` — tab bar restyled, `circles` tab added
- `app/(tabs)/feed.tsx` + `components/FeedCard.tsx` — chat-thread layout with floating plates + match pills
- `app/(tabs)/explore.tsx` — pill filter chips, new RecipeCard variant
- `app/(tabs)/add.tsx` — pill-tab mode selector (consolidated from 4-screen wizard)
- `app/(tabs)/circles.tsx` — mocked Circle Home with ritual card + member ring + canonical cards
- `app/(tabs)/profile.tsx` — palate readout + RecipeCard grid
- `app/recipe/[id]/index.tsx` — floating plate hero, sage match score card, ingredient mini-plates, clay "start cooking" CTA (description + steps intentionally removed — steps live in cook mode)
- `app/recipe/[id]/cook.tsx` — timer pill, big plate hero, editorial step title, clay mic button entry to voice mode
- `app/recipe/[id]/voice-cook.tsx` — NEW, dark immersive, UI-only stub (waveform, frosted caption, mic button, "ask julian" pill)
- `app/try/[id].tsx` — floating plate uploader card, ochre rating, sage tag chips
- `app/user/[id].tsx` — editorial public profile
- `components/RecipeCard.tsx` — `variant="plate"` default with floating Plate; `variant="flat"` preserved for backward compat
- `components/RatingSlider.tsx` — ochre color update

### Deliberately NOT done (see "Out of scope" in the plan)
- Real circles backend
- Voice mode functionality (Whisper / TTS / AI chat)
- `verify-email.tsx` rehaul — still uses old terra/cream palette
- Push notifications, Sentry, analytics
- Pushing `ak-ui-v2` to remote

---

## Bugs found in testing (screenshots in session log)

### 🔴 B1 — BLOCKER: `palate_vector` column missing in live Supabase

**Evidence:** After completing the palate quiz and tapping "continue →", the app errors:

> Could not save
> Could not find the 'palate_vector' column of 'profiles' in the schema cache

**Root cause:** `supabase/migrations/006_palate_vector.sql` has not been applied to the live Supabase project. The client code was written to the spec (profile row has a `palate_vector` column), but the database doesn't know about it yet.

**Impact:** **Every new account is stuck at the end of the palate quiz.** Cannot progress into the app. Existing accounts are also stuck because the backfill inside the same migration never ran, so `hasPalate` stays false and the auth gate keeps routing them to onboarding.

**Fix path:** Apply migration 006 via the Supabase dashboard SQL editor (service_role), OR via `supabase db push` if connected to the right project. See fix plan task F1.

**Nice-to-have belt-and-suspenders:** Add a defensive "continue anyway" path in the quiz so a missing column doesn't wall the user. See fix plan task F4.

---

### 🟡 B2 — Welcome screen CTA "falling off" the bottom

**Evidence:** Screenshot of `app/(onboarding)/welcome.tsx` on iPhone. The sage "let's go →" pill sits flush against the bottom of the screen — below the iPhone home indicator safe area. Visually it looks clipped.

**Root cause:** `welcome.tsx` uses React Native's built-in `SafeAreaView` from `'react-native'`, which is deprecated in RN 0.83 and does not reliably handle the home-indicator bottom inset on modern iPhones. The file hardcodes `marginBottom: 32` on the CTA, which is insufficient.

**Scope check:** This is **likely app-wide** for any screen using bone/bottom-anchored CTAs. These files import `SafeAreaView` from `'react-native'`:

- `app/(onboarding)/welcome.tsx`
- `app/(onboarding)/palate-quiz.tsx`
- `app/(tabs)/circles.tsx`
- `app/recipe/[id]/voice-cook.tsx`
- `app/recipe/[id]/index.tsx`
- (plus older screens that may or may not be affected — `verify-email.tsx`, etc.)

**Fix path:** Swap `import { SafeAreaView } from 'react-native'` → `import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context'` across every screen. `react-native-safe-area-context` is already in the dependency tree (Expo ships with it). For screens with bottom-anchored CTAs, also use `edges={['top', 'bottom']}` and/or `useSafeAreaInsets()` to add explicit padding. See fix plan task F2.

**Side benefit:** Fixes the "SafeAreaView has been deprecated" warning already showing in the Metro log.

---

### 🟡 B3 — Palate quiz header crowded / ← button cramped to left

**Evidence:** Screenshot of `palate-quiz.tsx`. The back arrow `←`, "step 1 of 1" text, and right-side spacer are all flush to the screen edges. No breathing room at the top.

**Root cause:** Same SafeAreaView issue from B2 — top inset isn't being honored. The header row sits under the status bar / notch area.

**Fix path:** Same fix as B2. Once `react-native-safe-area-context`'s `SafeAreaView` is wired with `edges={['top', 'bottom']}`, the top inset will push the header below the notch.

---

### 🟡 B4 — Possible app-wide "content falling off screen"

**Drew's note:** "that not fitting on screen thing might be app-wide so have it check"

**Suspected scope:** Any screen with:
- A sticky bottom CTA (welcome, palate-quiz, recipe detail, try, cook mode, voice cook)
- A full-bleed hero that assumes full screen height (recipe detail, cook mode, voice cook)
- A ScrollView without explicit `contentContainerStyle={{ paddingBottom: X }}`

**Fix path:** Audit all 15 rehauled screens. For each one:
1. Check which SafeAreaView it uses
2. Check `paddingBottom` on any ScrollView / content container
3. Check bottom margins on CTAs
4. On iPhone 15/16 simulator, verify nothing clips under the home indicator or tab bar

See fix plan task F3.

---

### 🟢 B5 — Gear icon in top-right of welcome screen (IGNORE)

**Evidence:** Blue gear button visible in top-right of welcome screenshot.

**Root cause:** Expo dev launcher (development-only UI). Not our code. Won't ship.

**Fix:** None needed.

---

### 🟢 B6 — Web is broken (IGNORE for now)

**Drew's note:** "web broke UI so i have to do simulator"

**Root cause:** React Native Web doesn't render shadow props identically, `ImageBackground` + absolute positioning gets flaky, floating plate math is platform-finicky.

**Fix:** Out of scope — iOS is the target. Web can stay broken until someone asks for it.

---

### 🟢 B7 — SafeAreaView deprecation warning (rolled into B2)

Already captured in B2. Fix is the same.

---

### 🟢 B8 — xcrun simctl timeout on first launch (IGNORE)

**Evidence:** `xcrun simctl openurl ... exited with non-zero code: 60 / Operation timed out`

**Root cause:** Infrastructure hand-off issue when Expo asks xcrun to open the simulator URL. Not our code.

**Fix:** None. If it happens again, cold-reset the simulator (`⌘+K`) or close Simulator.app and rerun `npx expo start`.

---

## Test coverage so far

Drew tested: **welcome → palate-quiz** (blocked at save).

**Not yet tested** (blocked by B1):
- Feed (chat thread with floating plates, match pills)
- Recipe detail (floating plate hero, match score card)
- Cook mode (swipe gestures, keep-awake, editorial step title)
- Voice cook mode (dark screen, waveform, mic button)
- Try log (floating plate uploader, ochre rating)
- Profile (palate readout, recipe grid)
- Circles (mocked — ritual card, member ring)
- Explore (pill chips, search, smart sort)
- Add (pill-tab mode selector, share intent, URL import)
- User profile (follow/unfollow, recipe grid)
- Auth login/signup (editorial layout)

---

## Next-session priorities (in order)

1. **Unblock the quiz** — apply migration 006 to the live Supabase (F1). This alone lets Drew get past onboarding and test the rest of the app.
2. **Fix the safe-area bug** — swap SafeAreaView imports across 4-5 files (F2). This alone probably fixes B2, B3, and most of B4.
3. **Audit all rehauled screens for clipping** (F3) — short pass after F2 lands, verify on simulator.
4. **Add defensive quiz fallback** (F4) — optional, makes the app resilient to future schema mismatches.
5. **Drew screenshots the rest of the flow**, we iterate on anything else that's off.

Full step-by-step in `docs/superpowers/plans/2026-04-15-ui-rehaul-v2-fixes.md`.

---

## How Drew runs the app

```bash
git checkout ak-ui-v2
npm install              # @expo-google-fonts/inter + @react-native-community/slider already pinned
npx expo start           # press i for iOS simulator, w for web (broken)
```

Drew is on a Mac; iOS simulator on M-series; web can stay broken.

## Supabase access situation (as of last session memory)

Drew does not have his own Supabase access — jpark2007 owns the project. This matters for B1 because applying migration 006 requires dashboard/service-role access. Options:
- Drew asks jpark2007 to apply it via the Supabase dashboard SQL editor
- Drew gets service_role access for dev
- Someone runs `supabase db push` from a machine with access

Next Claude should confirm which path Drew is taking before trying to write code around it.
