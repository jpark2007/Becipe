# Reload Bug & URL Import Fix

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix two bugs — pages not loading until browser reload, and recipe URL import failing via CORS proxies.

**Architecture:** Add an auth readiness gate in the root layout so tab screens never render before auth resolves. Replace flaky CORS proxy recipe parsing with the deployed Supabase Edge Function.

**Tech Stack:** Expo Router, Supabase Edge Functions, React Query v5, Zustand

---

## Task 1: Auth Gate — Prevent Tabs from Rendering Before Auth Resolves

The root cause of the reload bug: Expo Router tabs stay mounted after first visit. Queries with `enabled: !!user` get disabled on mount (before auth hydrates) and never recover. Fix: block the `<Stack>` from rendering until `getSession()` has resolved.

**Files:**
- Modify: `app/_layout.tsx`
- Modify: `store/auth.ts`

- [ ] **Step 1: Add `isAuthReady` to auth store**

In `store/auth.ts`, add an `isAuthReady` boolean and setter:

```ts
import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';
import type { Profile } from '@/lib/database.types';

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isAuthReady: boolean;
  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  setAuthReady: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  profile: null,
  isAuthReady: false,
  setSession: (session) => set({ session, user: session?.user ?? null }),
  setProfile: (profile) => set({ profile }),
  setAuthReady: () => set({ isAuthReady: true }),
}));
```

- [ ] **Step 2: Update AuthGate to set `isAuthReady` after `getSession()`**

In `app/_layout.tsx`, update `AuthGate` to call `setAuthReady()` after the initial `getSession()` resolves — whether session is null or not:

```tsx
function AuthGate() {
  const router = useRouter();
  const segments = useSegments();
  const { session, setSession, setProfile, isAuthReady, setAuthReady } = useAuthStore();
  const navigationState = useRootNavigationState();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthReady(); // Auth resolved — safe to render screens
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      queryClient.invalidateQueries();

      if (session?.user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        setProfile(data);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!isAuthReady || !navigationState?.key) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup) {
      router.replace('/(tabs)/feed');
    }
  }, [session, segments, navigationState?.key, isAuthReady]);

  return null;
}
```

- [ ] **Step 3: Block `<Stack>` rendering until auth is ready**

In `app/_layout.tsx`, update `RootLayout` to show a loading screen until auth resolves:

```tsx
export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    CormorantGaramond_400Regular,
    CormorantGaramond_600SemiBold,
    DMMono_400Regular,
    DMMono_500Medium,
    Lora_400Regular,
  });

  const isAuthReady = useAuthStore((s) => s.isAuthReady);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#F8F4EE' }}>
      <QueryClientProvider client={queryClient}>
        <AuthGate />
        <StatusBar style="dark" />
        {isAuthReady ? (
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: '#F8F4EE' },
            }}
          >
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="recipe/[id]"
              options={{
                headerShown: true,
                title: '',
                headerStyle: { backgroundColor: '#F8F4EE' },
                headerTintColor: '#1C1712',
              }}
            />
            <Stack.Screen
              name="recipe/[id]/cook"
              options={{ presentation: 'fullScreenModal', headerShown: false }}
            />
            <Stack.Screen
              name="try/[id]"
              options={{
                presentation: 'modal',
                headerShown: true,
                title: 'Log a Try',
                headerStyle: { backgroundColor: '#F8F4EE' },
                headerTintColor: '#1C1712',
              }}
            />
            <Stack.Screen
              name="user/[id]"
              options={{
                headerShown: true,
                title: '',
                headerStyle: { backgroundColor: '#F8F4EE' },
                headerTintColor: '#1C1712',
              }}
            />
          </Stack>
        ) : (
          <View style={{ flex: 1, backgroundColor: '#F8F4EE', alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator color="#C4622D" />
          </View>
        )}
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
```

Add `View` and `ActivityIndicator` to the imports at the top of the file:

```tsx
import { View, ActivityIndicator } from 'react-native';
```

- [ ] **Step 4: Test the auth gate**

1. Open the app in browser (`npx expo start`, press `w`)
2. Navigate to Profile tab — should load immediately without reload
3. Switch between Feed → Profile → Explore — all should load on first visit
4. Sign out → sign back in → all tabs should load without reload

---

## Task 2: URL Import — Edge Function Only

Remove all CORS proxy code. Use the deployed `parse-recipe` Edge Function as the sole path for recipe URL import. Increase timeout to 15s for slow sites.

**Files:**
- Modify: `app/(tabs)/add.tsx`

- [ ] **Step 1: Remove `parseRecipeFromUrl` and `parseSchemaRecipe` functions**

Delete lines 35-117 of `add.tsx` — the `parseSchemaRecipe` function and the `parseRecipeFromUrl` function (including the `parseDuration` helper). These are the client-side CORS proxy parsers that no longer serve a purpose.

Keep: `isVideoUrl` (line 23-25), and all the form/save logic.

- [ ] **Step 2: Simplify `handleImport` to use Edge Function only**

Replace the current `handleImport` function with:

```tsx
async function handleImport(url?: string) {
  const targetUrl = (url ?? importUrl).trim();
  if (!targetUrl) return;

  setImporting(true);
  setImportError('');
  try {
    const data = await tryEdgeFunction(targetUrl);
    applyParsedData(data, targetUrl);
  } catch (err: any) {
    setImportError(
      err.message?.includes('No auth session')
        ? 'Please sign in again to import recipes.'
        : 'Could not import that recipe. Try a different URL from a site like BBC Good Food, Serious Eats, or AllRecipes.'
    );
  } finally {
    setImporting(false);
  }
}
```

- [ ] **Step 3: Increase edge function timeout to 15s**

In the `tryEdgeFunction` function, change the timeout from 10000 to 15000:

```tsx
const timer = setTimeout(() => controller.abort(), 15000);
```

- [ ] **Step 4: Test URL import**

1. Go to Add → Import from URL
2. Paste `https://www.allrecipes.com/recipe/21014/good-old-fashioned-pancakes/`
3. Should parse and fill the form within ~5-10 seconds
4. Try `https://www.bbcgoodfood.com/recipes/easy-pancakes` as a second test
5. Console should show NO `corsproxy.io` or `allorigins.win` requests

---

## Task 3: Commit

- [ ] **Step 1: Commit all changes**

```bash
git add store/auth.ts app/_layout.tsx app/(tabs)/add.tsx
git commit -m "fix: auth gate prevents reload bug, edge function for URL import

- Add isAuthReady gate so tabs don't render before auth resolves
- Remove flaky CORS proxy parsers, use deployed Edge Function only
- Increase import timeout to 15s for slow recipe sites"
```

---

## Blocked Items (for partner or once Drew has Editor access)

These are NOT part of this plan but should be tracked:

1. Set `OPENROUTER_API_KEY` secret: `supabase secrets set OPENROUTER_API_KEY=<key>` (needed for TikTok/Instagram import)
2. Update `feed_items` SELECT RLS to allow public reads
3. Fix `feed_items` INSERT RLS: `with check (auth.uid() = actor_id)`
4. Add FK on `feed_items.try_id` → `recipe_tries(id)`
