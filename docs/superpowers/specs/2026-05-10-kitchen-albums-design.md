# Kitchen Albums & Search — Design Spec

**Date:** 2026-05-10  
**Status:** Approved

---

## Overview

Redesign the Kitchen tab to support organizing all recipes (both saved and created) into named albums, with search across the full collection. Albums are many-to-many: a recipe can belong to multiple albums simultaneously.

---

## Database

### New tables

**`recipe_collections`**
```sql
id         uuid primary key default gen_random_uuid()
user_id    uuid not null references profiles on delete cascade
name       text not null
created_at timestamptz default now() not null
```

**`recipe_collection_items`**
```sql
collection_id  uuid not null references recipe_collections on delete cascade
recipe_id      uuid not null references recipes on delete cascade
added_at       timestamptz default now() not null
primary key (collection_id, recipe_id)
```

RLS on both tables: users can only read/write rows where `user_id = auth.uid()` (collections) or where the collection belongs to them (items).

### No changes to `saved_recipes`

The existing `saved_recipes` table is unchanged. Albums are a separate organizational layer on top of both saved and created recipes.

---

## Screens

### 1. Kitchen tab (redesigned) — `app/(tabs)/kitchen.tsx`

**Layout:**
- Header: "Your Kitchen" + inbox icon (unchanged)
- Search bar: full-width, filters the active tab's recipe list live by title
- Tab bar: **Albums | All | Mine**

**Albums tab:**
- 2-column grid of album cards
- Each card: auto-color background (cycles through sageSoft/claySoft/ochreSoft), album name, recipe count
- Last card is always "＋ New album" — tapping opens a modal with a single text input for the name
- Tap an album card → Album Detail screen

**All tab:**
- Compact list rows: thumbnail (40×40), title, source label ("Saved" or "Your recipe"), album tag chips
- ⋮ button on each row → context menu: "Add to album", "View recipe", "Remove from saved" (saved only) / "Edit" (own only)
- Long-press on a row also opens the same context menu
- Search filters by recipe title

**Mine tab:**
- Same compact list layout as All, but only recipes where `created_by = myId`
- Same search + ⋮ menu behavior

---

### 2. Album Detail — `app/collection/[id].tsx`

- Back button → Kitchen
- Header: album name + recipe count
- Search bar: filters recipes within this album by title
- Compact recipe list (same row layout as All tab)
- ⋮ on each row → "View recipe", "Remove from album"
- "＋ Add recipes" button (sage, pill, bottom of list) → opens Album Picker Sheet in add-mode (shows all recipes not yet in album, tap to add)

---

### 3. Album Picker Sheet — `components/AlbumPickerSheet.tsx`

Reusable bottom sheet (React Native Modal). Used from three entry points:
1. Recipe detail page ("Add to album" button)
2. Long-press / ⋮ menu in Kitchen All/Mine tabs
3. "Add recipes" button inside Album Detail (inverted: pick recipes for a fixed album)

**Default mode (pick albums for a recipe):**
- Title: "Add to album"
- List of user's albums with checkboxes — checked = recipe already in that album
- Toggle to add/remove
- Inline "New album..." row at bottom — typing creates album and auto-checks it
- "Done" button closes sheet and invalidates relevant queries

**Add-recipes mode (pick recipes for an album):**
- Title: "Add recipes"
- Full recipe list (saved + created) with checkboxes — checked = already in album
- Search bar to filter
- "Done" button closes and saves

---

### 4. Recipe Detail page — minor addition

Add an "Add to album" pressable (below the existing save button) that opens AlbumPickerSheet in default mode.

---

## Data Flow

- All album queries use React Query with keys `['collections', userId]`, `['collection-items', collectionId]`
- Mutations invalidate the relevant collection keys
- Search is client-side filtering (no DB query) — collections are small enough
- The All tab fetches `saved_recipes` and `recipes(created_by=me)` separately, then merges client-side, deduplicating by `recipe_id` (own recipes take precedence over saved copies of the same recipe)

---

## What's Not in Scope

- Album cover images (name only, no emoji/color picker)
- Sorting or reordering recipes within an album
- Sharing albums with other users
- Deleting or renaming albums (can be a follow-up)
