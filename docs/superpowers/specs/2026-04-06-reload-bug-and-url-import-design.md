# Fix: Reload Bug & URL Import

**Date:** 2026-04-06
**Problems:** (A) Pages don't load until browser reload. (B) URL recipe import broken (CORS proxies failing).

---

## Problem A: Reload Bug

### Root Cause

Expo Router tabs stay mounted after first visit. When the app loads, all tab screens render before the Zustand auth store hydrates (`user` is null). React Query hooks with `enabled: !!user` get disabled on mount. Once disabled, they ignore `invalidateQueries()` calls — they never fetched, so there's nothing to invalidate. The user sees a permanent spinner until they reload the browser (which starts fresh with auth already hydrated).

### Solution: Auth Gate in Root Layout

Add a loading state to `_layout.tsx` that prevents tabs from rendering until auth has resolved. This means query hooks in tab screens never see `enabled: false` — they only mount once `user` is available.

**Changes:**
- `app/_layout.tsx` — Add `isAuthReady` state to `AuthGate`. Set it `true` after `getSession()` resolves. Render a loading screen (cream background + spinner) until ready. Pass auth readiness down so the `<Stack>` only renders children when auth is resolved.
- `app/(tabs)/profile.tsx` — Remove `enabled: !!user` guard since auth is guaranteed by the gate. Keep `user!.id` in queryKey.
- `app/(tabs)/feed.tsx` — Same: remove `enabled: !!user` guards on feed/discover queries.
- `app/(tabs)/explore.tsx` — Same for people/following queries.
- Keep `queryClient.invalidateQueries()` in `onAuthStateChange` — still useful for token refreshes mid-session.

**What this does NOT change:**
- Query client config (staleTime, retry, refetchOnWindowFocus) — keep the improvements from earlier.
- Realtime WebSocket gating on `user?.id` — keep this, it's correct.

---

## Problem B: URL Import

### Root Cause

Client-side recipe parsing relies on free CORS proxies (`corsproxy.io`, `allorigins.win`, `codetabs.com`) which are all unreliable — returning 500s, rate-limiting, or being down entirely. The `parse-recipe` Edge Function already does server-side HTML fetching (no CORS issues) and is now deployed.

### Solution: Edge Function as Sole Path

Remove all client-side CORS proxy code. Use the deployed `parse-recipe` Edge Function as the only path for regular recipe URLs. For TikTok/Instagram, use `parse-video` Edge Function (already implemented).

**Changes:**
- `app/(tabs)/add.tsx` — Remove `parseRecipeFromUrl()` function entirely (the client-side CORS proxy parser). Simplify `handleImport()` to only call the Edge Function. Remove the 3 CORS proxy URLs. Keep clear error messages for auth failures.

**Auth for Edge Functions:**
- Use `session.access_token` as Bearer token (JWT). The `sb_publishable_` anon key is NOT a JWT and will be rejected by edge functions with `verify_jwt: true`.
- If no session exists, show "Please sign in again" error.
- Pass `apikey` header with the publishable key (required by Supabase gateway routing, but auth is via the Bearer JWT).

---

## Out of Scope

- Skeleton screens (nice-to-have, not blocking)
- `props.pointerEvents` deprecation warning (harmless noise)
- TypeScript errors from database types being out of sync (pre-existing, not related)
- iOS simulator setup
