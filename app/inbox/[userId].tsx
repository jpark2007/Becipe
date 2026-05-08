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
