# Photo Cropping Policy

## Why this exists

Dishr's visual language uses **circular floating plate photos**. To make any user-uploaded recipe / try photo work in this layout, we need to control the aspect ratio at upload time.

## The rule

**All user-uploaded recipe and try photos are square-cropped at upload.**

- Library imports: `expo-image-picker` with `aspect: [1, 1], allowsEditing: true`
- Camera captures: same options
- The user can pan/zoom inside the square crop UI before saving
- Once saved, the image is stored as a square JPEG in Supabase Storage

## How it displays

- **Floating plate contexts** (feed cards, recipe detail hero, ingredients, canonical cards, profile recipe grid) — the square is masked into a circle via `borderRadius: 50%` of the dimension. The user effectively sees a circular crop.
- **Edge contexts** (full-bleed lightbox, share previews) — the square is shown unmasked.

## Side-angle shots

Side-angle food photos work fine in this system. The user picks the most representative square. Dishes that don't photograph well overhead (tall layered things, cocktails, rolls) end up as side-angle squares displayed in circles. The "plate" feel is conceptual, not literal — what matters is that photos are visually consistent in shape across the app.

## Why not free-form crops?

We considered allowing rectangles + a "show as plate" toggle. Rejected because:
- Mixing aspect ratios in a feed makes layout fragile (especially in chat-thread rows)
- Ingredient mini-plates and canonical cards depend on a square source
- The cost of forcing square is one extra crop step at upload — small UX tax for a much more cohesive visual

## Seed photos

Seed canonical recipes use AI-generated images via pollinations.ai (1:1, 800x800). The prompts request "overhead shot on ceramic plate" so they read well as plates. URLs are stable when given an explicit `seed=` param.

## Future migration

Long-term, seed images should be downloaded from pollinations once and uploaded to Supabase Storage so we don't depend on an external service. Out of scope for the v2 rehaul.
