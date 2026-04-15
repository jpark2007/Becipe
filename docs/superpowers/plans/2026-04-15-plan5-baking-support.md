# Plan 5 — Baking Support

**Date:** 2026-04-15
**Branch:** `ak-ui-v2` or a new branch
**Run in:** a new chat. Narrow scope — unit audit + conversions + metadata. No schema changes.

## Context

Drew asked: "also this should support baking right." Baking is a specific kind of cooking where precision matters: weight beats volume, temperature precision matters, pan size affects outcomes, and substitution ratios are unforgiving (you can't swap butter for oil 1:1 in a cake).

The current app treats baking as "just another recipe" — same ingredient input, same step list, same detail view. This plan tightens a few specific surfaces to make baking recipes more usable without rebuilding anything.

**Best run after Plan 4 (Ask Julian)** since Julian is the substitution authority and needs bake-aware answers — which Plan 4 already implements.

## Scope

1. Audit and expand ingredient unit coverage in the add-recipe form
2. Add a metric ↔ imperial toggle on recipe detail
3. Add a Fahrenheit ↔ Celsius toggle for temperature values
4. Add a "pan size" field on recipes and display it on detail
5. Ensure step timers are tappable (baking steps like "bake for 35 minutes" should start a timer inline)

## Out of scope

- Full metric-first recipe rewriting
- Altitude adjustment (future, rare use case)
- Humidity adjustment (future, expert-only)
- Full baking book / tutorial content
- Scale-to-fit calculator beyond pan size (e.g. scale a 6-egg cake to 4 eggs — Julian handles that via Ask Julian, Plan 4)

---

## Task 1 — Ingredient unit coverage audit

**File:** `app/add-recipe.tsx` (the ingredient row component)

**Verify the unit picker supports all of these:**

| Category | Units |
|----------|-------|
| Volume (imperial) | tsp, tbsp, fl oz, cup, pint, quart, gallon |
| Volume (metric) | ml, l |
| Weight (imperial) | oz, lb |
| Weight (metric) | g, kg |
| Count | whole, large, small, medium, pinch, dash, handful, clove, bunch, sprig, sheet, slice |
| Temperature (recipe field, not ingredient) | °F, °C |

**Implementation:**
- Find where the ingredient row's unit input lives
- If it's a free-text field, leave it (users can type anything)
- If it's a dropdown, verify the above units are options
- Add any missing ones
- Group them logically in the picker: "Volume · Weight · Count" with headers

**Gotcha:** the existing 500-ingredient autocomplete dictionary (`lib/ingredients.ts`) may suggest typical units per ingredient. If so, update it to include baking staples with their common units (e.g. "flour" → "g" or "cup"; "butter" → "g" or "tbsp"). Check and expand if present.

**Commit:** `feat(add-recipe): full baking unit coverage`

## Task 2 — Metric ↔ Imperial toggle on recipe detail

**File:** `app/recipe/[id]/index.tsx`

**Feature:** a small toggle at the top of the ingredient list — `g / oz · metric · imperial`. Tapping switches all ingredient amounts to the selected system, computed client-side.

**Conversion table (partial, implementer fills in):**

```ts
// lib/unit-convert.ts
export const CONVERSIONS: Record<string, { to: string; factor: number }> = {
  cup:  { to: 'ml',  factor: 236.588 },
  tbsp: { to: 'ml',  factor: 14.787 },
  tsp:  { to: 'ml',  factor: 4.929 },
  oz:   { to: 'g',   factor: 28.3495 },  // weight oz
  'fl oz': { to: 'ml', factor: 29.5735 },  // volume oz
  lb:   { to: 'g',   factor: 453.592 },
  pint: { to: 'ml',  factor: 473.176 },
  quart: { to: 'ml', factor: 946.353 },
  gallon: { to: 'l', factor: 3.78541 },
};

export function convertIngredient(
  amount: number,
  unit: string,
  system: 'metric' | 'imperial'
): { amount: number; unit: string } {
  // Look up conversion, round sensibly
  // If unit is already in the target system, return as-is
  // If unit is a count (whole, pinch), return as-is
}
```

**UX:**
- Toggle stored in a Zustand store slice (`unitSystem: 'metric' | 'imperial'`) with AsyncStorage persist
- User's preference is global (applies to all recipes)
- Default: detect from device locale — imperial for US, metric elsewhere
- Rounding: metric rounds to nearest 5g or 5ml; imperial rounds to nearest 1/4 cup or 1 tbsp where reasonable

**Commit:** `feat(recipe): metric/imperial unit toggle with conversion`

## Task 3 — Fahrenheit ↔ Celsius toggle

**File:** `app/recipe/[id]/index.tsx`

**Feature:** same toggle context, applies to any temperature values in step text.

**Detection:** regex parse step text for patterns like `\d+\s*°?\s*[FC]` or `\d+\s*degrees`. Replace inline when rendering.

```ts
// lib/temp-convert.ts
export function fahrenheitToCelsius(f: number): number {
  return Math.round(((f - 32) * 5) / 9);
}
export function celsiusToFahrenheit(c: number): number {
  return Math.round((c * 9) / 5 + 32);
}

export function convertTemperatureText(
  stepText: string,
  targetSystem: 'F' | 'C'
): string {
  // Regex match, convert, reassemble
}
```

**Storage:** step text stays in whatever system the creator entered it in. Display layer does the conversion.

**UX:** bound to the same `unitSystem` toggle as Task 2 (`metric` = C, `imperial` = F).

**Commit:** `feat(recipe): temperature unit conversion (F ↔ C)`

## Task 4 — Pan size field

**File:** `app/add-recipe.tsx` and `app/recipe/[id]/index.tsx`

**Feature:** add an optional `pan_size` text field on recipes. Display on detail below the stats row ("serves 8 · 55 min · medium · 9x13 baking dish").

**Schema:** the `recipes` table may already have this column. Check `supabase/migrations/001_initial_schema.sql`. If not, this plan requires **migration 012** to add the column:

```sql
-- supabase/migrations/012_recipe_pan_size.sql
alter table recipes
  add column if not exists pan_size text;
```

**Input on add-recipe:** a single text input with placeholder examples: "9x13, 8x8, 10-inch round, loaf pan, sheet pan…"

**Display on recipe detail:** in the `statRow` alongside servings/time/difficulty, if `pan_size` is non-null.

**Free text, not picker:** avoid over-engineering. Users know their pans.

**Commit:** `feat(recipe): optional pan_size field for baking`

## Task 5 — Tappable step timers

**File:** `app/recipe/[id]/cook.tsx` (cook mode)

**Feature:** when a step contains a duration ("bake for 35 minutes", "let rest 10 minutes"), show a tappable "⏱ 35 min" chip next to the step. Tapping starts an in-app countdown timer.

**Detection:** regex parse step text for `(\d+)\s*(minute|min|second|sec|hour|hr)`.

**Timer UI:**
- Small chip inline with step text: "⏱ 35 min" (ochre, pill-shaped)
- Tap → full-screen timer modal with countdown
- Chimes at end (use `expo-av` or `expo-haptics`)
- User can dismiss timer and keep cooking
- Multiple timers allowed (a pot at 10 min AND a bake at 30 min) — stack them in the top-right of cook mode

**Implementation:** new `lib/timers.ts` helper, new `components/StepTimerChip.tsx` component, new `app/timer-overlay.tsx` full-screen modal.

**Notification permission:** ask on first timer start. If granted, schedule a local notification at timer end (so user is alerted even if app is backgrounded). Use `expo-notifications`.

**Commit:** `feat(cook): tappable inline step timers with notifications`

---

## Task list

- [ ] `app/add-recipe.tsx` — full unit coverage audit + expansion
- [ ] `lib/ingredients.ts` — include baking-common units per ingredient (if structured that way)
- [ ] `lib/unit-convert.ts` — new file with conversion helpers
- [ ] `lib/temp-convert.ts` — new file with temperature helpers
- [ ] `store/preferences.ts` — new Zustand slice for `unitSystem` with AsyncStorage persist; default from device locale
- [ ] `app/recipe/[id]/index.tsx` — metric/imperial toggle at top of ingredients, apply conversion to amount + unit
- [ ] `app/recipe/[id]/index.tsx` — temperature conversion in step text rendering
- [ ] `supabase/migrations/012_recipe_pan_size.sql` — add column (Drew runs)
- [ ] `app/add-recipe.tsx` — pan_size input field
- [ ] `app/recipe/[id]/index.tsx` — pan_size in stat row
- [ ] `components/StepTimerChip.tsx` — new
- [ ] `app/timer-overlay.tsx` — new full-screen timer
- [ ] `lib/timers.ts` — timer state helper
- [ ] `app/recipe/[id]/cook.tsx` — detect durations in step text, render timer chips
- [ ] `expo-notifications` permission prompt on first timer start
- [ ] Notification on timer complete

---

## Testing

1. Add Recipe: pick an ingredient, see all units in the picker (tsp → lb → g → kg)
2. Recipe detail: toggle metric — "2 cups flour" becomes "473 ml flour" (or "240 g" for flour specifically? — see note below)
3. Toggle imperial: flips back to volume
4. Step text: "bake at 350°F for 35 minutes" — in metric mode shows "bake at 177°C for 35 minutes"
5. Cook mode: tap "⏱ 35 min" chip on the bake step → timer starts, ring at end (or notification if backgrounded)
6. Add Recipe: pan_size input accepts "9x13", saves, shows on detail

### Note on flour conversion

Flour is weight-first in baking — volume is wildly imprecise. Ideal conversion of "1 cup flour" is "120 g" (sifted) or "125 g" (spooned) or "140 g" (scooped). This plan ships a *generic* volume→ml conversion; a flour-specific density table is **Future Work** or is handled by Ask Julian when the user asks.

## Done =

- All baking-relevant units available in add-recipe
- Global metric/imperial toggle persists across sessions
- Temperature toggle works in step text
- Pan size field available and displayed
- Step timers work with notifications
- tsc baseline held

## Notes

- **expo-notifications setup** is a small ceremony — permission request, permission handler, notification scheduling. Follow Expo docs exactly. This is the main risk for this plan.
- **Conversion rounding** is an aesthetic decision. Aim for user-friendly numbers ("1/4 cup → 60 ml", not "59.147 ml"). Match any existing app conventions.
- **Density-aware conversions** (flour → g via density) are out of scope. Flag as Future Work if a user complains.
- **Pairs with Ask Julian** — Plan 4 already has baking awareness in the system prompt. If a user asks Julian "can I use oil instead of butter?" on a cake recipe, Julian gives a weight-based answer. Good handoff.
