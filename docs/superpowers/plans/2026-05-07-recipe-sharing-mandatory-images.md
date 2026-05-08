# Recipe Sharing, Mandatory Images & UI Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace stub circles feature with a recipe DM system (send recipes to friends with notes + emoji reactions), enforce mandatory images on tries and recipe creation, fix the share intent route error, and make the explore page cards less bland.

**Architecture:** New Supabase tables `recipe_shares` and `share_reactions` with RLS. New screens for inbox and thread views. Global inbox icon component injected into tab screens. React Query polling (30s) for inbox data. Existing image upload pattern from try screen reused for recipe creation.

**Tech Stack:** Expo Router, React Native, Supabase (PostgreSQL + Storage), React Query v5, Zustand, AsyncStorage

---

### Task 1: Database Migration — recipe_shares and share_reactions

**Files:**
- Create: `supabase/migrations/014_recipe_shares.sql`

- [ ] **Step 1: Write the migration SQL**

```sql
-- 014_recipe_shares.sql
-- Recipe sharing (DM) tables

-- Shares table
CREATE TABLE IF NOT EXISTS recipe_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipe_id uuid NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  note text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_shares_recipient ON recipe_shares (recipient_id, created_at DESC);
CREATE INDEX idx_shares_thread ON recipe_shares (sender_id, recipient_id, created_at DESC);

ALTER TABLE recipe_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert shares they send"
  ON recipe_shares FOR INSERT
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can read their own shares"
  ON recipe_shares FOR SELECT
  USING (sender_id = auth.uid() OR recipient_id = auth.uid());

CREATE POLICY "Recipients can mark shares as read"
  ON recipe_shares FOR UPDATE
  USING (recipient_id = auth.uid())
  WITH CHECK (recipient_id = auth.uid());

-- Reactions table
CREATE TABLE IF NOT EXISTS share_reactions (
  share_id uuid NOT NULL REFERENCES recipe_shares(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  emoji text NOT NULL CHECK (emoji IN ('fire', 'heart', 'drooling_face', 'cook', 'raising_hands')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (share_id, user_id)
);

ALTER TABLE share_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can insert reactions"
  ON share_reactions FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM recipe_shares
      WHERE id = share_id
      AND (sender_id = auth.uid() OR recipient_id = auth.uid())
    )
  );

CREATE POLICY "Participants can read reactions"
  ON share_reactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM recipe_shares
      WHERE id = share_id
      AND (sender_id = auth.uid() OR recipient_id = auth.uid())
    )
  );
```

- [ ] **Step 2: Apply migration to Supabase**

Run: `npx supabase db push` (or apply via Supabase dashboard SQL editor if no CLI access)

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/014_recipe_shares.sql
git commit -m "feat(db): add recipe_shares and share_reactions tables with RLS"
```

---

### Task 2: Remove Circles Feature

**Files:**
- Delete: `lib/circles-stub.ts`
- Delete: `app/circle/[id].tsx`
- Delete: `components/CircleCard.tsx`
- Delete: `components/MemberRing.tsx`
- Delete: `components/RitualCard.tsx`
- Modify: `app/(tabs)/feed.tsx` — remove circles import and section
- Modify: `app/(tabs)/profile.tsx` — remove circles import and section
- Modify: `app/_layout.tsx` — remove `circle/[id]` Stack.Screen

- [ ] **Step 1: Remove circles section from feed.tsx**

In `app/(tabs)/feed.tsx`, remove these imports (lines 18, 22):
```tsx
// DELETE these lines:
import { CircleCard } from '@/components/CircleCard';
import { getStubCircles, sortCirclesByRitualEnding } from '@/lib/circles-stub';
```

Remove the circles data line (~line 84):
```tsx
// DELETE this line:
const circles = sortCirclesByRitualEnding(getStubCircles()).slice(0, 3);
```

Remove the circles JSX section (~lines 143-160) — the entire block:
```tsx
// DELETE this block:
{circles.length > 0 && (
  ...
)}
```

- [ ] **Step 2: Remove circles section from profile.tsx**

In `app/(tabs)/profile.tsx`, remove these imports (lines 18, 22):
```tsx
// DELETE these lines:
import { CircleCard } from '@/components/CircleCard';
import { getStubCircles } from '@/lib/circles-stub';
```

Remove the circles data line (~line 80):
```tsx
// DELETE this line:
const circles = getStubCircles();
```

Remove the circles JSX section (~lines 152-163) and the comment on line 3 referencing circles.

- [ ] **Step 3: Remove circle Stack.Screen from root layout**

In `app/_layout.tsx`, remove:
```tsx
// DELETE this line:
<Stack.Screen name="circle/[id]" options={{ headerShown: false }} />
```

- [ ] **Step 4: Delete circle files**

```bash
rm app/circle/\[id\].tsx
rm components/CircleCard.tsx
rm components/MemberRing.tsx
rm components/RitualCard.tsx
rm lib/circles-stub.ts
```

- [ ] **Step 5: Verify no remaining circle references**

Run: `grep -rn "circle\|CircleCard\|MemberRing\|RitualCard\|circles-stub" app/ components/ lib/ --include="*.tsx" --include="*.ts"`

Expected: No matches (or only in docs/plan files)

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: remove circles stub feature (replaced by recipe sharing)"
```

---

### Task 3: Global Inbox Icon Component

**Files:**
- Create: `components/InboxIcon.tsx`

This component is a mail icon with unread badge that can be placed in any screen header. It queries the unread count and navigates to `/inbox`.

- [ ] **Step 1: Create the InboxIcon component**

Create `components/InboxIcon.tsx`:

```tsx
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';
import { colors, shadow } from '@/lib/theme';

function useUnreadCount() {
  const userId = useAuthStore((s) => s.session?.user?.id);
  return useQuery({
    queryKey: ['inbox-unread', userId],
    queryFn: async () => {
      if (!userId) return 0;
      const { count, error } = await supabase
        .from('recipe_shares')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', userId)
        .is('read_at', null);
      if (error) return 0;
      return count ?? 0;
    },
    enabled: !!userId,
    refetchInterval: 30000,
  });
}

export function InboxIcon() {
  const router = useRouter();
  const { data: unread = 0 } = useUnreadCount();

  return (
    <Pressable style={styles.btn} onPress={() => router.push('/inbox' as any)}>
      <Text style={styles.icon}>✉</Text>
      {unread > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{unread > 9 ? '9+' : unread}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.card,
  },
  icon: {
    fontSize: 16,
    color: colors.ink,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: colors.clay,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 9,
    color: '#fff',
  },
});
```

- [ ] **Step 2: Add InboxIcon to all tab screens**

In each tab screen (`app/(tabs)/feed.tsx`, `app/(tabs)/explore.tsx`, `app/(tabs)/kitchen.tsx`, `app/(tabs)/profile.tsx`), add the inbox icon in the top-right area.

For each file, add the import:
```tsx
import { InboxIcon } from '@/components/InboxIcon';
```

Then add it to the header area. Each screen is different, so placement varies:

**feed.tsx** — add above the feed list, in the header row (look for the existing header/title area and place `<InboxIcon />` to the right using `position: 'absolute', right: 22, top: 12` or by wrapping in a flexDirection row).

**explore.tsx** — add to the `ListHeaderComponent` in the FlatList. Wrap the existing header content in a row with `<InboxIcon />` on the right:
```tsx
ListHeaderComponent={
  <View style={{ paddingTop: 6, paddingBottom: 14 }}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <EditorialHeading size={26} emphasis="palate" emphasisColor="sage">
        {'For your\n'}
      </EditorialHeading>
      <InboxIcon />
    </View>
    <Text style={styles.subtitle}>
      recipes ranked by how well they match your taste
    </Text>
  </View>
}
```

**kitchen.tsx** and **profile.tsx** — same pattern: find the header area and add `<InboxIcon />` to the right.

- [ ] **Step 3: Commit**

```bash
git add components/InboxIcon.tsx app/\(tabs\)/feed.tsx app/\(tabs\)/explore.tsx app/\(tabs\)/kitchen.tsx app/\(tabs\)/profile.tsx
git commit -m "feat: add global inbox icon with unread badge to all tab screens"
```

---

### Task 4: Inbox Screen

**Files:**
- Create: `app/inbox.tsx`
- Modify: `app/_layout.tsx` — add Stack.Screen for inbox

- [ ] **Step 1: Add inbox route to root layout**

In `app/_layout.tsx`, add inside the `<Stack>` (after the `friends` screen):
```tsx
<Stack.Screen name="inbox" options={{ headerShown: false }} />
<Stack.Screen name="inbox/[userId]" options={{ headerShown: false }} />
```

- [ ] **Step 2: Create inbox screen**

Create `app/inbox.tsx`:

```tsx
import { View, Text, FlatList, Pressable, Image, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';
import { colors, radius, shadow } from '@/lib/theme';
import { EditorialHeading } from '@/components/EditorialHeading';
import { avatarFallback } from '@/lib/avatar';

interface Conversation {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  lastRecipeTitle: string;
  lastRecipeThumbnail: string | null;
  lastShareAt: string;
  unreadCount: number;
}

async function fetchConversations(myId: string): Promise<Conversation[]> {
  const { data, error } = await supabase
    .from('recipe_shares')
    .select(`
      id, sender_id, recipient_id, note, read_at, created_at,
      sender:profiles!sender_id(id, display_name, avatar_url),
      recipient:profiles!recipient_id(id, display_name, avatar_url),
      recipe:recipes!recipe_id(title, cover_image_url)
    `)
    .or(`sender_id.eq.${myId},recipient_id.eq.${myId}`)
    .order('created_at', { ascending: false });

  if (error) throw error;

  const convMap = new Map<string, Conversation>();
  for (const share of data ?? []) {
    const otherIsRecipient = share.sender_id === myId;
    const other = otherIsRecipient ? share.recipient : share.sender;
    const otherId = otherIsRecipient ? share.recipient_id : share.sender_id;
    if (!other || convMap.has(otherId)) continue;

    const isUnread = share.recipient_id === myId && !share.read_at;
    const unreadShares = (data ?? []).filter(
      (s: any) => s.sender_id === otherId && s.recipient_id === myId && !s.read_at
    );

    convMap.set(otherId, {
      userId: otherId,
      displayName: (other as any).display_name ?? 'User',
      avatarUrl: (other as any).avatar_url,
      lastRecipeTitle: (share.recipe as any)?.title ?? 'Recipe',
      lastRecipeThumbnail: (share.recipe as any)?.cover_image_url ?? null,
      lastShareAt: share.created_at,
      unreadCount: unreadShares.length,
    });
  }

  return Array.from(convMap.values());
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

export default function InboxScreen() {
  const router = useRouter();
  const userId = useAuthStore((s) => s.session?.user?.id);

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ['inbox', userId],
    queryFn: () => fetchConversations(userId!),
    enabled: !!userId,
    refetchInterval: 30000,
  });

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backBtn}>← Back</Text>
        </Pressable>
        <EditorialHeading size={22}>Messages</EditorialHeading>
      </View>
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.userId}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
        renderItem={({ item }) => (
          <Pressable
            style={styles.convRow}
            onPress={() => router.push(`/inbox/${item.userId}` as any)}
          >
            {item.avatarUrl ? (
              <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarInitial}>
                  {item.displayName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.convBody}>
              <Text style={styles.convName} numberOfLines={1}>{item.displayName}</Text>
              <Text style={styles.convPreview} numberOfLines={1}>
                {item.lastRecipeTitle}
              </Text>
            </View>
            <View style={styles.convRight}>
              <Text style={styles.convTime}>{timeAgo(item.lastShareAt)}</Text>
              {item.unreadCount > 0 && (
                <View style={styles.unreadDot} />
              )}
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyTitle}>No messages yet</Text>
            <Text style={styles.emptyBody}>
              Share a recipe with a friend to start a conversation
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bone },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: colors.sage,
  },
  convRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarFallback: {
    backgroundColor: colors.sageSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: colors.sage,
  },
  convBody: { flex: 1 },
  convName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: colors.ink,
    marginBottom: 2,
  },
  convPreview: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: colors.muted,
  },
  convRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  convTime: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: colors.muted,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.clay,
  },
  emptyWrap: {
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: colors.ink,
    marginBottom: 8,
  },
  emptyBody: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
```

- [ ] **Step 3: Commit**

```bash
git add app/inbox.tsx app/_layout.tsx
git commit -m "feat: add inbox screen with conversation list"
```

---

### Task 5: Thread Screen

**Files:**
- Create: `app/inbox/[userId].tsx`

- [ ] **Step 1: Create the thread screen**

Create `app/inbox/[userId].tsx`:

```tsx
import { useEffect } from 'react';
import { View, Text, FlatList, Pressable, Image, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';
import { colors, radius, shadow } from '@/lib/theme';

const EMOJI_MAP: Record<string, string> = {
  fire: '🔥',
  heart: '❤️',
  drooling_face: '🤤',
  cook: '👨‍🍳',
  raising_hands: '🙌',
};
const EMOJI_KEYS = Object.keys(EMOJI_MAP);

interface Share {
  id: string;
  sender_id: string;
  recipient_id: string;
  note: string | null;
  created_at: string;
  recipe: { id: string; title: string; cover_image_url: string | null };
  reactions: { user_id: string; emoji: string }[];
}

export default function ThreadScreen() {
  const { userId: otherUserId } = useLocalSearchParams<{ userId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const myId = useAuthStore((s) => s.session?.user?.id);

  const { data: otherUser } = useQuery({
    queryKey: ['profile', otherUserId],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .eq('id', otherUserId)
        .single();
      return data;
    },
    enabled: !!otherUserId,
  });

  const { data: shares = [] } = useQuery({
    queryKey: ['thread', myId, otherUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recipe_shares')
        .select(`
          id, sender_id, recipient_id, note, created_at,
          recipe:recipes!recipe_id(id, title, cover_image_url),
          reactions:share_reactions(user_id, emoji)
        `)
        .or(
          `and(sender_id.eq.${myId},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${myId})`
        )
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as Share[];
    },
    enabled: !!myId && !!otherUserId,
    refetchInterval: 30000,
  });

  // Mark unread shares as read
  useEffect(() => {
    if (!myId || !otherUserId) return;
    supabase
      .from('recipe_shares')
      .update({ read_at: new Date().toISOString() })
      .eq('sender_id', otherUserId)
      .eq('recipient_id', myId)
      .is('read_at', null)
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ['inbox-unread'] });
      });
  }, [myId, otherUserId, shares.length]);

  const reactMutation = useMutation({
    mutationFn: async ({ shareId, emoji }: { shareId: string; emoji: string }) => {
      const { error } = await supabase
        .from('share_reactions')
        .upsert({ share_id: shareId, user_id: myId!, emoji });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['thread', myId, otherUserId] });
    },
  });

  const renderShare = ({ item }: { item: Share }) => {
    const isMine = item.sender_id === myId;
    const myReaction = item.reactions?.find((r) => r.user_id === myId);

    return (
      <View style={[styles.bubble, isMine ? styles.bubbleRight : styles.bubbleLeft]}>
        <Pressable
          style={styles.recipeCard}
          onPress={() => router.push(`/recipe/${item.recipe.id}` as any)}
        >
          {item.recipe.cover_image_url ? (
            <Image source={{ uri: item.recipe.cover_image_url }} style={styles.recipeThumbnail} />
          ) : (
            <View style={[styles.recipeThumbnail, styles.recipeFallback]}>
              <Text style={styles.fallbackGlyph}>◆</Text>
            </View>
          )}
          <Text style={styles.recipeTitle} numberOfLines={2}>{item.recipe.title}</Text>
        </Pressable>

        {item.note && <Text style={styles.note}>{item.note}</Text>}

        <View style={styles.reactionRow}>
          {EMOJI_KEYS.map((key) => {
            const count = item.reactions?.filter((r) => r.emoji === key).length ?? 0;
            const isSelected = myReaction?.emoji === key;
            return (
              <Pressable
                key={key}
                style={[styles.reactionBtn, isSelected && styles.reactionSelected]}
                onPress={() => reactMutation.mutate({ shareId: item.id, emoji: key })}
              >
                <Text style={styles.reactionEmoji}>{EMOJI_MAP[key]}</Text>
                {count > 0 && <Text style={styles.reactionCount}>{count}</Text>}
              </Pressable>
            );
          })}
        </View>

        {!isMine && (
          <Pressable
            style={styles.tryBtn}
            onPress={() => router.push(`/try/${item.recipe.id}` as any)}
          >
            <Text style={styles.tryBtnText}>I tried this →</Text>
          </Pressable>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.headerName}>{otherUser?.display_name ?? 'Loading...'}</Text>
      </View>
      <FlatList
        data={shares}
        keyExtractor={(item) => item.id}
        renderItem={renderShare}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        ListEmptyComponent={
          <Text style={styles.empty}>No recipes shared yet</Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bone },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  backText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: colors.sage,
  },
  headerName: {
    fontFamily: 'Inter_700Bold',
    fontSize: 17,
    color: colors.ink,
  },
  bubble: {
    maxWidth: '80%',
    marginBottom: 16,
  },
  bubbleRight: { alignSelf: 'flex-end' },
  bubbleLeft: { alignSelf: 'flex-start' },
  recipeCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadow.card,
  },
  recipeThumbnail: {
    width: '100%',
    height: 140,
  },
  recipeFallback: {
    backgroundColor: colors.sageSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackGlyph: { fontSize: 28, color: colors.sage, opacity: 0.4 },
  recipeTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    color: colors.ink,
    padding: 12,
    letterSpacing: -0.2,
  },
  note: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: colors.inkSoft,
    marginTop: 6,
    paddingHorizontal: 4,
  },
  reactionRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  reactionBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  reactionSelected: {
    backgroundColor: colors.sageSoft,
    borderColor: colors.sage,
  },
  reactionEmoji: { fontSize: 14 },
  reactionCount: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    color: colors.muted,
  },
  tryBtn: {
    marginTop: 8,
    backgroundColor: colors.sage,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  tryBtnText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
    color: '#fff',
  },
  empty: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
    marginTop: 60,
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add app/inbox/[userId].tsx
git commit -m "feat: add thread screen with reactions and 'I tried this' button"
```

---

### Task 6: Send Recipe Flow

**Files:**
- Create: `app/send-recipe.tsx` (modal)
- Modify: `app/recipe/[id]/index.tsx` — add share button
- Modify: `app/_layout.tsx` — add Stack.Screen for send-recipe

- [ ] **Step 1: Add send-recipe route to root layout**

In `app/_layout.tsx`, add inside `<Stack>`:
```tsx
<Stack.Screen
  name="send-recipe"
  options={{ presentation: 'formSheet', headerShown: false }}
/>
```

- [ ] **Step 2: Create send-recipe modal**

Create `app/send-recipe.tsx`:

```tsx
import { useState } from 'react';
import { View, Text, TextInput, FlatList, Pressable, Image, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';
import { colors, radius, shadow } from '@/lib/theme';

export default function SendRecipeScreen() {
  const { recipeId, recipeTitle } = useLocalSearchParams<{ recipeId: string; recipeTitle: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const myId = useAuthStore((s) => s.session?.user?.id);

  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [note, setNote] = useState('');

  const { data: following = [] } = useQuery({
    queryKey: ['following-list', myId],
    queryFn: async () => {
      const { data } = await supabase
        .from('follows')
        .select('following:profiles!following_id(id, display_name, username, avatar_url)')
        .eq('follower_id', myId!);
      return (data ?? []).map((f: any) => f.following);
    },
    enabled: !!myId,
  });

  const filtered = following.filter((u: any) =>
    !search || u.display_name.toLowerCase().includes(search.toLowerCase())
      || u.username.toLowerCase().includes(search.toLowerCase())
  );

  const sendMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('recipe_shares').insert({
        sender_id: myId!,
        recipient_id: selectedId!,
        recipe_id: recipeId!,
        note: note.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inbox'] });
      router.back();
    },
    onError: (err: any) => {
      Alert.alert('Error', err.message ?? 'Could not send recipe');
    },
  });

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.cancel}>Cancel</Text>
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>Send "{recipeTitle}"</Text>
        <Pressable
          style={[styles.sendBtn, !selectedId && styles.sendDisabled]}
          disabled={!selectedId}
          onPress={() => sendMutation.mutate()}
        >
          <Text style={styles.sendText}>Send</Text>
        </Pressable>
      </View>

      <TextInput
        style={styles.search}
        placeholder="Search friends..."
        placeholderTextColor={colors.muted}
        value={search}
        onChangeText={setSearch}
      />

      <FlatList
        data={filtered}
        keyExtractor={(item: any) => item.id}
        style={{ maxHeight: 260 }}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        renderItem={({ item }: any) => (
          <Pressable
            style={[styles.userRow, selectedId === item.id && styles.userSelected]}
            onPress={() => setSelectedId(item.id)}
          >
            {item.avatar_url ? (
              <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarInit}>{item.display_name.charAt(0).toUpperCase()}</Text>
              </View>
            )}
            <View>
              <Text style={styles.userName}>{item.display_name}</Text>
              <Text style={styles.userHandle}>@{item.username}</Text>
            </View>
            {selectedId === item.id && <Text style={styles.check}>✓</Text>}
          </Pressable>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {following.length === 0 ? 'Follow people to share recipes with them' : 'No matches'}
          </Text>
        }
      />

      <View style={styles.noteSection}>
        <Text style={styles.noteLabel}>Add a note (optional)</Text>
        <TextInput
          style={styles.noteInput}
          placeholder="Try this tonight!"
          placeholderTextColor={colors.muted}
          value={note}
          onChangeText={(t) => setNote(t.slice(0, 200))}
          multiline
          maxLength={200}
        />
        <Text style={styles.charCount}>{note.length}/200</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bone },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  cancel: { fontFamily: 'Inter_500Medium', fontSize: 14, color: colors.muted },
  title: { fontFamily: 'Inter_700Bold', fontSize: 15, color: colors.ink, flex: 1, textAlign: 'center', marginHorizontal: 8 },
  sendBtn: { backgroundColor: colors.sage, paddingHorizontal: 16, paddingVertical: 8, borderRadius: radius.pill },
  sendDisabled: { opacity: 0.4 },
  sendText: { fontFamily: 'Inter_700Bold', fontSize: 13, color: '#fff' },
  search: {
    margin: 16,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: 12,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: colors.ink,
    borderWidth: 1,
    borderColor: colors.border,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  userSelected: { backgroundColor: colors.sageSoft, marginHorizontal: -8, paddingHorizontal: 8, borderRadius: radius.sm },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  avatarFallback: { backgroundColor: colors.sageSoft, alignItems: 'center', justifyContent: 'center' },
  avatarInit: { fontFamily: 'Inter_700Bold', fontSize: 15, color: colors.sage },
  userName: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.ink },
  userHandle: { fontFamily: 'Inter_400Regular', fontSize: 11, color: colors.muted },
  check: { marginLeft: 'auto', fontSize: 18, color: colors.sage },
  emptyText: { fontFamily: 'Inter_400Regular', fontSize: 13, color: colors.muted, textAlign: 'center', marginTop: 20 },
  noteSection: { padding: 16, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  noteLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: colors.inkSoft, marginBottom: 8 },
  noteInput: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: 12,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: colors.ink,
    minHeight: 60,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: colors.border,
  },
  charCount: { fontFamily: 'Inter_400Regular', fontSize: 10, color: colors.muted, textAlign: 'right', marginTop: 4 },
});
```

- [ ] **Step 3: Add share button to recipe detail**

In `app/recipe/[id]/index.tsx`, find the header `<View style={styles.head}>` (around line 100). It currently has back button and save/heart button. Add a share button between them.

Find this block:
```tsx
<View style={styles.head}>
  <Pressable style={styles.iconBtn} onPress={() => router.back()}>
    <Text style={styles.iconText}>←</Text>
  </Pressable>
  <Pressable
    style={styles.iconBtn}
    onPress={() => saveMutation.mutate()}
  >
```

Replace with:
```tsx
<View style={styles.head}>
  <Pressable style={styles.iconBtn} onPress={() => router.back()}>
    <Text style={styles.iconText}>←</Text>
  </Pressable>
  <View style={{ flexDirection: 'row', gap: 8 }}>
    <Pressable
      style={styles.iconBtn}
      onPress={() => router.push({ pathname: '/send-recipe', params: { recipeId: recipe.id, recipeTitle: recipe.title } } as any)}
    >
      <Text style={styles.iconText}>↗</Text>
    </Pressable>
    <Pressable
      style={styles.iconBtn}
      onPress={() => saveMutation.mutate()}
    >
```

And close the new wrapping `</View>` after the save button's `</Pressable>`.

- [ ] **Step 4: Commit**

```bash
git add app/send-recipe.tsx app/recipe/\[id\]/index.tsx app/_layout.tsx
git commit -m "feat: add send recipe modal with friend picker and share button on recipe detail"
```

---

### Task 7: Mandatory Image on Try Screen

**Files:**
- Modify: `app/try/[id].tsx`

- [ ] **Step 1: Make photo required**

In `app/try/[id].tsx`, find the submit/save handler function. Add a guard at the top:

```tsx
if (!photoUri) {
  Alert.alert('Photo required', 'Add a photo of what you made');
  return;
}
```

Also find the submit button and add disabled state:
```tsx
disabled={uploading || !photoUri}
```

And update the photo card text to indicate it's required. Change:
```tsx
<Text style={styles.capBig}>
  {photoUri ? 'looks great' : 'add one'}
</Text>
```
To:
```tsx
<Text style={styles.capBig}>
  {photoUri ? 'looks great' : 'required'}
</Text>
```

- [ ] **Step 2: Commit**

```bash
git add app/try/\[id\].tsx
git commit -m "feat: make photo mandatory on try log screen"
```

---

### Task 8: Mandatory Image on Add Recipe Screen

**Files:**
- Modify: `app/add-recipe.tsx`

- [ ] **Step 1: Add image picker to recipe creation form**

In `app/add-recipe.tsx`, add the import at the top:
```tsx
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'react-native';
```

Add state for the cover image (near other state declarations):
```tsx
const [coverUri, setCoverUri] = useState<string | null>(null);
```

Add the picker function:
```tsx
async function pickCoverImage() {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.8,
    aspect: [16, 9],
    allowsEditing: true,
  });
  if (!result.canceled) {
    setCoverUri(result.assets[0].uri);
  }
}
```

Add the image section JSX after the description field and before the meta row (~line 285). Insert:
```tsx
<View style={styles.fieldCard}>
  <Text style={styles.fieldLabel}>cover photo *</Text>
  {coverUri ? (
    <Pressable onPress={pickCoverImage}>
      <Image source={{ uri: coverUri }} style={{ width: '100%', height: 180, borderRadius: 10 }} />
      <Text style={[styles.fieldLabel, { marginTop: 8, color: colors.sage }]}>tap to change</Text>
    </Pressable>
  ) : (
    <Pressable style={{ backgroundColor: colors.border, borderRadius: 10, height: 120, alignItems: 'center', justifyContent: 'center' }} onPress={pickCoverImage}>
      <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.muted }}>📷 add cover photo</Text>
    </Pressable>
  )}
</View>
```

Add the cover image upload to the save handler (reuse the pattern from try/[id].tsx — fetch blob, upload to `recipe-photos/covers/{userId}/{timestamp}.ext`, get public URL, include as `cover_image_url` in the insert).

Add validation in the save handler:
```tsx
if (!coverUri && !importedImageUrl) {
  Alert.alert('Photo required', 'Add a cover photo for your recipe');
  return;
}
```

(Where `importedImageUrl` is whatever the URL scraper returned — skip validation if import already provided an image.)

- [ ] **Step 2: Commit**

```bash
git add app/add-recipe.tsx
git commit -m "feat: add mandatory cover photo to recipe creation"
```

---

### Task 9: Photo Tips Popup

**Files:**
- Create: `components/PhotoTips.tsx`
- Modify: `app/try/[id].tsx` — show tips before picker
- Modify: `app/add-recipe.tsx` — show tips before picker

- [ ] **Step 1: Create PhotoTips component**

Create `components/PhotoTips.tsx`:

```tsx
import { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, radius } from '@/lib/theme';

const STORAGE_KEY = 'has_seen_photo_tips';

export function usePhotoTips() {
  const [shouldShow, setShouldShow] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((val) => {
      setShouldShow(val !== 'true');
      setChecked(true);
    });
  }, []);

  async function dismiss() {
    setShouldShow(false);
    await AsyncStorage.setItem(STORAGE_KEY, 'true');
  }

  return { shouldShow: checked && shouldShow, dismiss };
}

export function PhotoTipsModal({ visible, onDismiss }: { visible: boolean; onDismiss: () => void }) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Quick photo tips</Text>
          <Text style={styles.tip}>☀️  Natural light works best</Text>
          <Text style={styles.tip}>📐  Shoot from above to show the whole plate</Text>
          <Text style={styles.tip}>🔍  Get close — fill the frame</Text>
          <Pressable style={styles.btn} onPress={onDismiss}>
            <Text style={styles.btnText}>Got it</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.bone,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: 24,
    paddingBottom: 40,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: colors.ink,
    marginBottom: 16,
  },
  tip: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: colors.inkSoft,
    marginBottom: 12,
    lineHeight: 20,
  },
  btn: {
    backgroundColor: colors.sage,
    borderRadius: radius.pill,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  btnText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    color: '#fff',
  },
});
```

- [ ] **Step 2: Integrate into try and add-recipe screens**

In both `app/try/[id].tsx` and `app/add-recipe.tsx`, add:

```tsx
import { usePhotoTips, PhotoTipsModal } from '@/components/PhotoTips';
```

In the component body:
```tsx
const { shouldShow: showTips, dismiss: dismissTips } = usePhotoTips();
const [tipsVisible, setTipsVisible] = useState(false);
```

Wrap the existing `pickPhoto` / `pickCoverImage` function:
```tsx
async function handlePickPhoto() {
  if (showTips) {
    setTipsVisible(true);
    return;
  }
  await pickPhoto(); // or pickCoverImage
}
```

And add a callback on tips dismiss:
```tsx
function onTipsDismissed() {
  setTipsVisible(false);
  dismissTips();
  pickPhoto(); // or pickCoverImage — launch picker after dismissing tips
}
```

Add the modal to the JSX:
```tsx
<PhotoTipsModal visible={tipsVisible} onDismiss={onTipsDismissed} />
```

Update the `onPress` of the photo picker button from `pickPhoto` to `handlePickPhoto`.

- [ ] **Step 3: Commit**

```bash
git add components/PhotoTips.tsx app/try/\[id\].tsx app/add-recipe.tsx
git commit -m "feat: add one-time photo tips popup on first image picker use"
```

---

### Task 10: Fix Share Intent Route Error

**Files:**
- Modify: `app/_layout.tsx`

The error `becipe://dataUrl=becipeShareKey` shows "Unmatched Route" because the share extension sends a deep link that has no matching route. The `expo-share-intent` package requires using its hook to capture the shared data.

- [ ] **Step 1: Add share intent handling**

In `app/_layout.tsx`, add the import:
```tsx
import { useShareIntent } from 'expo-share-intent';
```

Inside the `AuthGate` component (or `RootLayout`), add the hook:
```tsx
const { shareIntent, resetShareIntent } = useShareIntent();

useEffect(() => {
  if (shareIntent?.text) {
    // User shared a URL from another app — navigate to add-recipe with the URL pre-filled
    router.push({ pathname: '/add-recipe', params: { importUrl: shareIntent.text } } as any);
    resetShareIntent();
  }
}, [shareIntent]);
```

Then in `app/add-recipe.tsx`, read the `importUrl` param:
```tsx
const { importUrl } = useLocalSearchParams<{ importUrl?: string }>();
```

And pre-fill the URL import field if present:
```tsx
useEffect(() => {
  if (importUrl) {
    setUrl(importUrl);
    // Optionally auto-trigger import
  }
}, [importUrl]);
```

- [ ] **Step 2: Commit**

```bash
git add app/_layout.tsx app/add-recipe.tsx
git commit -m "fix: handle share intent deep link and route to add-recipe"
```

---

### Task 11: Improve Explore "For Your Palate" Cards

**Files:**
- Modify: `app/(tabs)/explore.tsx`

The explore page currently renders a plain list of `RecipeCard` components in `plate` variant — small 76px thumbnail with text. Make it richer by switching to the `flat` variant which shows a large hero image, or by using a 2-column grid with bigger thumbnails.

- [ ] **Step 1: Switch to 2-column grid with larger cards**

In `app/(tabs)/explore.tsx`, change the FlatList to use `numColumns={2}` and adjust the renderItem:

Replace the current FlatList (lines 89-114):
```tsx
<FlatList
  data={ranked}
  keyExtractor={(item) => item.id}
  numColumns={2}
  columnWrapperStyle={{ gap: 12 }}
  renderItem={({ item }) => (
    <View style={{ flex: 1 }}>
      <RecipeCard
        recipe={item}
        showCreator
        matchScore={item.match_score}
      />
    </View>
  )}
  contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100, gap: 12 }}
  ListHeaderComponent={
    <View style={{ paddingTop: 6, paddingBottom: 14 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <EditorialHeading size={26} emphasis="palate" emphasisColor="sage">
          {'For your\n'}
        </EditorialHeading>
        <InboxIcon />
      </View>
      <Text style={styles.subtitle}>
        recipes ranked by how well they match your taste
      </Text>
    </View>
  }
  ListEmptyComponent={
    <Text style={styles.empty}>No public recipes yet — try adding one.</Text>
  }
/>
```

Add the import at the top:
```tsx
import { InboxIcon } from '@/components/InboxIcon';
```

- [ ] **Step 2: Add a compact card variant to RecipeCard (optional enhancement)**

If the 2-column grid with existing `plate` variant doesn't look good enough, add a `grid` variant to `components/RecipeCard.tsx` that uses a taller thumbnail (120px instead of 76px) stacked vertically:

Add to the Props interface:
```tsx
variant?: 'plate' | 'flat' | 'grid';
```

Add a new rendering branch before the flat variant:
```tsx
if (variant === 'grid') {
  return (
    <TouchableOpacity
      style={styles.gridCard}
      onPress={() => router.push(`/recipe/${recipe.id}`)}
      activeOpacity={0.85}
    >
      {recipe.cover_image_url ? (
        <Image source={{ uri: recipe.cover_image_url }} style={styles.gridImage} resizeMode="cover" />
      ) : (
        <View style={[styles.gridImage, styles.gridFallback]}>
          <Text style={styles.plateFallbackGlyph}>◆</Text>
        </View>
      )}
      <View style={styles.gridBody}>
        {matchScore != null && (
          <Text style={styles.plateMatchLabel}>{matchScore}% match</Text>
        )}
        <Text style={styles.gridTitle} numberOfLines={2}>{recipe.title}</Text>
        {showCreator && recipe.creator && (
          <Text style={styles.plateMeta}>by {recipe.creator.display_name}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}
```

Add styles:
```tsx
gridCard: {
  backgroundColor: colors.card,
  borderWidth: 1,
  borderColor: colors.border,
  borderRadius: radius.md,
  overflow: 'hidden',
  ...shadow.card,
},
gridImage: {
  width: '100%',
  height: 120,
},
gridFallback: {
  backgroundColor: colors.sageSoft,
  alignItems: 'center',
  justifyContent: 'center',
},
gridBody: {
  padding: 10,
},
gridTitle: {
  fontFamily: 'Inter_700Bold',
  fontSize: 14,
  color: colors.ink,
  lineHeight: 18,
  letterSpacing: -0.2,
  marginBottom: 4,
},
```

Then update explore.tsx to use `variant="grid"`:
```tsx
<RecipeCard recipe={item} variant="grid" showCreator matchScore={item.match_score} />
```

- [ ] **Step 3: Commit**

```bash
git add app/\(tabs\)/explore.tsx components/RecipeCard.tsx
git commit -m "feat: improve explore page with 2-column grid and richer recipe cards"
```

---

### Task 12: Final Verification

- [ ] **Step 1: Start dev server and verify on simulator/device**

Run: `npx expo start --dev-client`

Test:
1. Open app — no crashes
2. Go to explore tab — see 2-column grid with inbox icon
3. Tap inbox icon — see empty inbox screen
4. Open a recipe — see share button (↗) next to save
5. Tap share button — see send modal with friend list
6. Go to try screen — photo is required, can't submit without
7. Share from Instagram — app opens and routes to add-recipe (not unmatched route)

- [ ] **Step 2: Commit any fixes**

```bash
git add -A
git commit -m "fix: address integration issues found during testing"
```
