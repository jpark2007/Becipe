# Recipe Sharing (DMs) & Mandatory Images

**Date:** 2026-05-07
**Status:** Approved
**Replaces:** Circles feature (stub only, no backend)

## Overview

Replace the circles feature with a lightweight recipe sharing/DM system. Users send recipes to friends with an optional note. Recipients can react with emoji or jump straight to logging a try. No text chat — keeps it focused on recipes.

Additionally, make images mandatory for tries and manual recipe creation, and show a one-time photo tips popup.

## Database Schema

### `recipe_shares` table

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, default gen_random_uuid() |
| sender_id | uuid | FK → profiles, NOT NULL |
| recipient_id | uuid | FK → profiles, NOT NULL |
| recipe_id | uuid | FK → recipes, NOT NULL |
| note | text | Nullable, ~200 char client-side limit |
| read_at | timestamptz | Nullable — null means unread |
| created_at | timestamptz | Default now() |

**RLS:**
- INSERT: sender_id = auth.uid()
- SELECT: sender_id = auth.uid() OR recipient_id = auth.uid()

**Indexes:**
- (recipient_id, created_at DESC) — inbox queries
- (sender_id, recipient_id, created_at DESC) — thread queries

### `share_reactions` table

| Column | Type | Notes |
|--------|------|-------|
| share_id | uuid | FK → recipe_shares, NOT NULL |
| user_id | uuid | FK → profiles, NOT NULL |
| emoji | text | One of fixed set |
| created_at | timestamptz | Default now() |

**PK:** (share_id, user_id) — one reaction per person per share

**Allowed emoji set:** fire, heart, drooling_face, cook, raising_hands

**RLS:**
- INSERT: user_id = auth.uid() AND user is sender or recipient of the share
- SELECT: user is sender or recipient of the parent share

## Screens & Navigation

### Global Inbox Icon

- Mail/envelope icon in top right corner, visible on all tab screens (feed, explore, kitchen, profile)
- Badge shows unread count: `SELECT count(*) FROM recipe_shares WHERE recipient_id = me AND read_at IS NULL`
- Tapping navigates to inbox screen

### Inbox Screen (`app/inbox.tsx`)

- List of conversations grouped by person (the other party)
- Each row: avatar, display name, last shared recipe thumbnail, relative timestamp, unread indicator
- Sorted by most recent share activity
- Tap a row → opens thread with that person

### Thread Screen (`app/inbox/[userId].tsx`)

- Chronological list of all recipe shares between you and that person
- Each share displays:
  - Recipe card (thumbnail, title, rating summary)
  - Optional sender note below the card
  - Emoji reaction bar below that
  - "I tried this" button → navigates to `try/[recipeId]`
- iMessage-style alignment: your shares on right, theirs on left
- Opening the thread marks all unread shares from this person as read (`UPDATE read_at = now()`)

### Send Flow

- Recipe detail screen (`recipe/[id]`) gets a share/send button (paper plane icon)
- Tapping opens a modal:
  - Search/select from following list
  - Optional note field (200 char limit)
  - Send button
- Creates a `recipe_shares` row
- Invalidates both users' inbox queries

## Mandatory Images

### Tries (required — real photo)

- Image picker in `app/try/[id].tsx` becomes required
- Submit button disabled until photo is selected
- Validation message: "Add a photo of what you made"
- Existing upload logic (Supabase Storage, `recipe-photos` bucket) unchanged

### Recipes — Manual Creation (required)

- Add image picker to `app/add-recipe.tsx`
- Cover image required before submission
- Upload to Supabase Storage, store URL in `cover_image_url` column

### Recipes — URL Import (fallback)

- If scraper finds an image: use it automatically
- If no image found: generate a styled placeholder (sage-colored card with cuisine-type emoji)
- User can optionally replace placeholder with own photo
- Import is NOT blocked by missing image

## Photo Tips Popup

- Trigger: first time user taps any image picker (try or recipe)
- Format: dismissible bottom sheet or tooltip
- Content:
  - "Quick photo tips"
  - "Natural light works best"
  - "Shoot from above to show the whole plate"
  - "Get close — fill the frame"
- Persistence: `has_seen_photo_tips` flag in AsyncStorage
- One-time only — never shows again after dismissal

## Push Notifications (Deferred)

- When a `recipe_shares` row is inserted, fire Expo push notification to recipient
- Content: "[Display Name] sent you a recipe: [Recipe Title]"
- Deep link to thread screen on tap
- Implementation deferred until push notification infrastructure is set up
- For now: badge count + polling only

## Data Flow

- React Query polls inbox every 30s when inbox screen is focused
- Unread badge count query runs on app foreground and tab switch
- Reactions use optimistic updates (show immediately, sync in background)
- Send invalidates both users' inbox queries via query key

## Code to Remove

- `lib/circles-stub.ts` — mock circle data
- `app/circle/[id].tsx` — circle detail screen
- `components/CircleCard.tsx` — circle card component
- `components/MemberRing.tsx` — if only used by circles
- `components/RitualCard.tsx` — if only used by circles
- Circle references in explore screen chips/filters
- Circle references in profile screen

## Design Tokens

All new UI follows existing theme from `lib/theme.ts`:
- Unread badge: `colors.clay` background, white text
- Send button: `colors.sage`
- Reaction bar: `colors.sageSoft` background for selected state
- Note text: `colors.inkSoft`
- Timestamps: `colors.muted`
