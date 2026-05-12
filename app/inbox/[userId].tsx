import { useEffect, useState } from 'react';
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
  const [activeReactionId, setActiveReactionId] = useState<string | null>(null);

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
    const showReactionPicker = activeReactionId === item.id;

    // Aggregate reactions by emoji for badge display
    const reactionCounts: { emoji: string; key: string; count: number }[] = [];
    if (item.reactions?.length) {
      const grouped: Record<string, number> = {};
      for (const r of item.reactions) {
        grouped[r.emoji] = (grouped[r.emoji] || 0) + 1;
      }
      for (const [key, count] of Object.entries(grouped)) {
        if (EMOJI_MAP[key]) {
          reactionCounts.push({ emoji: EMOJI_MAP[key], key, count });
        }
      }
    }

    return (
      <View style={[styles.bubble, isMine ? styles.bubbleRight : styles.bubbleLeft]}>
        {/* Floating reaction picker */}
        {showReactionPicker && (
          <View style={styles.reactionBar}>
            {EMOJI_KEYS.map((key) => {
              const isSelected = myReaction?.emoji === key;
              return (
                <Pressable
                  key={key}
                  style={[styles.reactionBarBtn, isSelected && styles.reactionBarBtnSelected]}
                  onPress={() => {
                    reactMutation.mutate({ shareId: item.id, emoji: key });
                    setActiveReactionId(null);
                  }}
                >
                  <Text style={styles.reactionBarEmoji}>{EMOJI_MAP[key]}</Text>
                </Pressable>
              );
            })}
          </View>
        )}

        {/* Recipe card with long-press */}
        <Pressable
          style={styles.recipeCard}
          onPress={() => {
            if (activeReactionId) {
              setActiveReactionId(null);
              return;
            }
            router.push(`/recipe/${item.recipe.id}` as any);
          }}
          onLongPress={() => setActiveReactionId(item.id)}
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

        {/* Note bubble */}
        {item.note && (
          <View style={[styles.noteBubble, isMine ? styles.noteBubbleSent : styles.noteBubbleReceived]}>
            <Text style={styles.noteText}>{item.note}</Text>
          </View>
        )}

        {/* Reaction badge */}
        {reactionCounts.length > 0 && (
          <View style={[styles.reactionBadgeRow, isMine ? styles.badgeRight : styles.badgeLeft]}>
            {reactionCounts.map((r) => (
              <View key={r.key} style={styles.reactionBadge}>
                <Text style={styles.reactionBadgeEmoji}>{r.emoji}</Text>
                {r.count > 1 && <Text style={styles.reactionBadgeCount}>{r.count}</Text>}
              </View>
            ))}
          </View>
        )}

        {/* "I tried this" button — received messages only */}
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
        data={[...shares].reverse()}
        inverted={true}
        keyExtractor={(item) => item.id}
        renderItem={renderShare}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        onScrollBeginDrag={() => setActiveReactionId(null)}
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
  // Note bubble styles
  noteBubble: {
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: radius.lg,
  },
  noteBubbleSent: {
    backgroundColor: colors.sageSoft,
  },
  noteBubbleReceived: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  noteText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: colors.ink,
  },
  // Floating reaction bar
  reactionBar: {
    flexDirection: 'row',
    alignSelf: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.pill,
    padding: 6,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
    ...shadow.card,
  },
  reactionBarBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reactionBarBtnSelected: {
    backgroundColor: colors.sageSoft,
  },
  reactionBarEmoji: {
    fontSize: 18,
  },
  // Reaction badge
  reactionBadgeRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 6,
  },
  badgeRight: {
    justifyContent: 'flex-end',
    alignSelf: 'flex-end',
  },
  badgeLeft: {
    justifyContent: 'flex-start',
    alignSelf: 'flex-start',
  },
  reactionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 2,
  },
  reactionBadgeEmoji: {
    fontSize: 12,
  },
  reactionBadgeCount: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    color: colors.muted,
  },
  // Try button
  tryBtn: {
    marginTop: 6,
    backgroundColor: colors.sageSoft,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  tryBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: colors.sage,
  },
  empty: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
    marginTop: 60,
  },
});
