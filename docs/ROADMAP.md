# Dishr — Roadmap & Status

Last updated: 2026-04-05

## Core MVP Features

### Done
- [x] Auth flow (login, signup, email verification, logout, session persistence)
- [x] Social feed with realtime updates and pull-to-refresh
- [x] Explore page (browse mode: search, cuisine filters, smart sort)
- [x] Explore page (fridge mode: ingredient-based recipe search)
- [x] Add recipe (manual entry with full form)
- [x] Add recipe (import from URL via JSON-LD parsing)
- [x] Add recipe (import from TikTok/Instagram via caption parsing)
- [x] Share intent (receive URLs shared from other apps)
- [x] Recipe detail page (ingredients, steps, tips, ratings, tries)
- [x] Cook mode (step-by-step, keep-awake, ingredient checklist)
- [x] Log a try (0-10 rating, notes, photo upload)
- [x] User profiles (own + other users)
- [x] Follow/unfollow system
- [x] Image upload to Supabase Storage
- [x] Database schema with RLS, triggers, realtime
- [x] Edge functions (parse-recipe, parse-video)
- [x] Loading states on all screens
- [x] Empty states on all screens
- [x] Rename from Becipe to Dishr

### Not Started — Needed Before Launch
- [ ] Drew added to Supabase project (waiting on jpark2007)
- [ ] Supabase project unpaused and accessible
- [ ] Input validation/sanitization (XSS prevention)
- [ ] Photo upload validation (file type + size limits)
- [ ] Error boundary component (global crash handler)
- [ ] Error tracking integration (Sentry or similar)
- [ ] Basic smoke tests
- [ ] App Store assets (screenshots, description, keywords)
- [ ] Privacy policy + terms of service
- [ ] GitHub repo rename to Dishr (jpark2007 to do)

### Not Started — Post-Launch / Nice to Have
- [ ] Comments on tries (schema exists, need UI)
- [ ] Saved recipes list view ("My Saves" page)
- [ ] Edit/delete own recipes
- [ ] User profile editing (name, bio, avatar)
- [ ] Push notifications (new followers, tries on your recipes)
- [ ] Analytics integration (PostHog, Mixpanel, or similar)
- [ ] Pagination / infinite scroll on feed
- [ ] Search improvements (full-text on description, tags)
- [ ] Onboarding flow for new users
- [ ] Social sharing (share recipe to Instagram, etc.)
- [ ] Direct messaging between users
- [ ] Reporting/blocking users
- [ ] Recipe collections/lists
- [ ] CI/CD pipeline (EAS Build + automated deploys)

## Blockers

| Blocker | Owner | Status |
|---------|-------|--------|
| Supabase access for Drew | jpark2007 | Waiting — Drew texted him |
| Supabase project unpaused | jpark2007 | Waiting |
| GitHub repo rename | jpark2007 | Not started |
| Expo Go SDK 55 not in App Store | Expo team | Use `w` (web) or `i` (simulator) for testing |

## Decision Log

| Date | Decision | Reason |
|------|----------|--------|
| 2026-04-05 | Rename Becipe → Dishr | Rebrand |
| 2026-04-05 | Skip auto-push git hook | Risk of pushing broken code to main; just say "commit and push" when ready |
| 2026-04-05 | Both push to main for now | Simple workflow while team is small; revisit if conflicts arise |
| 2026-04-05 | Defer Supabase-side rename | jpark2007 controls Supabase project; coordinate later |
