# Dishr UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Dishr's current warm-parchment editorial design with the Stitch-generated v2 system — Newsreader headlines, Inter UI, Material Design 3 color tokens, asymmetric card layouts, and Material Icons tab bar.

**Architecture:** All color and font constants are extracted into a single `lib/theme.ts` file. Every component and screen imports tokens from there instead of defining local constants. No changes to business logic, data fetching, state management, or routing.

**Tech Stack:** Expo SDK 55, React Native StyleSheet, `@expo-google-fonts/newsreader`, `@expo-google-fonts/inter`, `@expo/vector-icons` (MaterialIcons — already bundled with Expo SDK)

---

## Token Mapping Reference

Use this everywhere in the plan. Old constant → new `COLORS` key:

| Old value | Old name | New key | New value |
|---|---|---|---|
| `#F8F4EE` | CREAM / INK | `COLORS.surface` | `#fbf9f4` |
| `#1C1712` | CHARCOAL / CREAM (confusingly) | `COLORS.onSurface` | `#1b1c19` |
| `#C4622D` | TERRA | `COLORS.primaryContainer` | `#b85c2a` |
| `#994413` | — | `COLORS.primary` | `#994413` |
| `#A09590` | MUTED | `COLORS.onSurfaceVariant` | `#55433a` |
| `#D5CCC0` | BORDER | `COLORS.outlineVariant` | `#dcc1b6` |
| `#EEE8DF` | CARD | `COLORS.surfaceContainer` | `#f0eee9` |
| `#F5F3EE` | — | `COLORS.surfaceContainerLow` | `#f5f3ee` |
| `#EAE8E3` | — | `COLORS.surfaceContainerHigh` | `#eae8e3` |
| `#EDE8DC` | button text | `COLORS.onPrimary` | `#ffffff` |
| `#B5ADA8` / `#B5ACA4` | placeholder | `COLORS.outlineVariant` | `#dcc1b6` |

Font mapping:

| Old font string | New `FONTS` key |
|---|---|
| `CormorantGaramond_400Regular` | `FONTS.headline` → `'Newsreader_400Regular'` |
| `CormorantGaramond_600SemiBold` | `FONTS.headlineBold` → `'Newsreader_700Bold'` |
| `Lora_400Regular` | `FONTS.body` → `'Inter_400Regular'` |
| `DMMono_400Regular` | `FONTS.mono` → `'DMMono_400Regular'` (unchanged) |
| `DMMono_500Medium` | `FONTS.monoMedium` → `'DMMono_500Medium'` (unchanged) |

---

## File Map

| Action | Path | Purpose |
|---|---|---|
| **Create** | `lib/theme.ts` | Single source of truth for all color + font tokens |
| **Modify** | `app/_layout.tsx` | Swap font packages in `useFonts`, update background colors |
| **Modify** | `app/(tabs)/_layout.tsx` | Rebuild tab bar with MaterialIcons + new style |
| **Modify** | `components/FeedCard.tsx` | Card with rating badge overlay, Newsreader title |
| **Modify** | `components/RecipeCard.tsx` | Card with new tokens |
| **Modify** | `app/(tabs)/feed.tsx` | New header, tab toggle style, card spacing |
| **Modify** | `app/(tabs)/explore.tsx` | New search bar, filter chips, card grid |
| **Modify** | `app/(tabs)/profile.tsx` | Stats row, avatar ring, bento recipe grid |
| **Modify** | `app/user/[id].tsx` | Same as profile but with Follow button |
| **Modify** | `app/recipe/[id]/index.tsx` | Full-bleed hero, bento ingredient/steps layout |
| **Modify** | `app/recipe/[id]/cook.tsx` | Step counter, ingredient checklist, nav buttons |
| **Modify** | `app/(auth)/login.tsx` | Wordmark, underline inputs, terra CTA |
| **Modify** | `app/(auth)/signup.tsx` | Same pattern as login |
| **Modify** | `app/(auth)/verify-email.tsx` | Same pattern as login |
| **Modify** | `app/(tabs)/add.tsx` | Import option cards |
| **Modify** | `app/try/[id].tsx` | Form redesign with new tokens |

---

## Task 1: Install font packages

**Files:** `package.json` (auto-updated by npm)

- [ ] **Step 1: Install Newsreader and Inter expo-google-fonts packages**

```bash
cd /Users/jonahpark/Becipe
npm install @expo-google-fonts/newsreader @expo-google-fonts/inter
```

Expected output: packages added to node_modules, no errors.

- [ ] **Step 2: Verify the exports exist**

```bash
node -e "const n = require('@expo-google-fonts/newsreader'); console.log(Object.keys(n).filter(k => k.includes('700') || k.includes('Italic')).slice(0,5))"
node -e "const i = require('@expo-google-fonts/inter'); console.log(Object.keys(i).filter(k => k.includes('600') || k.includes('700')).slice(0,4))"
```

Expected: arrays containing `Newsreader_700Bold`, `Newsreader_400Regular_Italic`, `Inter_600SemiBold`, `Inter_700Bold`.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat: add Newsreader and Inter font packages for UI redesign"
```

---

## Task 2: Create `lib/theme.ts`

**Files:**
- Create: `lib/theme.ts`

- [ ] **Step 1: Create the file**

```typescript
// lib/theme.ts
// Central design token system — Dishr v2
// Generated from Stitch design, Material Design 3 color scheme

export const COLORS = {
  // Backgrounds & surfaces
  surface: '#fbf9f4',
  surfaceContainer: '#f0eee9',
  surfaceContainerLow: '#f5f3ee',
  surfaceContainerHigh: '#eae8e3',
  surfaceContainerHighest: '#e4e2dd',
  surfaceContainerLowest: '#ffffff',
  surfaceDim: '#dbdad5',
  surfaceBright: '#fbf9f4',
  background: '#fbf9f4',

  // Text
  onSurface: '#1b1c19',
  onSurfaceVariant: '#55433a',
  onBackground: '#1b1c19',

  // Primary — burnt orange / terra
  primary: '#994413',
  primaryContainer: '#b85c2a',
  primaryFixed: '#ffdbcc',
  primaryFixedDim: '#ffb693',
  onPrimary: '#ffffff',
  onPrimaryContainer: '#fffeff',
  onPrimaryFixed: '#351000',
  inversePrimary: '#ffb693',
  surfaceTint: '#9a4614',

  // Secondary
  secondary: '#635e51',
  secondaryContainer: '#e7dfcf',
  secondaryFixed: '#eae2d2',
  secondaryFixedDim: '#cdc6b6',
  onSecondary: '#ffffff',
  onSecondaryContainer: '#676255',
  onSecondaryFixed: '#1f1b12',
  onSecondaryFixedVariant: '#4b463b',

  // Tertiary
  tertiary: '#5e5d5c',
  onTertiary: '#ffffff',

  // Borders
  outline: '#887269',
  outlineVariant: '#dcc1b6',

  // Inverse
  inverseSurface: '#30312e',
  inverseOnSurface: '#f2f1ec',

  // Error
  error: '#ba1a1a',
  errorContainer: '#ffdad6',
  onError: '#ffffff',
  onErrorContainer: '#93000a',
} as const;

export const FONTS = {
  // Newsreader — editorial headline/display
  headline: 'Newsreader_400Regular',
  headlineBold: 'Newsreader_700Bold',
  headlineItalic: 'Newsreader_400Regular_Italic',
  headlineSemiBold: 'Newsreader_600SemiBold',

  // Inter — body text and UI labels
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemiBold: 'Inter_600SemiBold',
  bodyBold: 'Inter_700Bold',

  // DM Mono — metadata, ratings, timestamps, tags
  mono: 'DMMono_400Regular',
  monoMedium: 'DMMono_500Medium',
} as const;
```

- [ ] **Step 2: Verify TypeScript is satisfied**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors from `lib/theme.ts`.

- [ ] **Step 3: Commit**

```bash
git add lib/theme.ts
git commit -m "feat: add centralized design token file (theme.ts)"
```

---

## Task 3: Update `app/_layout.tsx` — font loading

**Files:**
- Modify: `app/_layout.tsx`

- [ ] **Step 1: Replace font imports and `useFonts` call**

Replace the entire import block at the top of `app/_layout.tsx` (lines 9–19) and the `useFonts` call inside `RootLayout`:

```typescript
// Replace these old imports:
// import { CormorantGaramond_400Regular, CormorantGaramond_600SemiBold } from '@expo-google-fonts/cormorant-garamond';
// import { DMMono_400Regular, DMMono_500Medium } from '@expo-google-fonts/dm-mono';
// import { Lora_400Regular } from '@expo-google-fonts/lora';

// With these new imports:
import {
  Newsreader_400Regular,
  Newsreader_400Regular_Italic,
  Newsreader_600SemiBold,
  Newsreader_700Bold,
} from '@expo-google-fonts/newsreader';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  DMMono_400Regular,
  DMMono_500Medium,
} from '@expo-google-fonts/dm-mono';
```

- [ ] **Step 2: Update `useFonts` call inside `RootLayout`**

Replace the `useFonts` call (currently lines 73–79):

```typescript
const [fontsLoaded] = useFonts({
  Newsreader_400Regular,
  Newsreader_400Regular_Italic,
  Newsreader_600SemiBold,
  Newsreader_700Bold,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  DMMono_400Regular,
  DMMono_500Medium,
});
```

- [ ] **Step 3: Update background color constants**

In `RootLayout`, find all hardcoded `#F8F4EE` background colors and replace with `#fbf9f4`:

```typescript
// GestureHandlerRootView backgroundColor
<GestureHandlerRootView style={{ flex: 1, backgroundColor: '#fbf9f4' }}>

// Stack screenOptions contentStyle
contentStyle: { backgroundColor: '#fbf9f4' },

// Loading overlay backgroundColor
<View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#fbf9f4', alignItems: 'center', justifyContent: 'center' }}>

// Loading ActivityIndicator color
<ActivityIndicator color="#b85c2a" />

// try/[id] screen headerStyle
headerStyle: { backgroundColor: '#fbf9f4' },
headerTintColor: '#1b1c19',

// user/[id] screen headerStyle
headerStyle: { backgroundColor: '#fbf9f4' },
headerTintColor: '#1b1c19',
```

- [ ] **Step 4: Start dev server and verify fonts load**

```bash
npx expo start --web
```

Open in browser, verify the app loads without font errors in the console.

- [ ] **Step 5: Commit**

```bash
git add app/_layout.tsx
git commit -m "feat: swap font stack to Newsreader + Inter in root layout"
```

---

## Task 4: Update `app/(tabs)/_layout.tsx` — tab bar

**Files:**
- Modify: `app/(tabs)/_layout.tsx`

- [ ] **Step 1: Replace entire file**

```typescript
import { Tabs } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONTS } from '@/lib/theme';

type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

function TabIcon({ name, focused }: { name: IconName; focused: boolean }) {
  return (
    <MaterialIcons
      name={name}
      size={24}
      color={focused ? COLORS.primary : COLORS.onSurface + '66'}
    />
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopWidth: 1,
          borderTopColor: COLORS.outlineVariant + '1a',
          height: 70,
          paddingBottom: 12,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontFamily: FONTS.bodyBold,
          fontSize: 9,
          letterSpacing: 1.5,
          textTransform: 'uppercase',
          marginTop: 2,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.onSurface + '66',
        headerStyle: {
          backgroundColor: COLORS.surface,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.outlineVariant + '1a',
        } as any,
        headerTintColor: COLORS.onSurface,
        headerTitleStyle: {
          fontFamily: FONTS.bodyBold,
          fontSize: 11,
          letterSpacing: 2.5,
        },
      }}
    >
      <Tabs.Screen
        name="feed"
        options={{
          title: 'FEED',
          tabBarIcon: ({ focused }) => <TabIcon name="view-stream" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'EXPLORE',
          tabBarIcon: ({ focused }) => <TabIcon name="explore" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: 'ADD',
          tabBarIcon: ({ focused }) => <TabIcon name="add-circle" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'PROFILE',
          tabBarIcon: ({ focused }) => <TabIcon name="person" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
```

- [ ] **Step 2: Visually verify tab bar**

```bash
npx expo start --web
```

Verify: 4 tabs visible, MaterialIcons render, active tab uses `#994413` primary color.

- [ ] **Step 3: Commit**

```bash
git add app/(tabs)/_layout.tsx
git commit -m "feat: rebuild tab bar with MaterialIcons and new design tokens"
```

---

## Task 5: Update `components/FeedCard.tsx`

**Files:**
- Modify: `components/FeedCard.tsx`

Key changes: rating badge overlaid on image (bottom-left), recipe title in Newsreader Bold below image, note text in Inter italic, "view recipe →" in DM Mono.

- [ ] **Step 1: Replace entire file**

```typescript
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { formatDistanceToNow } from 'date-fns';
import { COLORS, FONTS } from '@/lib/theme';

interface FeedCardProps {
  item: {
    id: string;
    verb: string;
    created_at: string;
    actor: { id: string; display_name: string; username: string; avatar_url: string | null };
    recipe: { id: string; title: string; cover_image_url: string | null; cuisine: string | null };
    try?: { rating: number; note: string | null; photo_url: string | null } | null;
  };
}

export function FeedCard({ item }: FeedCardProps) {
  const router = useRouter();
  const verbLabel = item.verb === 'tried' ? 'tried' : item.verb === 'saved' ? 'saved' : 'shared';
  const photoUri = item.try?.photo_url ?? item.recipe.cover_image_url ?? null;
  const initial = item.actor.display_name[0]?.toUpperCase() ?? '?';
  const timeAgo = formatDistanceToNow(new Date(item.created_at), { addSuffix: true });

  return (
    <View style={styles.card}>
      {/* Creator row */}
      <TouchableOpacity
        style={styles.header}
        onPress={() => router.push(`/user/${item.actor.id}`)}
        activeOpacity={0.8}
      >
        <View style={styles.avatarContainer}>
          {item.actor.avatar_url ? (
            <Image source={{ uri: item.actor.avatar_url }} style={styles.avatar} />
          ) : (
            <Text style={styles.avatarInitial}>{initial}</Text>
          )}
        </View>
        <View style={styles.headerMeta}>
          <Text style={styles.displayName}>{item.actor.display_name}</Text>
          <Text style={styles.verbText}>
            {verbLabel} a recipe · {timeAgo}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Full-bleed image with rating badge */}
      {photoUri && (
        <TouchableOpacity
          onPress={() => router.push(`/recipe/${item.recipe.id}`)}
          activeOpacity={0.95}
        >
          <View style={styles.imageWrapper}>
            <Image source={{ uri: photoUri }} style={styles.photo} resizeMode="cover" />
            {item.try?.rating != null && (
              <View style={styles.ratingBadge}>
                <Text style={styles.ratingBadgeText}>
                  {item.try.rating.toFixed(1)}/10
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      )}

      {/* Footer */}
      <TouchableOpacity
        style={styles.footer}
        onPress={() => router.push(`/recipe/${item.recipe.id}`)}
        activeOpacity={0.8}
      >
        {item.recipe.cuisine && (
          <Text style={styles.cuisineTag}>{item.recipe.cuisine.toUpperCase()}</Text>
        )}
        <Text style={styles.recipeTitle} numberOfLines={2}>
          {item.recipe.title}
        </Text>
        {item.try?.note ? (
          <Text style={styles.noteText} numberOfLines={3}>
            {item.try.note}
          </Text>
        ) : null}
        <Text style={styles.viewRecipe}>View recipe →</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  avatarContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  avatar: { width: 36, height: 36, borderRadius: 18 },
  avatarInitial: {
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
    color: COLORS.onPrimary,
  },
  headerMeta: { flex: 1 },
  displayName: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 13,
    color: COLORS.onSurface,
  },
  verbText: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    marginTop: 2,
  },
  imageWrapper: { position: 'relative' },
  photo: { width: '100%', height: 260 },
  ratingBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: 'rgba(251,249,244,0.92)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 100,
  },
  ratingBadgeText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.primary,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 18,
  },
  cuisineTag: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    letterSpacing: 1.5,
    color: COLORS.primary,
    marginBottom: 6,
  },
  recipeTitle: {
    fontFamily: FONTS.headlineBold,
    fontSize: 24,
    color: COLORS.onSurface,
    lineHeight: 30,
    marginBottom: 8,
  },
  noteText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.onSurfaceVariant,
    lineHeight: 20,
    fontStyle: 'italic',
    marginBottom: 10,
  },
  viewRecipe: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    letterSpacing: 0.5,
    color: COLORS.primary,
    textTransform: 'uppercase',
    marginTop: 4,
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add components/FeedCard.tsx
git commit -m "feat: redesign FeedCard with Newsreader headlines and rating badge overlay"
```

---

## Task 6: Update `components/RecipeCard.tsx`

**Files:**
- Modify: `components/RecipeCard.tsx`

- [ ] **Step 1: Read the current file**

```bash
cat -n components/RecipeCard.tsx
```

- [ ] **Step 2: Replace all color and font references using token mapping**

At the top of the file, remove all local color constants (CREAM, CHARCOAL, TERRA, etc.) and add:

```typescript
import { COLORS, FONTS } from '@/lib/theme';
```

Then update the StyleSheet using this substitution table:

| Find | Replace |
|---|---|
| `'CormorantGaramond_600SemiBold'` | `FONTS.headlineBold` |
| `'CormorantGaramond_400Regular'` | `FONTS.headline` |
| `'Lora_400Regular'` | `FONTS.body` |
| `'DMMono_400Regular'` | `FONTS.mono` |
| `'DMMono_500Medium'` | `FONTS.monoMedium` |
| `'#F8F4EE'` or `CREAM` | `COLORS.surface` |
| `'#1C1712'` or `CHARCOAL` | `COLORS.onSurface` |
| `'#C4622D'` or `TERRA` | `COLORS.primaryContainer` |
| `'#A09590'` or `MUTED` | `COLORS.onSurfaceVariant` |
| `'#D5CCC0'` or `BORDER` | `COLORS.outlineVariant` |
| `'#EEE8DF'` or `CARD` | `COLORS.surfaceContainer` |

Also update the card container:
- `borderRadius: 0` or no radius → `borderRadius: 4`
- `backgroundColor: CARD` → `backgroundColor: COLORS.surfaceContainerLow`

- [ ] **Step 3: Verify no old font strings remain**

```bash
grep -n "CormorantGaramond\|Lora_400\|#F8F4EE\|#1C1712\|#C4622D\|#A09590\|#D5CCC0\|#EEE8DF" components/RecipeCard.tsx
```

Expected: no output (all replaced).

- [ ] **Step 4: Commit**

```bash
git add components/RecipeCard.tsx
git commit -m "feat: update RecipeCard to use theme tokens"
```

---

## Task 7: Update `app/(tabs)/feed.tsx` — header and layout

**Files:**
- Modify: `app/(tabs)/feed.tsx`

- [ ] **Step 1: Replace local color constants at the top of the file**

Remove:
```typescript
const CREAM = '#F8F4EE';
const CHARCOAL = '#1C1712';
const TERRA = '#C4622D';
const MUTED = '#A09590';
const BORDER = '#D5CCC0';
const CARD = '#EEE8DF';
```

Add:
```typescript
import { COLORS, FONTS } from '@/lib/theme';
```

- [ ] **Step 2: Replace the StyleSheet at the bottom of the file**

Replace the entire `const styles = StyleSheet.create({...})` block:

```typescript
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  cardPadding: {
    marginBottom: 0,
  },

  /* Header */
  headerContainer: {
    marginBottom: 20,
    paddingTop: 8,
  },
  title: {
    fontFamily: FONTS.headlineBold,
    fontSize: 40,
    color: COLORS.onSurface,
    letterSpacing: -0.5,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 28,
    marginTop: 16,
  },
  tabButton: {
    paddingBottom: 10,
    position: 'relative',
  },
  tabLabel: {
    fontFamily: FONTS.bodyBold,
    fontSize: 13,
    letterSpacing: 0.3,
    color: COLORS.onSurface + '66',
  },
  tabLabelActive: {
    color: COLORS.onSurface,
  },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: COLORS.primaryContainer,
  },
  headerDivider: {
    height: 1,
    backgroundColor: COLORS.outlineVariant + '33',
    marginTop: 0,
  },

  /* Empty states */
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontFamily: FONTS.headlineBold,
    fontSize: 32,
    color: COLORS.onSurfaceVariant,
    marginBottom: 12,
  },
  emptyBody: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 22,
  },

  /* Suggested users */
  suggestedSection: {
    marginTop: 36,
    width: '100%',
    paddingHorizontal: 8,
  },
  suggestedHeading: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.onSurfaceVariant,
    letterSpacing: 2,
    marginBottom: 16,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  suggestedUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainerLow,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
    borderRadius: 4,
  },
  suggestedAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  suggestedAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  suggestedAvatarInitial: {
    fontFamily: FONTS.bodyBold,
    fontSize: 16,
    color: COLORS.onPrimary,
  },
  suggestedUserInfo: {
    flex: 1,
    marginRight: 12,
  },
  suggestedDisplayName: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 13,
    color: COLORS.onSurface,
  },
  suggestedUsername: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.onSurfaceVariant,
    marginTop: 2,
  },
  followButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  followButtonText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    letterSpacing: 1,
    color: COLORS.onPrimary,
    textTransform: 'uppercase',
  },
});
```

- [ ] **Step 3: Update ActivityIndicator color**

Find `<ActivityIndicator color={TERRA} />` and replace with:
```typescript
<ActivityIndicator color={COLORS.primaryContainer} />
```

Find `tintColor={TERRA}` (in RefreshControl, appears twice) and replace both with:
```typescript
tintColor={COLORS.primaryContainer}
```

- [ ] **Step 4: Verify no old constants remain**

```bash
grep -n "CREAM\|CHARCOAL\|TERRA\|MUTED\|BORDER\|CARD\b" app/\(tabs\)/feed.tsx
```

Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add app/(tabs)/feed.tsx
git commit -m "feat: update Feed screen to use theme tokens and new tab style"
```

---

## Task 8: Update `app/(tabs)/explore.tsx`

**Files:**
- Modify: `app/(tabs)/explore.tsx`

- [ ] **Step 1: Remove local color constants, add theme import**

Find all local color constant definitions at the top of `explore.tsx` (any block with `const [A-Z]+ = '#`). Remove them and add:

```typescript
import { COLORS, FONTS } from '@/lib/theme';
```

- [ ] **Step 2: Update search bar styles**

Find the TextInput / search bar container styles. Update to use a bottom-border-only style matching the Stitch design:

```typescript
// Search container
searchContainer: {
  borderBottomWidth: 1,
  borderBottomColor: COLORS.outlineVariant,
  paddingBottom: 8,
  marginBottom: 20,
},
searchInput: {
  fontFamily: FONTS.mono,
  fontSize: 12,
  letterSpacing: 2,
  color: COLORS.onSurface,
  paddingVertical: 8,
  textTransform: 'uppercase',
},
```

- [ ] **Step 3: Update filter chip styles**

Find the cuisine filter chip styles. Update active/inactive states:

```typescript
// Active chip
chipActive: {
  backgroundColor: COLORS.primary,
  paddingHorizontal: 16,
  paddingVertical: 8,
  borderRadius: 100,
  marginRight: 8,
},
chipActiveText: {
  fontFamily: FONTS.bodyMedium,
  fontSize: 13,
  color: COLORS.onPrimary,
},
// Inactive chip
chipInactive: {
  backgroundColor: COLORS.secondaryContainer,
  paddingHorizontal: 16,
  paddingVertical: 8,
  borderRadius: 100,
  marginRight: 8,
},
chipInactiveText: {
  fontFamily: FONTS.bodyMedium,
  fontSize: 13,
  color: COLORS.onSurface,
},
```

- [ ] **Step 4: Replace all remaining old font/color strings**

```bash
grep -n "CormorantGaramond\|Lora_400\|DMMono\|#F8F4EE\|#1C1712\|#C4622D\|#A09590\|#D5CCC0\|#EEE8DF" app/\(tabs\)/explore.tsx
```

For each match, apply the token mapping table from the top of this plan.

- [ ] **Step 5: Update ActivityIndicator color**

Replace `color="#C4622D"` (or `color={TERRA}`) with `color={COLORS.primaryContainer}`.

- [ ] **Step 6: Commit**

```bash
git add app/(tabs)/explore.tsx
git commit -m "feat: update Explore screen to use theme tokens and new chip styles"
```

---

## Task 9: Update `app/(tabs)/profile.tsx`

**Files:**
- Modify: `app/(tabs)/profile.tsx`

- [ ] **Step 1: Read the full file**

```bash
cat -n app/\(tabs\)/profile.tsx
```

- [ ] **Step 2: Remove local color constants, add theme import**

Remove any `const [A-Z]+ = '#...` constants at the top and add:

```typescript
import { COLORS, FONTS } from '@/lib/theme';
```

- [ ] **Step 3: Update profile header styles**

Find the profile header (avatar, name, username, bio, stats) styles and update:

```typescript
// Avatar ring
avatarRing: {
  width: 100,
  height: 100,
  borderRadius: 50,
  borderWidth: 3,
  borderColor: COLORS.surfaceContainerLow,
  overflow: 'hidden',
},
// Name
displayName: {
  fontFamily: FONTS.headlineBold,
  fontSize: 36,
  color: COLORS.onSurface,
  lineHeight: 40,
},
// Username
username: {
  fontFamily: FONTS.mono,
  fontSize: 12,
  color: COLORS.primary,
  marginTop: 4,
},
// Bio
bio: {
  fontFamily: FONTS.body,
  fontSize: 14,
  color: COLORS.onSurfaceVariant,
  lineHeight: 22,
  marginTop: 8,
},
// Stat number
statNumber: {
  fontFamily: FONTS.mono,
  fontSize: 18,
  color: COLORS.onSurface,
},
// Stat label
statLabel: {
  fontFamily: FONTS.bodyBold,
  fontSize: 9,
  letterSpacing: 1.5,
  textTransform: 'uppercase',
  color: COLORS.onSurfaceVariant,
  marginTop: 2,
},
```

- [ ] **Step 4: Update Sign Out button and section headers**

```typescript
// Section tab (active)
sectionTabActive: {
  fontFamily: FONTS.bodyBold,
  fontSize: 13,
  color: COLORS.onSurface,
  borderBottomWidth: 2,
  borderBottomColor: COLORS.primaryContainer,
  paddingBottom: 8,
},
// Section tab (inactive)
sectionTabInactive: {
  fontFamily: FONTS.bodyMedium,
  fontSize: 13,
  color: COLORS.onSurface + '66',
  paddingBottom: 8,
},
// Sign out button
signOutButton: {
  borderWidth: 1,
  borderColor: COLORS.outlineVariant,
  paddingVertical: 10,
  paddingHorizontal: 20,
  borderRadius: 2,
  alignItems: 'center',
},
signOutText: {
  fontFamily: FONTS.mono,
  fontSize: 11,
  letterSpacing: 1,
  color: COLORS.onSurfaceVariant,
  textTransform: 'uppercase',
},
```

- [ ] **Step 5: Apply token mapping to all remaining strings**

```bash
grep -n "CormorantGaramond\|Lora_400\|#F8F4EE\|#1C1712\|#C4622D\|#A09590\|#D5CCC0\|#EEE8DF" app/\(tabs\)/profile.tsx
```

Replace each match using the token mapping table.

- [ ] **Step 6: Commit**

```bash
git add app/(tabs)/profile.tsx
git commit -m "feat: update Profile screen to use theme tokens and new header style"
```

---

## Task 10: Update `app/user/[id].tsx`

**Files:**
- Modify: `app/user/[id].tsx`

- [ ] **Step 1: Apply token migration**

```bash
grep -n "CormorantGaramond\|Lora_400\|DMMono\|#F8F4EE\|#1C1712\|#C4622D\|#A09590\|#D5CCC0\|#EEE8DF" app/user/\[id\].tsx
```

- [ ] **Step 2: Remove local constants, add theme import**

Remove any `const [A-Z]+ = '#...` constants and add:

```typescript
import { COLORS, FONTS } from '@/lib/theme';
```

- [ ] **Step 3: Replace all font/color strings using token mapping table**

Replace all occurrences found in Step 1. Pay special attention to the Follow button:

```typescript
// Follow button (filled)
followButtonFilled: {
  backgroundColor: COLORS.primary,
  paddingHorizontal: 24,
  paddingVertical: 10,
  borderRadius: 2,
},
followButtonFilledText: {
  fontFamily: FONTS.mono,
  fontSize: 11,
  letterSpacing: 1,
  color: COLORS.onPrimary,
  textTransform: 'uppercase',
},
// Following button (outlined)
followButtonOutlined: {
  borderWidth: 1,
  borderColor: COLORS.outlineVariant,
  paddingHorizontal: 24,
  paddingVertical: 10,
  borderRadius: 2,
},
followButtonOutlinedText: {
  fontFamily: FONTS.mono,
  fontSize: 11,
  letterSpacing: 1,
  color: COLORS.onSurfaceVariant,
  textTransform: 'uppercase',
},
```

- [ ] **Step 4: Commit**

```bash
git add app/user/\[id\].tsx
git commit -m "feat: update user profile screen to use theme tokens"
```

---

## Task 11: Update `app/recipe/[id]/index.tsx` — recipe detail

**Files:**
- Modify: `app/recipe/[id]/index.tsx`

This screen gets the biggest structural change: full-bleed hero image with a gradient scrim and title overlay.

- [ ] **Step 1: Add imports**

Add to the import block at the top:

```typescript
import { COLORS, FONTS } from '@/lib/theme';
```

- [ ] **Step 2: Replace the hero image section**

Find the current cover image block (around lines 79–87 in the original):
```typescript
{recipe.cover_image_url && (
  <Image
    source={{ uri: recipe.cover_image_url }}
    style={{ width: '100%', height: 250 }}
    resizeMode="cover"
  />
)}
```

Replace with a full-bleed hero with gradient overlay and title:
```typescript
{recipe.cover_image_url && (
  <View style={styles.heroContainer}>
    <Image
      source={{ uri: recipe.cover_image_url }}
      style={styles.heroImage}
      resizeMode="cover"
    />
    <View style={styles.heroGradient} />
    <View style={styles.heroContent}>
      {recipe.cuisine && (
        <Text style={styles.heroCuisineTag}>{recipe.cuisine.toUpperCase()}</Text>
      )}
      <Text style={styles.heroTitle}>{recipe.title}</Text>
      <View style={styles.heroMeta}>
        {(recipe.prep_time_min ?? 0) + (recipe.cook_time_min ?? 0) > 0 && (
          <Text style={styles.heroMetaItem}>
            {(recipe.prep_time_min ?? 0) + (recipe.cook_time_min ?? 0)} MIN
          </Text>
        )}
        {recipe.difficulty && (
          <Text style={styles.heroMetaItem}>
            {recipe.difficulty.toUpperCase()}
          </Text>
        )}
        {recipe.avg_rating !== null && (
          <Text style={styles.heroRating}>{recipe.avg_rating.toFixed(1)}/10</Text>
        )}
      </View>
    </View>
  </View>
)}
```

- [ ] **Step 3: Remove the old title, cuisine, and meta row**

Delete the existing title, cuisine label, and meta row blocks that were below the image (they're now in the hero overlay).

- [ ] **Step 4: Update ingredients section styles**

Find the ingredients list and update each ingredient row:

```typescript
ingredientRow: {
  flexDirection: 'row',
  alignItems: 'flex-start',
  paddingVertical: 14,
  borderBottomWidth: 1,
  borderBottomColor: COLORS.outlineVariant + '33',
},
ingredientAmount: {
  fontFamily: FONTS.monoMedium,
  fontSize: 12,
  color: COLORS.primary,
  width: 80,
  textTransform: 'uppercase',
},
ingredientName: {
  fontFamily: FONTS.body,
  fontSize: 15,
  color: COLORS.onSurface,
  flex: 1,
  lineHeight: 22,
},
```

- [ ] **Step 5: Update steps section styles**

```typescript
stepRow: {
  flexDirection: 'row',
  gap: 16,
  marginBottom: 28,
},
stepNumber: {
  fontFamily: FONTS.headlineBold,
  fontSize: 32,
  color: COLORS.secondaryFixedDim,
  lineHeight: 36,
  minWidth: 36,
},
stepInstruction: {
  fontFamily: FONTS.body,
  fontSize: 15,
  color: COLORS.onSurface,
  flex: 1,
  lineHeight: 24,
  paddingTop: 4,
},
```

- [ ] **Step 6: Update the "Start Cooking" button to sticky bottom bar**

Find the current action buttons (TouchableOpacity for "Start Cooking" and "Log a Try") and update:

```typescript
// Wrap the ScrollView in a View and add a fixed bottom bar
// Change the Start Cooking button style:
startCookingButton: {
  flex: 1,
  backgroundColor: COLORS.primary,
  paddingVertical: 16,
  alignItems: 'center',
  borderRadius: 2,
},
startCookingText: {
  fontFamily: FONTS.bodyBold,
  fontSize: 11,
  letterSpacing: 2,
  textTransform: 'uppercase',
  color: COLORS.onPrimary,
},
logTryButton: {
  flex: 1,
  borderWidth: 1,
  borderColor: COLORS.primary,
  paddingVertical: 16,
  alignItems: 'center',
  borderRadius: 2,
},
logTryText: {
  fontFamily: FONTS.bodyBold,
  fontSize: 11,
  letterSpacing: 2,
  textTransform: 'uppercase',
  color: COLORS.primary,
},
```

- [ ] **Step 7: Add new hero styles to StyleSheet**

```typescript
heroContainer: {
  position: 'relative',
  width: '100%',
  height: 420,
},
heroImage: {
  width: '100%',
  height: '100%',
},
heroGradient: {
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  height: '70%',
  backgroundColor: 'transparent',
  // React Native doesn't support CSS gradients natively.
  // Use a solid overlay with opacity instead:
  // Install expo-linear-gradient if you want true gradient later.
},
heroContent: {
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  padding: 24,
  paddingBottom: 28,
  backgroundColor: 'rgba(27,28,25,0.72)',
},
heroCuisineTag: {
  fontFamily: FONTS.mono,
  fontSize: 9,
  letterSpacing: 2,
  color: 'rgba(255,255,255,0.7)',
  marginBottom: 8,
  textTransform: 'uppercase',
},
heroTitle: {
  fontFamily: FONTS.headlineBold,
  fontSize: 36,
  color: '#ffffff',
  lineHeight: 42,
  marginBottom: 12,
},
heroMeta: {
  flexDirection: 'row',
  gap: 16,
  alignItems: 'center',
},
heroMetaItem: {
  fontFamily: FONTS.mono,
  fontSize: 11,
  color: 'rgba(255,255,255,0.7)',
  letterSpacing: 1,
},
heroRating: {
  fontFamily: FONTS.monoMedium,
  fontSize: 13,
  color: COLORS.primaryFixed,
},
```

- [ ] **Step 8: Replace all remaining old font/color strings**

```bash
grep -n "CormorantGaramond\|Lora_400\|#F8F4EE\|#1C1712\|#C4622D\|#A09590\|#D5CCC0\|#EEE8DF\|#EDE8DC" app/recipe/\[id\]/index.tsx
```

Apply token mapping to each match.

- [ ] **Step 9: Commit**

```bash
git add app/recipe/\[id\]/index.tsx
git commit -m "feat: redesign recipe detail with full-bleed hero and new layout"
```

---

## Task 12: Update `app/recipe/[id]/cook.tsx` — cook mode

**Files:**
- Modify: `app/recipe/[id]/cook.tsx`

- [ ] **Step 1: Add theme import**

```typescript
import { COLORS, FONTS } from '@/lib/theme';
```

- [ ] **Step 2: Replace all font/color strings**

```bash
grep -n "CormorantGaramond\|Lora_400\|#F8F4EE\|#1C1712\|#C4622D\|#A09590\|#D5CCC0" app/recipe/\[id\]/cook.tsx
```

Apply token mapping to all matches.

- [ ] **Step 3: Update cook mode header style**

Find the header/step counter area and update:

```typescript
cookHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingHorizontal: 24,
  paddingVertical: 20,
  backgroundColor: COLORS.surface,
},
stepCounter: {
  fontFamily: FONTS.mono,
  fontSize: 11,
  letterSpacing: 2,
  color: COLORS.onSurfaceVariant,
  textTransform: 'uppercase',
},
```

- [ ] **Step 4: Update step instruction text**

Find the large step instruction text and update:

```typescript
stepInstruction: {
  fontFamily: FONTS.headlineBold,
  fontSize: 32,
  color: COLORS.onSurface,
  lineHeight: 40,
  letterSpacing: -0.5,
},
```

- [ ] **Step 5: Update ingredient checklist styles**

```typescript
ingredientCheckRow: {
  flexDirection: 'row',
  alignItems: 'flex-start',
  gap: 14,
  paddingVertical: 10,
},
ingredientCheckbox: {
  width: 20,
  height: 20,
  borderWidth: 2,
  borderColor: COLORS.outlineVariant,
  borderRadius: 2,
  alignItems: 'center',
  justifyContent: 'center',
},
ingredientCheckboxChecked: {
  borderColor: COLORS.primary,
  backgroundColor: COLORS.primary,
},
ingredientAmount: {
  fontFamily: FONTS.mono,
  fontSize: 10,
  color: COLORS.onSurfaceVariant,
  textTransform: 'uppercase',
},
ingredientName: {
  fontFamily: FONTS.body,
  fontSize: 14,
  color: COLORS.onSurface,
},
```

- [ ] **Step 6: Update nav buttons (Back / Next Step)**

```typescript
navButton: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
  paddingHorizontal: 20,
  paddingVertical: 14,
  backgroundColor: COLORS.surfaceContainerLow,
  borderRadius: 100,
},
navButtonPrimary: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
  paddingHorizontal: 24,
  paddingVertical: 14,
  backgroundColor: COLORS.primaryContainer,
  borderRadius: 100,
},
navButtonText: {
  fontFamily: FONTS.bodyBold,
  fontSize: 12,
  letterSpacing: 1,
  color: COLORS.onSurface,
  textTransform: 'uppercase',
},
navButtonTextPrimary: {
  fontFamily: FONTS.bodyBold,
  fontSize: 12,
  letterSpacing: 1,
  color: COLORS.onPrimaryContainer,
  textTransform: 'uppercase',
},
```

- [ ] **Step 7: Commit**

```bash
git add app/recipe/\[id\]/cook.tsx
git commit -m "feat: update cook mode with theme tokens and pill nav buttons"
```

---

## Task 13: Update auth screens

**Files:**
- Modify: `app/(auth)/login.tsx`
- Modify: `app/(auth)/signup.tsx`
- Modify: `app/(auth)/verify-email.tsx`

- [ ] **Step 1: Update `login.tsx`**

Replace the entire file:

```typescript
import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { COLORS, FONTS } from '@/lib/theme';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  async function handleLogin() {
    if (!email || !password) return;
    setLoading(true);
    setErrorMsg('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setErrorMsg(error.message);
    } else {
      router.replace('/(tabs)/feed');
    }
    setLoading(false);
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: COLORS.surface }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={{ flex: 1, justifyContent: 'space-between', paddingHorizontal: 32, paddingTop: 96, paddingBottom: 52 }}>

        {/* Wordmark */}
        <View>
          <Text style={{ fontFamily: FONTS.headlineBold, fontSize: 72, color: COLORS.onSurface, lineHeight: 72 }}>
            Dishr
          </Text>
          <Text style={{ fontFamily: FONTS.mono, fontSize: 10, color: COLORS.onSurfaceVariant, letterSpacing: 4, marginTop: 10 }}>
            COOK · SHARE · DISCOVER
          </Text>
          <View style={{ height: 1, backgroundColor: COLORS.outlineVariant, marginTop: 28, width: '35%' }} />
        </View>

        {/* Form */}
        <View>
          <View style={{ borderBottomWidth: 1, borderBottomColor: COLORS.outlineVariant, marginBottom: 28, paddingBottom: 12 }}>
            <Text style={{ fontFamily: FONTS.mono, fontSize: 10, color: COLORS.onSurfaceVariant, letterSpacing: 2.5, marginBottom: 10 }}>
              EMAIL
            </Text>
            <TextInput
              style={{ fontFamily: FONTS.body, fontSize: 16, color: COLORS.onSurface }}
              placeholderTextColor={COLORS.outlineVariant}
              placeholder="your@email.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
          </View>

          <View style={{ borderBottomWidth: 1, borderBottomColor: COLORS.outlineVariant, marginBottom: 44, paddingBottom: 12 }}>
            <Text style={{ fontFamily: FONTS.mono, fontSize: 10, color: COLORS.onSurfaceVariant, letterSpacing: 2.5, marginBottom: 10 }}>
              PASSWORD
            </Text>
            <TextInput
              style={{ fontFamily: FONTS.body, fontSize: 16, color: COLORS.onSurface }}
              placeholderTextColor={COLORS.outlineVariant}
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
            />
          </View>

          {errorMsg ? (
            <Text style={{ fontFamily: FONTS.body, fontSize: 13, color: COLORS.error, marginBottom: 16, lineHeight: 20 }}>
              {errorMsg}
            </Text>
          ) : null}

          <TouchableOpacity
            style={{ backgroundColor: COLORS.primary, paddingVertical: 17, alignItems: 'center', borderRadius: 2 }}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color={COLORS.onPrimary} />
              : <Text style={{ fontFamily: FONTS.monoMedium, fontSize: 11, color: COLORS.onPrimary, letterSpacing: 3.5 }}>SIGN IN</Text>
            }
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
          <Text style={{ fontFamily: FONTS.mono, fontSize: 12, color: COLORS.onSurfaceVariant }}>No account? </Text>
          <Link href="/(auth)/signup">
            <Text style={{ fontFamily: FONTS.mono, fontSize: 12, color: COLORS.primary }}>Create one →</Text>
          </Link>
        </View>

      </View>
    </KeyboardAvoidingView>
  );
}
```

- [ ] **Step 2: Apply same token swap to `signup.tsx`**

```bash
grep -n "CormorantGaramond\|Lora_400\|#F8F4EE\|#1C1712\|#C4622D\|#A09590\|#D5CCC0\|#B5A" app/\(auth\)/signup.tsx
```

Add `import { COLORS, FONTS } from '@/lib/theme';`, remove local constants, apply token mapping table. Follow the same structural pattern as `login.tsx`:
- Wordmark: `FONTS.headlineBold`, fontSize 72
- Labels: `FONTS.mono`, `COLORS.onSurfaceVariant`, letterSpacing 2.5
- Inputs: `FONTS.body`, `COLORS.onSurface`
- CTA button: `COLORS.primary` background, `COLORS.onPrimary` text
- Error text: `COLORS.error`
- Footer link: `COLORS.primary`

- [ ] **Step 3: Apply same token swap to `verify-email.tsx`**

```bash
grep -n "CormorantGaramond\|Lora_400\|#F8F4EE\|#1C1712\|#C4622D\|#A09590\|#D5CCC0" app/\(auth\)/verify-email.tsx
```

Apply the same process as signup.tsx.

- [ ] **Step 4: Commit**

```bash
git add app/\(auth\)/login.tsx app/\(auth\)/signup.tsx app/\(auth\)/verify-email.tsx
git commit -m "feat: update auth screens to use theme tokens and new wordmark font"
```

---

## Task 14: Update `app/(tabs)/add.tsx`

**Files:**
- Modify: `app/(tabs)/add.tsx`

- [ ] **Step 1: Read the file and find token usages**

```bash
grep -n "CormorantGaramond\|Lora_400\|DMMono\|#F8F4EE\|#1C1712\|#C4622D\|#A09590\|#D5CCC0\|#EEE8DF" app/\(tabs\)/add.tsx
```

- [ ] **Step 2: Remove local constants, add theme import**

```typescript
import { COLORS, FONTS } from '@/lib/theme';
```

- [ ] **Step 3: Update import option cards**

Find the three import option card styles (type manually, URL import, TikTok/Instagram) and update:

```typescript
importCard: {
  backgroundColor: COLORS.surfaceContainerLow,
  borderRadius: 4,
  padding: 20,
  marginBottom: 12,
},
importCardTitle: {
  fontFamily: FONTS.headlineBold,
  fontSize: 22,
  color: COLORS.onSurface,
  marginBottom: 6,
},
importCardDesc: {
  fontFamily: FONTS.body,
  fontSize: 14,
  color: COLORS.onSurfaceVariant,
  lineHeight: 21,
},
importCardArrow: {
  fontFamily: FONTS.mono,
  fontSize: 16,
  color: COLORS.primary,
  alignSelf: 'flex-end',
  marginTop: 12,
},
```

- [ ] **Step 4: Update form field styles (manual entry form)**

```typescript
fieldLabel: {
  fontFamily: FONTS.mono,
  fontSize: 10,
  letterSpacing: 2,
  color: COLORS.onSurfaceVariant,
  textTransform: 'uppercase',
  marginBottom: 8,
},
fieldInput: {
  fontFamily: FONTS.body,
  fontSize: 15,
  color: COLORS.onSurface,
  borderBottomWidth: 1,
  borderBottomColor: COLORS.outlineVariant,
  paddingBottom: 10,
  marginBottom: 24,
},
submitButton: {
  backgroundColor: COLORS.primary,
  paddingVertical: 16,
  alignItems: 'center',
  borderRadius: 2,
  marginTop: 8,
},
submitButtonText: {
  fontFamily: FONTS.bodyBold,
  fontSize: 11,
  letterSpacing: 2,
  color: COLORS.onPrimary,
  textTransform: 'uppercase',
},
```

- [ ] **Step 5: Apply token mapping to all remaining matches from Step 1**

- [ ] **Step 6: Commit**

```bash
git add app/\(tabs\)/add.tsx
git commit -m "feat: update Add screen to use theme tokens and new card styles"
```

---

## Task 15: Update `app/try/[id].tsx` — log a try

**Files:**
- Modify: `app/try/[id].tsx`

- [ ] **Step 1: Find all old tokens**

```bash
grep -n "CormorantGaramond\|Lora_400\|DMMono\|#F8F4EE\|#1C1712\|#C4622D\|#A09590\|#D5CCC0\|#EEE8DF" app/try/\[id\].tsx
```

- [ ] **Step 2: Remove local constants, add theme import**

```typescript
import { COLORS, FONTS } from '@/lib/theme';
```

- [ ] **Step 3: Update photo upload area**

Find the photo picker button/area and update:

```typescript
photoUpload: {
  width: '100%',
  height: 220,
  backgroundColor: COLORS.surfaceContainerLow,
  borderRadius: 4,
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: 24,
  overflow: 'hidden',
},
photoUploadLabel: {
  fontFamily: FONTS.mono,
  fontSize: 10,
  letterSpacing: 2,
  color: COLORS.onSurfaceVariant,
  textTransform: 'uppercase',
  marginTop: 8,
},
```

- [ ] **Step 4: Update rating and notes styles**

```typescript
ratingLabel: {
  fontFamily: FONTS.mono,
  fontSize: 10,
  letterSpacing: 2,
  color: COLORS.onSurfaceVariant,
  textTransform: 'uppercase',
  marginBottom: 12,
},
ratingValue: {
  fontFamily: FONTS.headlineBold,
  fontSize: 52,
  color: COLORS.primary,
},
notesInput: {
  fontFamily: FONTS.body,
  fontSize: 15,
  color: COLORS.onSurface,
  borderBottomWidth: 1,
  borderBottomColor: COLORS.outlineVariant,
  paddingBottom: 10,
  marginBottom: 32,
  minHeight: 80,
},
submitButton: {
  backgroundColor: COLORS.primary,
  paddingVertical: 16,
  alignItems: 'center',
  borderRadius: 2,
},
submitButtonText: {
  fontFamily: FONTS.bodyBold,
  fontSize: 11,
  letterSpacing: 2,
  color: COLORS.onPrimary,
  textTransform: 'uppercase',
},
```

- [ ] **Step 5: Apply token mapping to all remaining matches from Step 1**

- [ ] **Step 6: Commit**

```bash
git add app/try/\[id\].tsx
git commit -m "feat: update Log a Try screen to use theme tokens"
```

---

## Task 16: Final visual pass and cleanup

**Files:** All modified files

- [ ] **Step 1: Scan for any remaining old tokens across the codebase**

```bash
grep -rn "CormorantGaramond\|Lora_400\|#F8F4EE\|#1C1712\|#C4622D\|#A09590\|#D5CCC0\|#EEE8DF\|#EDE8DC\|#B5ADA8\|#B5ACA4" \
  app/ components/ \
  --include="*.tsx" --include="*.ts"
```

- [ ] **Step 2: Fix any remaining matches**

Apply token mapping table to each match found.

- [ ] **Step 3: Run the app on web and spot-check all screens**

```bash
npx expo start --web
```

Navigate through: Login → Feed (Discover) → Feed (Following) → Explore → Add → Profile → tap a recipe card → Recipe Detail → Start Cooking → Back → Log a Try.

Verify: no broken text (squares/fallback fonts), correct terra-orange accent, parchment background throughout.

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete Dishr UI redesign — Newsreader + Inter + MD3 color tokens"
```
