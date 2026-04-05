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
- [ ] Upgrade TikTok/Instagram import (whisper transcription + LLM parsing to replace caption heuristics)
- [ ] Push notifications (Expo Notifications — new followers, tries on your recipes, recipe comments)
- [ ] Seed data script (scrape ~1K recipes from Schema.org sites for launch content)
- [ ] Input validation/sanitization (XSS prevention)
- [ ] Photo upload validation (file type + size limits)
- [ ] Error boundary component (global crash handler)
- [ ] Error tracking (Sentry — free tier, has Expo SDK)
- [ ] Analytics (PostHog — free tier 1M events/mo; track signups, shares, tries, retention)
- [ ] Basic smoke tests
- [ ] App Store assets (screenshots, description, keywords)
- [ ] Privacy policy + terms of service
- [ ] GitHub repo rename to Dishr (jpark2007 to do)

### Not Started — Pre-Launch Polish
- [ ] Onboarding flow (animated walkthrough — highlight buttons, explain features, swipe-through)
- [ ] Comments on tries (schema exists, need UI)
- [ ] Saved recipes list view ("My Saves" page)
- [ ] Edit/delete own recipes
- [ ] User profile editing (name, bio, avatar)

### Not Started — Post-Launch / Growth
- [ ] Pagination / infinite scroll on feed
- [ ] Search improvements (full-text on description, tags)
- [ ] Social sharing (share recipe to Instagram stories, etc.)
- [ ] Direct messaging between users
- [ ] Reporting/blocking users
- [ ] Recipe collections/lists
- [ ] CI/CD pipeline (EAS Build + automated deploys)

## Progress Tracker

| Area | % Done | Notes |
|------|--------|-------|
| Auth | 95% | Works, just needs Supabase live |
| Feed | 90% | Works, needs pagination for scale |
| Explore/Search | 90% | Works, could improve search quality |
| Manual recipe entry | 95% | Solid |
| URL import | 70% | Works for major sites, fragile on others |
| TikTok/Instagram import | 40% | Caption parsing unreliable — upgrade to whisper + LLM |
| Cook mode | 95% | Done |
| Try logging | 95% | Done |
| Profiles & follows | 90% | Works, no profile editing yet |
| Push notifications | 0% | Not started — core for social/viral |
| Security hardening | 20% | Input validation, upload limits needed |
| Testing | 0% | No tests |
| Monitoring/Analytics | 0% | Need Sentry + PostHog |
| Onboarding | 0% | Animated walkthrough not started |
| Seed data | 0% | Need ~1K recipes for launch |
| App Store readiness | 10% | Need assets, legal, store listing |
| **Overall to launch** | **~55%** | Code works, but social features + content + polish needed |

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
| 2026-04-05 | Upgrade TikTok/Instagram import with whisper + LLM | Caption parsing too unreliable; transcription + Claude/GPT extraction is industry standard |
| 2026-04-05 | Use Sentry for error tracking | Free tier, Expo SDK, catches crashes in production |
| 2026-04-05 | Use PostHog for analytics | Free 1M events/mo, track signups/shares/retention/funnels |
| 2026-04-05 | Push notifications are pre-launch requirement | Core to social/viral strategy, not post-launch |
| 2026-04-05 | Seed ~1K recipes for launch | Empty app kills virality; scrape from Schema.org sites |
