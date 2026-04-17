# Dishr

A social recipe sharing and discovery mobile app. Users create/import recipes, follow other cooks, log "tries" with ratings and photos, and discover recipes via smart filters. Think Instagram meets a cookbook — built to be viral and social.

## Team

- **Drew (drewkhalil3)** — Technical lead, primary developer
- **jpark2007** — Co-founder, vision/marketing/growth

## Tech Stack

- **Frontend:** Expo (React Native) + TypeScript + Expo Router (file-based routing)
- **Styling:** NativeWind (Tailwind for RN) — warm parchment editorial design
- **Fonts:** Inter (display + body) — primary. Cormorant Garamond / DM Mono / Lora are loaded for legacy screens but new code should use Inter only.
- **Backend:** Supabase (PostgreSQL + Auth + Realtime + Edge Functions + Storage)
- **State:** Zustand (auth store) + TanStack React Query v5 (server data)
- **Key libs:** react-native-reanimated, expo-image-picker, expo-share-intent, expo-keep-awake

## Project Structure

```
app/                    # Expo Router pages
  (auth)/               # Login, signup, verify-email
  (tabs)/               # Feed, explore, add, profile
  recipe/[id].tsx       # Recipe detail
  recipe/[id]/cook.tsx  # Cook mode
  try/[id].tsx          # Log a try
  user/[id].tsx         # Public user profile
components/             # Reusable components (FeedCard, RecipeCard, RatingDisplay, RatingSlider)
lib/                    # Supabase client, DB types, query client, smart-sort
store/                  # Zustand auth store
supabase/
  migrations/           # SQL schema (001_initial, 002_auto_profile)
  functions/            # Edge functions (parse-recipe, parse-video)
docs/                   # Project documentation
```

## Running the App

```bash
npm install
npx expo start
# Press w for web, i for iOS simulator (needs Xcode)
# Expo Go on phone: SDK 55 required (may not be available in App Store yet)
```

## Environment Variables

```
EXPO_PUBLIC_SUPABASE_URL=<supabase-project-url>
EXPO_PUBLIC_SUPABASE_ANON_KEY=<supabase-anon-key>
```

Supabase project is managed by jpark2007. Drew to be added as collaborator.

## Database

PostgreSQL via Supabase with Row-Level Security. Key tables: profiles, recipes, recipe_ingredients_flat, follows, feed_items, recipe_tries, saved_recipes, comments.

Triggers: auto-create profile on signup, sync ingredients to flat table, auto-post to feed on try.

Realtime enabled on: feed_items, recipe_tries, comments.

## Design System

v2 editorial palette — sage / clay / ochre on a near-white bone base.

| Token | Value | Usage |
|-------|-------|-------|
| bg | #F4F4F0 | Page background |
| bone | #FCFCFA | Phone shell / screen background |
| card | #FFFFFF | Card surface |
| border | #ECECE6 | Borders |
| borderSoft | #F5F5F0 | Subtle dividers |
| ink | #0B0B0C | Primary text |
| inkSoft | #3A3A40 | Secondary text |
| muted | #8A8A93 | Tertiary text |
| sage | #4A6B3E | Palate match / brand primary |
| sageDeep | #36502C | Sage pressed / deep |
| sageSoft | #EDF1E6 | Sage tint / chip bg |
| clay | #C24A28 | Ritual / community / warm CTAs |
| clayDeep | #962E13 | Clay pressed / deep |
| claySoft | #FBE7DF | Clay tint / chip bg |
| ochre | #C7902A | Ratings / tries / counts |
| ochreSoft | #F8EED5 | Ochre tint / chip bg |

**Tokens live in `lib/theme.ts`. Never hardcode hex values.**

## Code Conventions

- Inline styles (React Native StyleSheet pattern, not NativeWind classes in most components)
- Color constants defined at top of each file (INK, CREAM, TERRA, etc.)
- React Query for all server data fetching with query key invalidation
- Supabase client imported from `@/lib/supabase`
- Edge functions in `supabase/functions/` (Deno runtime)
- **Onboarding:** Onboarding flow lives at `app/(onboarding)/welcome.tsx` → `palate-quiz.tsx`. New users (no `profiles.palate_vector`) are routed there automatically by the auth gate in `app/_layout.tsx`. Existing users were backfilled with a neutral palate vector by migration `006_palate_vector.sql` so they skip onboarding.

## Current Status

See `docs/ROADMAP.md` for full status. Core MVP is feature-complete. Pending: Supabase access for Drew, security hardening, testing, monitoring.

## What's NOT Done Yet

- Comments UI (schema exists, no frontend)
- Saved recipes list view (save button works, no "My Saves" page)
- Edit/delete own recipes
- User profile editing (name, bio, avatar)
- Push notifications
- Error tracking / analytics
- Tests
