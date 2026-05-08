import { View, Text, FlatList, Pressable, Image, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';
import { colors, radius, shadow } from '@/lib/theme';
import { EditorialHeading } from '@/components/EditorialHeading';

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
