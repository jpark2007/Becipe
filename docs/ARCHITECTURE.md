# Dishr — Architecture

## Overview

Dishr is a client-only mobile app (no custom backend server). All data flows through Supabase's auto-generated REST API and Edge Functions. The app runs on iOS, Android, and web from a single React Native codebase via Expo.

```
┌─────────────────────────────┐
│   Expo App (RN + TypeScript)│
│                             │
│  Expo Router (file-based)   │
│  React Query (data layer)   │
│  Zustand (auth state)       │
│  NativeWind (styling)       │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│   Supabase                  │
│                             │
│  Auth (email/password)      │
│  PostgreSQL + RLS           │
│  Realtime (WebSocket)       │
│  Storage (photos)           │
│  Edge Functions (Deno)      │
└─────────────────────────────┘
```

## Data Flow

### Authentication
1. User signs up/logs in via Supabase Auth
2. Session stored in AsyncStorage (native) or localStorage (web)
3. Zustand auth store holds current user + session
4. Root layout (`app/_layout.tsx`) acts as auth gate — redirects based on session state

### Recipe Creation
1. User enters recipe manually, imports from URL, or imports from TikTok/Instagram
2. URL import → Edge Function `parse-recipe` extracts JSON-LD schema data
3. Video import → Edge Function `parse-video` parses oEmbed caption
4. Recipe saved to `recipes` table
5. Trigger `sync_recipe_ingredients()` denormalizes ingredients to `recipe_ingredients_flat` for search
6. Feed item created (verb: 'created')

### Social Feed
1. Feed pulls from `feed_items` table (joined with actor, recipe, try data)
2. Realtime subscription on `feed_items` invalidates React Query cache on new items
3. Feed items auto-created by DB triggers when user: creates recipe, logs a try, saves a recipe

### Try Logging
1. User rates recipe (0-10 slider), adds optional note + photo
2. Photo uploaded to Supabase Storage `recipe-photos` bucket
3. `recipe_tries` insert triggers `on_try_created()` → creates feed_item

### Explore & Search
1. Browse mode: queries `recipes` with ilike title search, cuisine filter, sort options
2. Smart sort (`lib/smart-sort.ts`): filters by difficulty/time based on day of week
3. Fridge mode: searches `recipe_ingredients_flat` by ingredient names

## Database Schema

### Tables
- **profiles** — User data (id refs auth.users, username, display_name, avatar_url, bio)
- **recipes** — Full recipe with JSONB fields (ingredients, steps, tips), source info, metadata
- **recipe_ingredients_flat** — Denormalized ingredients for search (trigger-synced from recipes.ingredients)
- **follows** — Social graph (follower_id, following_id)
- **feed_items** — Activity stream (actor_id, verb, recipe_id, try_id)
- **recipe_tries** — User attempts (rating 0-10, note, photo_url)
- **saved_recipes** — Bookmarks
- **comments** — Comments on tries (schema only, UI not built yet)

### Security (RLS)
All tables have Row-Level Security policies:
- Public data (recipes, profiles) readable by anyone
- Write operations restricted to the owning user
- Feed items visible to actor + their followers
- Saved recipes private to the user

### Triggers
1. `handle_new_user()` — Auto-creates profile row on auth signup
2. `sync_recipe_ingredients()` — Keeps flat ingredient table in sync with recipe JSONB
3. `on_try_created()` — Auto-posts to feed when a try is logged

## Key Architecture Decisions

1. **Supabase over custom backend** — Faster to build, managed infrastructure, built-in auth/realtime/storage. Trade-off: less control over complex queries.

2. **React Query over Supabase's built-in caching** — Better cache invalidation, optimistic updates, and devtools. Zustand only for auth (lightweight, doesn't need query-style caching).

3. **JSONB for ingredients/steps/tips** — Flexible schema, no joins needed for recipe display. Trade-off: harder to search (solved with denormalized flat table + trigger).

4. **Edge Functions for parsing** — Runs server-side to bypass CORS, has client-side fallback if Edge Function is down.

5. **Inline styles over NativeWind classes** — Most components use React Native inline styles with color constants. NativeWind is available but not heavily used in components.

6. **File-based routing (Expo Router)** — Convention over configuration, mirrors Next.js patterns.

## File Size Notes

Largest files that may need splitting as features grow:
- `app/(tabs)/add.tsx` — 945 lines (recipe creation + 3 import methods)
- `app/recipe/[id].tsx` — 466 lines (recipe detail)
- `app/(tabs)/explore.tsx` — 464 lines (browse + fridge modes)
