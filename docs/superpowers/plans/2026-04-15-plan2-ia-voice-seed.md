# Plan 2 — IA + Voice + Seed Content + Circles Table + App Name

**Date:** 2026-04-15
**Branch:** `ak-ui-v2` (local only, do NOT push, do NOT merge)
**Baseline tsc:** 34 lines. Must stay ≤34.

**Designed to run in parallel with Plan 1.** Files in this plan do NOT overlap with Plan 1 files.

## Files this plan touches

- Modify: `app/(tabs)/_layout.tsx`
- Modify: `app/(tabs)/add.tsx`
- Modify: `app/(tabs)/circles.tsx`
- Modify: `app/recipe/[id]/voice-cook.tsx`
- Modify: `app.json`
- Create: `app/voice-dictate.tsx` (new route for voice recipe dictation stub)
- Create: `components/WoodenTable.tsx` (new component)
- Create: `lib/ingredients.ts` (new, static ~500 ingredient list)
- Create: `supabase/migrations/007_seed_becipe_content.sql` (Drew will apply via dashboard)

**Files Plan 1 owns** — do NOT touch: `app/(tabs)/feed.tsx`, `app/(tabs)/profile.tsx`, `app/(tabs)/explore.tsx`, `app/recipe/[id]/index.tsx`, `components/EditorialHeading.tsx`.

---

## Context

Drew confirmed these design decisions — treat them as fixed:

- **Tab IA**: 4 content tabs (Home / Explore / Circles / You) + a center "+" floating button for Add. "Home" is a relabel of the current Discover tab. Add is no longer its own content tab.
- **Voice entry**: small mic icon in the Add screen's top header row next to the save button. Opens a voice dictation route. Voice is OPTIONAL — just needs to be findable.
- **Voice cook mode**: UI stub stays, but add real state labels (idle / listening / thinking / speaking) and a fake cycle. Backend deferred.
- **Circles visual**: wooden table SVG with avatars seated around the rim, replacing the current floating MemberRing.
- **Circles flow**: fully navigable with mocked data. Ritual CTA → Add screen with prefilled description. Member avatar → user profile route. Canonical recipe → recipe detail route. No new backend yet.
- **Seed content**: official `@becipe` author profile + ~50 curated canonical recipes with pollinations.ai photo URLs + palate vectors. Drew applies the migration manually via Supabase dashboard.
- **Ingredient dictionary**: static `lib/ingredients.ts` exporting an array of ~500 common ingredients, wired into the Add screen's ingredient name field as a simple suggestion list below the input.
- **App name**: `app.json` `name` + `slug` → `becipe`. Bundle ID stays `com.dishr.app` (don't break TestFlight if it's been submitted).

---

## Tasks (execute in order, commit per task)

### P2.A — Tab restructure: 4 tabs + center "+" button

**File:** `app/(tabs)/_layout.tsx`

Goal: tab bar shows 4 content tabs (Home / Explore / Circles / You) with a visually prominent center "+" button in the Add slot. Tapping the "+" navigates to `/(tabs)/add`.

**Approach:** use expo-router's `tabBar` prop to render a custom tab bar. The 5 slots render as: [Home][Explore][+center][Circles][You]. The center "+" button is a clay-colored circle (~56pt), slightly lifted above the tab bar baseline.

**Steps:**

1. Replace the current `<Tabs screenOptions={…}>` block with a `<Tabs tabBar={(props) => <CustomTabBar {...props} />} screenOptions={{ headerShown: false }}>`.

2. Define `CustomTabBar` above the default export (same file). It receives `state`, `descriptors`, `navigation` as props.

3. CustomTabBar renders a row of 5 slots in this order: `feed` (label "Home"), `explore` (label "Explore"), `add` (center "+" button), `circles` (label "Circles"), `profile` (label "You"). Wait — Circles should be to the right of the "+", and "You" rightmost. So the visual order is: Home | Explore | [+] | Circles | You. That means the tab bar row renders in that order regardless of what order `state.routes` gives us.

4. For the `add` slot, render a `<Pressable>` that is a clay circle `width: 56, height: 56, borderRadius: 28`, marginTop `-18` to lift above the tab bar baseline, with a `+` glyph in white (fontSize 24, Inter_800ExtraBold). On press, call `navigation.navigate('add')`.

5. For the other 4 slots, render a `<Pressable>` with a small icon (keep the existing glyphs: `⊟`, `◎`, `◯`, `◈`) + label text, styled like the current inactive tabs (Inter_600SemiBold 10pt, color from `colors.muted` / `colors.ink` based on focused).

6. Tab bar container style: `flexDirection: 'row'`, `alignItems: 'center'`, `justifyContent: 'space-around'`, `backgroundColor: colors.bone`, `paddingBottom: 22`, `paddingTop: 12`, `borderTopColor: 'transparent'` (REMOVE the borderTopWidth: 1 — this was causing the "bar above tabs" bug on Circles).

7. Keep `Tabs.Screen` entries for all 5 files. Rename titles:
   - `feed`: title `'Home'` (was 'Discover')
   - `explore`: title `'Explore'` (unchanged)
   - `circles`: title `'Circles'` (unchanged)
   - `add`: title `'Add'` (unchanged — hidden from visual tab bar but still a route)
   - `profile`: title `'You'` (unchanged)

8. Run `npx tsc --noEmit 2>&1 | wc -l`. Must be ≤34.

9. Commit:
   ```
   feat(tabs): 4-tab layout with center + floating add button
   ```

**Acceptance:** On iPhone 15 simulator, the tab bar shows Home, Explore, [+], Circles, You. Tapping + opens the Add screen. No horizontal border line between content and tab bar.

---

### P2.B — Add screen: mic icon + ingredient autocomplete

**File:** `app/(tabs)/add.tsx`

**Two additions**:

1. **Mic icon in the header row** (next to the save button when the manual form is open).

   In the `headRow` View (~line 458), add a third child between the `←` back button and the `save →` button: a pressable mic icon button styled like the back button (`styles.iconBtn` pattern, 40x40 circle). Glyph: 🎤 (or "mic" text). onPress: `router.push('/voice-dictate')`.

   The header row currently has `justifyContent: 'space-between'` with back on left and save on right. Change the layout so the mic sits just left of the save button, with a small gap. Either wrap mic + save in a View with `flexDirection: 'row'`, `gap: 10`, or switch the headRow to use `justifyContent: 'space-between'` with a right-side View containing mic + save.

2. **Ingredient autocomplete** from `lib/ingredients.ts`.

   When the user is typing in an ingredient `name` field (~line 611), show suggestions below the row: a horizontal scroll of chips with matching ingredient names (case-insensitive substring match on the typed value, limit 6). Tapping a chip fills that ingredient row's `name`.

   State: add `const [activeIngIdx, setActiveIngIdx] = useState<number | null>(null);` and show suggestions only for the row being edited.

   Matching logic: `INGREDIENTS.filter(i => i.toLowerCase().includes(query.toLowerCase())).slice(0, 6)`. Import `INGREDIENTS` from `@/lib/ingredients`.

   Visual: suggestions rendered as small pressable chips in a `ScrollView horizontal`, below the ingredient row that's currently focused. Use existing `styles.chip` / `styles.chipInactive` styling — 12px horizontal padding, 6px vertical, borderRadius 999.

3. Run tsc, must be ≤34.

4. Commit:
   ```
   feat(add): mic icon entry + ingredient autocomplete from static dictionary
   ```

**Acceptance:** Header row has back (left), mic + save (right). Tapping mic navigates to `/voice-dictate`. Typing "oli" in an ingredient name field shows "olive oil", "olives", etc. as chips; tapping fills the field.

---

### P2.C — Voice dictation new route (stub)

**File:** `app/voice-dictate.tsx` (new)

Goal: a UI-only stub screen where the user taps a mic, sees fake "listening → thinking → done" states, and then gets a "use this" CTA that populates the Add form with a hardcoded sample recipe. No real speech recognition.

**Screen spec:**

- Uses `SafeAreaView` from `react-native-safe-area-context`
- Bone background
- Top row: back button (← circle) left, title "voice dictate" muted 11pt uppercase
- Big EditorialHeading: `Tell me a` + emphasis `recipe` in clay
- Helper text muted: "tap the mic and say: 'miso salmon with glazed cucumbers…' — we'll fill in the details"
- State enum: `'idle' | 'listening' | 'thinking' | 'done'`
- Center state label (uppercase, letter-spaced): "TAP TO START" / "● LISTENING…" / "◌ THINKING…" / "✓ GOT IT"
- Big clay mic button in center (~96pt circle), pulses or just scales when active (optional)
- Below: a caption card that shows "what we heard" — in the `listening` state, shows "…" dots; in `thinking`, shows a hardcoded placeholder; in `done`, shows a fake recipe summary (title, ~5 ingredients, 3 steps in abbreviated form)
- Bottom: when state is `done`, show two buttons side by side: "cancel" (outline) and "use this →" (clay solid). cancel → `router.back()`. use this → store the fake recipe in a zustand store (or pass via search params) and `router.replace('/(tabs)/add')`.
- For simplicity, skip the zustand plumbing. Instead: tap "use this" → alert "voice dictation coming soon" and `router.back()`. Drew explicitly said "backend deferred, UI only" — the stub just needs to look real. A real handoff to Add can come later.

**State machine (fake):**
```tsx
async function simulateDictation() {
  setState('listening');
  await sleep(2000);
  setState('thinking');
  await sleep(1500);
  setState('done');
}
```

**Route registration:** since this is outside `(tabs)`, it's a stack route at the app root. expo-router picks it up automatically from `app/voice-dictate.tsx`. It'll push on top of the tab navigator.

**Steps:**
1. Create `app/voice-dictate.tsx` with the above structure. Keep it under ~200 lines.
2. Run tsc, must be ≤34.
3. Commit:
   ```
   feat(voice): voice dictation stub route (UI only, backend deferred)
   ```

**Acceptance:** From Add screen, tapping the mic navigates to voice-dictate. Tapping the center mic cycles through listening → thinking → done states with placeholder caption. "use this" shows a coming-soon alert and returns.

---

### P2.D — Voice cook mode UI depth

**File:** `app/recipe/[id]/voice-cook.tsx`

Current state: dark immersive stub with hardcoded "LISTENING" label. Drew wants the UI to reflect a real voice-cook flow even though backend is deferred.

**Changes:**

1. Replace `const stepIndex = 2;` (hardcoded) with a real `useState` that cycles via next/back buttons. Default to `0`. The back/next buttons at the bottom (currently no-op) should mutate this state with bounds checking.

2. Add state enum: `'idle' | 'listening' | 'thinking' | 'speaking'`. Start at `'listening'`. Tapping the center mic toggles between `listening` and `idle`. Add fake auto-transitions: after 3s of `listening`, flip to `thinking` for 1.5s, then `speaking` for 2s, then back to `listening`. Use `setTimeout` chains.

3. Replace the hardcoded `● LISTENING` label with `styles.capLabel` reading the current state in uppercase. Color by state: listening = `#E8B87C` ochre-ish (current), thinking = `rgba(255,255,255,0.6)` dim, speaking = `#C8E6C9` sage-ish, idle = `rgba(255,255,255,0.4)`.

4. The caption text `capText` reads from `steps[stepIndex]` if available, else the current placeholder. Already works — just wire stepIndex to state.

5. The `← back` / `next →` buttons should call `setStepIndex(i => Math.max(0, i-1))` and `setStepIndex(i => Math.min(steps.length - 1, i+1))`.

6. Run tsc, must be ≤34.

7. Commit:
   ```
   feat(voice-cook): real step navigation + cycling state label (backend still stub)
   ```

**Acceptance:** In voice cook mode, back/next buttons advance the step and update the caption. The state label cycles through listening/thinking/speaking automatically with visible color changes. Mic button toggles idle/listening.

---

### P2.E — Circles wooden table + flow wiring

**Files:** `app/(tabs)/circles.tsx`, new `components/WoodenTable.tsx`

**Part 1: New `WoodenTable` component**

Create `components/WoodenTable.tsx`. It takes a `members: Array<{ initial, name, twin, color }>` prop and renders an SVG round table with avatars positioned around the rim.

**Approach:** use `react-native-svg` (already in the Expo stack — check with `npm list react-native-svg`; if missing, instruct Drew to install and abort this task). Render:

- A central filled circle `radius=90` with fill `#C9A875` (wood), stroke `#8B6F47` width 4
- A darker inner ring `radius=78` stroke `#8B6F47` width 1.5 for the wood grain effect (just decorative)
- A small centered text `"THE TABLE"` in Inter_700Bold 9pt, color `#F4E8D6`, letter-spaced 2

Then position React Native `<View>` avatar chips absolutely around the SVG circle's perimeter using trig. For N members, angle = `(i / N) * 2π - π/2` (start at top), `x = cx + R * cos(angle)`, `y = cy + R * sin(angle)` where R is ~130 (slightly outside the table radius so avatars "sit at" the edge).

Each avatar: 56x56 circle, the `color` prop as background, centered initial in white 20pt Inter_800ExtraBold. Below each avatar, a two-line label: member name (Inter_700Bold 12pt ink) and twin % (Inter_500Medium 10pt sage or muted for "—").

Component total dimensions: ~320 wide × 320 tall. Container is a square View with the SVG and absolute-positioned member chips.

**If react-native-svg is not installed:** fall back to a pure-View implementation: use a circular `View` with a border and radial gradient (or just solid wood color), skip the stroke grain detail. The key visual is "avatars arranged around a round surface in the middle." Aesthetic purity > exact fidelity.

**Part 2: Wire Circles flow**

In `app/(tabs)/circles.tsx`:

1. Replace `<MemberRing members={MOCK_MEMBERS} />` with `<WoodenTable members={MOCK_MEMBERS} />`.

2. Remove the `MemberRing` import.

3. Make the ritual card's CTA actually navigate. The RitualCard component has no onClick currently — wrap it in a `<Pressable onPress={...}>` that calls `router.push('/(tabs)/add')`. Import `useRouter` at the top.

4. Make canonical recipe cards tappable. Wrap the inner `<View style={styles.canonCard}>` in a `<Pressable onPress={() => router.push(`/recipe/${mockRecipeId}`)}>`. Since the mock data has no real IDs, use placeholder UUIDs `'00000000-0000-0000-0000-000000000101'` and `...0102` as the `id` field on each `MOCK_CANON` entry. These won't resolve to real recipes yet (they hit the recipe detail screen which will show its loading state then a not-found), which is OK — flow is wired, content is future work.

5. Make member avatars tappable. Wrap each member chip in the WoodenTable component in a Pressable that calls `router.push('/user/00000000-0000-0000-0000-000000000001')` (a hardcoded fake profile UUID). The WoodenTable component should accept an `onMemberPress?: (idx: number) => void` prop so the tap handler is injected from circles.tsx, not baked into the component.

6. Fix the `paddingBottom: 60` → `100` on the ScrollView (line ~25) so content clears the tab bar. (The "bar above tabs" bug is also fixed by P2.A's removal of `borderTopWidth`.)

7. Remove the demo banner at top (lines 26-28) — it's no longer accurate since the flow is real now (even if content is mocked).

8. Run tsc, must be ≤34.

9. Commit:
   ```
   feat(circles): wooden table visual + navigable ritual/member/recipe flow
   ```

**Acceptance:** On Circles tab, see a wooden round table with 4 avatars seated around it. Ritual card tap → Add screen. Canonical recipe tap → recipe detail (may show not-found or loading for now, that's expected). Member avatar tap → user profile route. No bar above tab bar.

---

### P2.F — App name → "becipe"

**File:** `app.json`

**Changes:**
1. `expo.name`: `"Dishr"` → `"becipe"`
2. `expo.slug`: `"dishr"` → `"becipe"`
3. `expo.scheme`: `"dishr"` → `"becipe"`
4. `expo.plugins[expo-image-picker].photosPermission`: `"Allow Dishr to access…"` → `"Allow becipe to access your photos to add pictures to recipes."`

**Do NOT change:**
- `expo.ios.bundleIdentifier` (`com.dishr.app`) — changing breaks any existing TestFlight build
- `expo.android.package` — same reason

5. Run tsc, must be ≤34.

6. Commit:
   ```
   chore(brand): rename app to becipe in app.json (bundle id unchanged)
   ```

---

### P2.G — Ingredient dictionary

**File:** `lib/ingredients.ts` (new)

Export a sorted array of ~500 common ingredients. Keep it lowercase, singular where possible, no brand names. Group the file into sections with comments (proteins, vegetables, fruits, dairy, grains/starches, pantry/spices, herbs, condiments, fats/oils, sweeteners, beverages/alcohol, other) for readability but export as a single flat array.

**Format:**
```typescript
// lib/ingredients.ts
// Static ingredient dictionary for Add-recipe autocomplete.
// Free, offline, no API dependency. Upgrade to a Supabase table later if needed.

export const INGREDIENTS: string[] = [
  // Proteins
  'chicken breast', 'chicken thigh', 'ground beef', 'steak', 'pork shoulder',
  'pork belly', 'bacon', 'salmon', 'tuna', 'shrimp', 'cod', 'tilapia',
  'tofu', 'tempeh', 'eggs', 'egg whites',
  // ... (aim for ~500 total)
];
```

**Curate the list:** aim for ~500 entries covering the obvious essentials. If time is short, 300 is fine. Do not exceed 600. Duplicates will break autocomplete — sort at the end and run through a Set.

At the bottom of the file:
```typescript
// Deduplicate + sort alphabetically for consistent lookup
export const INGREDIENTS_SORTED = Array.from(new Set(INGREDIENTS)).sort();
```

Export both. `add.tsx` should import `INGREDIENTS_SORTED`.

**Steps:**
1. Create the file with ~500 curated ingredients.
2. Run tsc, must be ≤34.
3. Commit:
   ```
   feat(ingredients): static dictionary of ~500 common ingredients for autocomplete
   ```

**Acceptance:** File exists, exports a sorted unique array, type-checks clean.

---

### P2.H — Seed migration: official @becipe + ~50 canonical recipes

**File:** `supabase/migrations/007_seed_becipe_content.sql` (new)

Drew will apply this manually via the Supabase dashboard SQL editor. Keep it idempotent where possible.

**Structure:**

1. Insert the official @becipe profile row with a FIXED UUID (hardcode a value so seed recipes can reference it). Use `'00000000-0000-0000-0000-0000000becee'` as the UUID.

   ```sql
   insert into profiles (id, username, display_name, palate_vector, created_at)
   values (
     '00000000-0000-0000-0000-0000000becee',
     'becipe',
     'becipe',
     '{"salt":55,"sweet":50,"umami":60,"spice":45,"acid":50}'::jsonb,
     now()
   )
   on conflict (id) do nothing;
   ```

2. Insert ~50 canonical recipes, all `created_by = '00000000-0000-0000-0000-0000000becee'`. Each recipe has:
   - Title
   - Description (1 sentence)
   - Cuisine (one of the existing CUISINES values in lib/smart-sort.ts)
   - Difficulty (easy | medium | hard)
   - prep_time_min, cook_time_min, servings
   - `cover_image_url`: a pollinations.ai URL with a descriptive prompt and a unique seed. Format: `https://image.pollinations.ai/prompt/<url-encoded-prompt>?width=800&height=800&seed=<num>&nologo=true`
   - `palate_vector`: curated 5-axis JSON
   - `ingredients`: JSON array of `{amount, unit, name}`
   - `steps`: JSON array of `{order, instruction}`
   - `is_public`: true
   - `tags`: array containing the cuisine

**Curation goals:**
- Diverse cuisines: Italian, Japanese, Mexican, Indian, French, Chinese, Thai, Middle Eastern, American, Mediterranean
- Mix of meal types: breakfast, lunch, dinner, snack
- Mix of difficulty: ~20 easy, ~20 medium, ~10 hard
- Good pollinations.ai prompts: short, descriptive, "overhead food photography" adds consistency
- Palate vectors that feel honest (e.g., kimchi stew should be high salt + spice + umami, low sweet)

**Aim for 50 recipes.** Use a single large `insert into recipes (…) values (…), (…), …;` statement for speed.

**Steps:**
1. Create the SQL file.
2. At the top include a comment block explaining how to apply it:
   ```sql
   -- Apply via Supabase dashboard SQL editor (service_role context).
   -- Creates the official @becipe profile and seeds ~50 canonical recipes
   -- authored by it, each with pollinations.ai cover photos and palate vectors.
   ```
3. Commit:
   ```
   feat(seed): official @becipe profile + 50 canonical recipes migration
   ```

**Acceptance:** SQL file exists, is syntactically valid SQL (test by reading through it — no unclosed quotes, all JSON valid, all UUIDs well-formed). Drew will apply and verify.

---

## Self-verify before final report

After all P2 tasks:

1. `npx tsc --noEmit 2>&1 | wc -l` → must be ≤34.
2. `git log --oneline main..ak-ui-v2 | wc -l` — should have grown by the number of P2 commits you made (~8).
3. `git status --short` — should show only pre-existing stragglers (`.env`, `supabase/.temp/cli-latest`, etc.), no new uncommitted files.
4. Report back with:
   - Which tasks completed
   - Any tasks blocked (and why)
   - Final tsc count
   - List of commit SHAs in order
   - What Drew needs to do manually (apply the seed SQL, restart metro, etc.)

---

## Do NOT

- Push to remote
- Switch branches
- Touch any Plan 1 file: `feed.tsx`, `profile.tsx`, `explore.tsx`, `recipe/[id]/index.tsx`, `components/EditorialHeading.tsx`
- Change bundle identifiers in app.json
- Change any existing Supabase migration files (create 007 fresh)
- Install new npm dependencies without Drew's approval (use existing deps; fall back to pure RN if a lib is missing)
- Restructure or refactor unrelated code
- Run the simulator (Drew will verify)

## If blocked

- If `react-native-svg` is missing → fall back to pure View circle for P2.E, note it in the report.
- If tsc grows above 34 → inspect the new errors, fix them, re-check. Don't commit until at or below baseline.
- If a task requires a decision Drew didn't anticipate → make the smallest reasonable choice and note it in the final report.
