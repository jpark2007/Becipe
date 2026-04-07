# Social Feed, Discovery & Growth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Dishr feel alive — public feed, user discovery, onboarding, referrals, and a working URL import pipeline.

**Architecture:** Feed becomes public-first with a Following tab. User search added to Explore. Onboarding nudges recipe imports. Referrals use deep links with invite tracking. URL import fixed with a reliable CORS proxy fallback. Edge function deployment blocked on partner granting Editor access.

**Tech Stack:** Expo Router, Supabase (RLS policy changes need Editor role), React Query, expo-contacts (Phase 2), expo-sharing (outbound shares), deep linking via expo-router scheme.

**Existing assets:**
- Follow system: COMPLETE (DB + UI on user/[id].tsx)
- My Fridge: COMPLETE (explore.tsx MY FRIDGE tab)
- Smart sort: COMPLETE (lib/smart-sort.ts)
- Share intent (inbound): COMPLETE (add.tsx)
- Recipe import (URL): COMPLETE but CORS proxy broken
- Recipe import (TikTok/IG): Edge function rewritten, blocked on deploy

---

## Phase 1: Make the Feed Work

### Task 1: Public Discovery Feed + Following Tab

The feed currently shows nothing because RLS restricts to followed users only. We'll make the feed show all public activity by default, with a "Following" tab for the social feed.

**Files:**
- Modify: `app/(tabs)/feed.tsx`

**RLS Note:** The `feed_items` RLS policy needs updating to allow public reads. This requires Editor access. Until then, we work around it by querying `recipes` directly for the Discover tab (recipes table has public read RLS already).

- [ ] **Step 1: Add tab state and Discover query**

In `app/(tabs)/feed.tsx`, add a `Discover | Following` tab toggle. The Discover tab queries recent public recipes (not feed_items) to bypass the RLS restriction:

```tsx
type FeedTab = 'discover' | 'following';

// Add inside component, before the return:
const [tab, setTab] = useState<FeedTab>('discover');

// New query for discover tab - uses recipes table which has public RLS
async function fetchDiscover() {
  const { data, error } = await supabase
    .from('recipes')
    .select(`
      id, title, cover_image_url, cuisine, created_at, difficulty,
      prep_time_min, cook_time_min, servings, is_public,
      creator:profiles!created_by(id, display_name, username, avatar_url),
      tries:recipe_tries(rating)
    `)
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw error;
  return (data ?? []).map((r: any) => {
    const ratings = (r.tries ?? []).map((t: any) => t.rating).filter(Boolean);
    return {
      ...r,
      avg_rating: ratings.length ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length : null,
      try_count: ratings.length,
    };
  });
}
```

- [ ] **Step 2: Add tab toggle UI in the ListHeaderComponent**

Replace the existing header with tabs:

```tsx
ListHeaderComponent={
  <View style={{ marginBottom: 20 }}>
    <Text style={{ fontFamily: 'CormorantGaramond_600SemiBold', fontSize: 38, color: '#1C1712' }}>
      Feed
    </Text>
    {/* Tab toggle */}
    <View style={{ flexDirection: 'row', gap: 20, marginTop: 16 }}>
      <TouchableOpacity onPress={() => setTab('discover')}>
        <Text style={{
          fontFamily: 'DMMono_400Regular', fontSize: 11, letterSpacing: 1.5,
          textTransform: 'uppercase',
          color: tab === 'discover' ? '#C4622D' : '#A09590',
          borderBottomWidth: tab === 'discover' ? 2 : 0,
          borderBottomColor: '#C4622D',
          paddingBottom: 6,
        }}>
          Discover
        </Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setTab('following')}>
        <Text style={{
          fontFamily: 'DMMono_400Regular', fontSize: 11, letterSpacing: 1.5,
          textTransform: 'uppercase',
          color: tab === 'following' ? '#C4622D' : '#A09590',
          borderBottomWidth: tab === 'following' ? 2 : 0,
          borderBottomColor: '#C4622D',
          paddingBottom: 6,
        }}>
          Following
        </Text>
      </TouchableOpacity>
    </View>
    <View style={{ height: 1, backgroundColor: '#D5CCC0', marginTop: 0 }} />
  </View>
}
```

- [ ] **Step 3: Render different content per tab**

Discover tab shows RecipeCards (from recipes query). Following tab shows FeedCards (from feed_items query). Use separate React Query hooks:

```tsx
const discoverQuery = useQuery({
  queryKey: ['discover'],
  queryFn: fetchDiscover,
  enabled: tab === 'discover',
});

// Existing feed query, only enabled on Following tab
const feedQuery = useQuery({
  queryKey: ['feed', user?.id],
  queryFn: () => fetchFeed(user!.id),
  enabled: tab === 'following' && !!user,
});

const data = tab === 'discover' ? discoverQuery.data : feedQuery.data;
const isLoading = tab === 'discover' ? discoverQuery.isLoading : feedQuery.isLoading;
```

For discover tab, render RecipeCard (import from components). For following tab, render FeedCard as before. Use the `renderItem` conditionally:

```tsx
renderItem={({ item }) =>
  tab === 'discover'
    ? <View style={{ paddingHorizontal: 0 }}><RecipeCard recipe={item} showCreator /></View>
    : <FeedCard item={item} />
}
```

- [ ] **Step 4: Update ListEmptyComponent per tab**

Following tab empty: "Follow some cooks to see their activity here"
Discover tab empty: "No recipes yet — be the first to add one!"

- [ ] **Step 5: Test and commit**

```bash
git add app/(tabs)/feed.tsx
git commit -m "feat: add Discover/Following tabs to feed"
```

---

### Task 2: Fix URL Import (Broken CORS Proxy)

The client-side URL import uses `corsproxy.io` which is unreliable. Fix by using a different proxy and improving error handling. The edge function (parse-recipe) works server-side but needs deployment (blocked on Editor access).

**Files:**
- Modify: `app/(tabs)/add.tsx`

- [ ] **Step 1: Replace CORS proxy with alternatives + fallback chain**

In `add.tsx`, replace the `parseRecipeFromUrl` function's proxy logic:

```tsx
async function parseRecipeFromUrl(url: string) {
  // Try multiple CORS proxies in order
  const proxies = [
    (u: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
    (u: string) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
  ];

  let html = '';
  for (const makeProxy of proxies) {
    const proxyUrl = makeProxy(url);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
      const res = await fetch(proxyUrl, { signal: controller.signal });
      clearTimeout(timer);
      if (res.ok) {
        html = await res.text();
        break;
      }
    } catch {
      clearTimeout(timer);
      continue;
    }
  }

  if (!html) {
    throw new Error('Could not reach that URL. The site may be blocking automated requests — try a different recipe site.');
  }

  // ... rest of JSON-LD parsing stays the same
```

- [ ] **Step 2: Test with allrecipes.com and commit**

```bash
git add app/(tabs)/add.tsx
git commit -m "fix: use fallback CORS proxy chain for URL import"
```

---

## Phase 2: User Discovery

### Task 3: User Search on Explore Tab

Add a "People" sub-tab or search mode to the Explore page so users can find and follow others.

**Files:**
- Modify: `app/(tabs)/explore.tsx`

- [ ] **Step 1: Add PEOPLE tab alongside BROWSE and MY FRIDGE**

Add a third top-level tab to explore.tsx:

```tsx
type ExploreTab = 'browse' | 'fridge' | 'people';
// Update existing tab state
const [tab, setTab] = useState<ExploreTab>('browse');
```

Add the "PEOPLE" tab button next to BROWSE and MY FRIDGE in the tab bar.

- [ ] **Step 2: Build people search query**

```tsx
async function searchUsers(query: string) {
  if (!query.trim()) {
    // Show suggested users (most recipes)
    const { data } = await supabase
      .from('profiles')
      .select('id, display_name, username, avatar_url, bio')
      .order('created_at', { ascending: true })
      .limit(20);
    return data ?? [];
  }
  const { data } = await supabase
    .from('profiles')
    .select('id, display_name, username, avatar_url, bio')
    .or(`username.ilike.%${query.trim()}%,display_name.ilike.%${query.trim()}%`)
    .limit(20);
  return data ?? [];
}
```

- [ ] **Step 3: Build people search UI**

Search input + list of user cards with follow button. Each card shows avatar, display name, username, bio preview, and a Follow/Following button. Tapping the card navigates to `/user/[id]`.

```tsx
// UserCard component inline in explore.tsx
function UserCard({ profile, isFollowing, onFollow, onPress }: {
  profile: any;
  isFollowing: boolean;
  onFollow: () => void;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity onPress={onPress} style={{
      flexDirection: 'row', alignItems: 'center', padding: 14,
      backgroundColor: '#EEE8DF', marginBottom: 2,
    }}>
      <View style={{
        width: 40, height: 40, backgroundColor: '#C4622D',
        alignItems: 'center', justifyContent: 'center', marginRight: 12,
      }}>
        {profile.avatar_url ? (
          <Image source={{ uri: profile.avatar_url }} style={{ width: 40, height: 40 }} />
        ) : (
          <Text style={{ fontFamily: 'DMMono_400Regular', fontSize: 16, color: '#EDE8DC' }}>
            {profile.display_name?.[0]?.toUpperCase()}
          </Text>
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: 'DMMono_500Medium', fontSize: 12, color: '#1C1712' }}>
          {profile.display_name}
        </Text>
        <Text style={{ fontFamily: 'DMMono_400Regular', fontSize: 10, color: '#A09590' }}>
          @{profile.username}
        </Text>
      </View>
      <TouchableOpacity onPress={onFollow} style={{
        paddingHorizontal: 14, paddingVertical: 6,
        backgroundColor: isFollowing ? 'transparent' : '#C4622D',
        borderWidth: 1, borderColor: '#C4622D',
      }}>
        <Text style={{
          fontFamily: 'DMMono_400Regular', fontSize: 10, letterSpacing: 1,
          textTransform: 'uppercase',
          color: isFollowing ? '#C4622D' : '#EDE8DC',
        }}>
          {isFollowing ? 'Following' : 'Follow'}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}
```

- [ ] **Step 4: Wire up follow state**

Fetch the current user's follows list to determine button state. Use a mutation for follow/unfollow that invalidates the query.

- [ ] **Step 5: Test and commit**

```bash
git add app/(tabs)/explore.tsx
git commit -m "feat: add People tab with user search and follow"
```

---

### Task 4: Suggested Follows (Empty State)

When the Following feed is empty, show a "Suggested cooks to follow" section with active users.

**Files:**
- Modify: `app/(tabs)/feed.tsx`

- [ ] **Step 1: Add suggested follows query**

```tsx
async function fetchSuggestedUsers(currentUserId: string) {
  // Get users the current user is NOT following, ordered by recipe count
  const { data: following } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', currentUserId);

  const followingIds = (following ?? []).map(f => f.following_id);
  followingIds.push(currentUserId); // exclude self

  const { data } = await supabase
    .from('profiles')
    .select('id, display_name, username, avatar_url')
    .not('id', 'in', `(${followingIds.join(',')})`)
    .limit(10);

  return data ?? [];
}
```

- [ ] **Step 2: Show suggested users in Following tab empty state**

Replace the empty "Nothing yet" with a list of suggested user cards with follow buttons.

- [ ] **Step 3: Test and commit**

```bash
git add app/(tabs)/feed.tsx
git commit -m "feat: show suggested follows when Following feed is empty"
```

---

## Phase 3: Onboarding

### Task 5: Welcome Flow After Signup

After first signup, show a welcome screen that nudges the user to import recipes.

**Files:**
- Create: `app/(tabs)/welcome.tsx` (modal screen)
- Modify: `app/_layout.tsx` (add welcome route)
- Modify: `store/auth.ts` (track onboarding state)

- [ ] **Step 1: Add onboarding flag to auth store**

```tsx
// store/auth.ts - add to AuthState interface:
hasCompletedOnboarding: boolean;
setOnboardingComplete: () => void;

// In create():
hasCompletedOnboarding: false,
setOnboardingComplete: () => set({ hasCompletedOnboarding: true }),
```

Check AsyncStorage on init to persist across sessions:

```tsx
// In _layout.tsx AuthGate, after session is set:
import AsyncStorage from '@react-native-async-storage/async-storage';

const onboarded = await AsyncStorage.getItem('dishr_onboarded');
if (onboarded) {
  useAuthStore.getState().setOnboardingComplete();
}
```

- [ ] **Step 2: Create welcome screen**

`app/(tabs)/welcome.tsx` — a modal with 3 steps:
1. "Welcome to Dishr" — brief value prop
2. "Import your first recipe" — CTA to Add tab (URL or TikTok)
3. "Find cooks to follow" — CTA to Explore > People tab

Each step has a Skip option. On completion or skip, set onboarding complete and save to AsyncStorage.

- [ ] **Step 3: Trigger welcome on first login**

In `_layout.tsx` AuthGate, after setting session for the first time, check if onboarding is complete. If not, navigate to welcome screen.

- [ ] **Step 4: Test and commit**

```bash
git add app/(tabs)/welcome.tsx app/_layout.tsx store/auth.ts
git commit -m "feat: add post-signup welcome/onboarding flow"
```

---

### Task 6: Dishr House Account + Seed Content

Create a script to seed the database with curated recipes from a house account.

**Files:**
- Create: `scripts/seed-recipes.ts`

- [ ] **Step 1: Write seed script**

Node script that:
1. Signs in as a designated "dishr" house account (created manually in Supabase Auth)
2. Fetches 20-30 popular recipe URLs from known Schema.org sites (allrecipes, BBC Good Food, Serious Eats)
3. For each URL, calls the parse-recipe edge function (or parses client-side)
4. Inserts the recipe with `created_by` set to the house account

```tsx
// scripts/seed-recipes.ts
import { createClient } from '@supabase/supabase-js';

const SEED_URLS = [
  'https://www.bbcgoodfood.com/recipes/easy-pancakes',
  'https://www.seriouseats.com/the-best-slow-cooked-bolognese-sauce-recipe',
  // ... 20-30 more
];

// Uses the parse-recipe logic inline (same JSON-LD extraction)
```

- [ ] **Step 2: Run seed script and commit**

```bash
npx tsx scripts/seed-recipes.ts
git add scripts/seed-recipes.ts
git commit -m "feat: add recipe seed script with curated content"
```

---

## Phase 4: Referrals & Sharing

### Task 7: Outbound Recipe Sharing

Add a share button to recipe detail pages so users can share recipes outside the app.

**Files:**
- Modify: `app/recipe/[id].tsx`

- [ ] **Step 1: Add share button using expo Sharing API**

```tsx
import { Share } from 'react-native';

async function handleShare(recipe: any) {
  await Share.share({
    message: `Check out "${recipe.title}" on Dishr! dishr://recipe/${recipe.id}`,
    url: `dishr://recipe/${recipe.id}`,
  });
}
```

Add a share icon/button in the recipe detail header.

- [ ] **Step 2: Test and commit**

```bash
git add app/recipe/[id].tsx
git commit -m "feat: add share button to recipe detail"
```

---

### Task 8: Invite/Referral System

Track invites per user. When someone signs up via an invite link, both get an "OG Chef" badge.

**Files:**
- Create: `supabase/migrations/003_referrals.sql`
- Modify: `app/(auth)/signup.tsx` (capture referral code)
- Modify: `app/(tabs)/profile.tsx` (show badges)

- [ ] **Step 1: Add referral schema**

```sql
-- supabase/migrations/003_referrals.sql
create table if not exists referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references profiles on delete cascade,
  referred_id uuid not null references profiles on delete cascade,
  created_at timestamptz default now() not null,
  unique(referrer_id, referred_id)
);

alter table referrals enable row level security;
create policy "Users can view own referrals"
  on referrals for select using (auth.uid() = referrer_id or auth.uid() = referred_id);

-- Add badges column to profiles
alter table profiles add column if not exists badges text[] not null default '{}';
```

- [ ] **Step 2: Generate invite link on profile**

Each user's invite link: `dishr://invite/{user_id}` or a web URL like `https://dishr.app/invite/{user_id}`.

Add "Invite Friends" button on profile page that shares the link via `Share.share()`.

- [ ] **Step 3: Capture referral on signup**

When the app opens via `dishr://invite/{referrer_id}`, store the referrer ID. On signup, insert into `referrals` table and add `'og_chef'` badge to both users' profiles.

- [ ] **Step 4: Display badges on profile**

Show badge chips (e.g., "OG CHEF") under the username on profile pages.

- [ ] **Step 5: Test and commit**

```bash
git add supabase/migrations/003_referrals.sql app/(auth)/signup.tsx app/(tabs)/profile.tsx
git commit -m "feat: add referral system with OG Chef badge"
```

---

### Task 9: Deep Linking Setup

Enable deep links so shared recipe URLs and invite links actually open the app.

**Files:**
- Modify: `app.json` (linking config)
- Modify: `app/_layout.tsx` (handle incoming links)

- [ ] **Step 1: Configure deep linking in app.json**

The scheme `dishr` is already set. Add universal link paths:

```json
{
  "expo": {
    "scheme": "dishr",
    "plugins": [
      ["expo-router", {
        "origin": "https://dishr.app"
      }]
    ]
  }
}
```

Expo Router handles `dishr://recipe/[id]` and `dishr://invite/[id]` automatically via file-based routing.

- [ ] **Step 2: Add invite route handler**

Create `app/invite/[id].tsx` that reads the referrer ID, stores it in AsyncStorage, and redirects to signup (or feed if already logged in).

- [ ] **Step 3: Test and commit**

```bash
git add app.json app/invite/[id].tsx
git commit -m "feat: add deep linking for recipes and invites"
```

---

## Blocked Items (Need Editor Access from Partner)

These require jpark2007 to either grant Editor role or execute themselves:

1. **Deploy edge functions** — `supabase functions deploy parse-video` and `supabase functions deploy parse-recipe`
2. **Set OPENROUTER_API_KEY secret** — via dashboard Edge Function Secrets
3. **Update feed_items RLS** — change select policy to allow public reads:
   ```sql
   drop policy "Feed items viewable by actor or followers" on feed_items;
   create policy "Feed items viewable by all" on feed_items for select using (true);
   ```
4. **Fix feed_items insert RLS** — security issue, change `with check (true)` to `with check (auth.uid() = actor_id)`
5. **Add FK on feed_items.try_id** — `alter table feed_items add constraint feed_items_try_id_fkey foreign key (try_id) references recipe_tries(id)`
6. **Run migration 003_referrals.sql**
7. **Create Dishr house account** in Supabase Auth for seed content

---

## Future (Post-Launch)

- **Contacts sync** — `expo-contacts` to find friends by phone number (requires adding phone to profiles schema, careful Apple review handling)
- **Push notifications** — expo-notifications for follow activity, recipe tries
- **Analytics** — PostHog for usage, Sentry for errors
- **Monetization** — TBD before adding premium features
