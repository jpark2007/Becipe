# Dishr

A social recipe sharing and discovery mobile app. Users create/import recipes, follow other cooks, log "tries" with ratings and photos, and discover recipes via smart filters. Think Instagram meets a cookbook — built to be viral and social.

## Team

- **Drew (drewkhalil3)** — Technical lead, primary developer
- **jpark2007** — Co-founder, vision/marketing/growth

## Tech Stack

- **Frontend:** Expo (React Native) + TypeScript + Expo Router (file-based routing)
- **Styling:** NativeWind (Tailwind for RN) — warm parchment editorial design
- **Fonts:** Cormorant Garamond (display), DM Mono (UI), Lora (body)
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

| Token | Value | Usage |
|-------|-------|-------|
| cream | #F8F4EE | Background |
| charcoal | #1C1712 | Primary text |
| terra | #C4622D | Accent/CTA |
| terra-light | #E4956A | Hover states |
| muted | #A09590 | Secondary text |
| border | #D5CCC0 | Borders |
| card | #EEE8DF | Card surface |

## Code Conventions

- Inline styles (React Native StyleSheet pattern, not NativeWind classes in most components)
- Color constants defined at top of each file (INK, CREAM, TERRA, etc.)
- React Query for all server data fetching with query key invalidation
- Supabase client imported from `@/lib/supabase`
- Edge functions in `supabase/functions/` (Deno runtime)

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
