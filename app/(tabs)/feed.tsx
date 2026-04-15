import { useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Pressable,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';
import { FeedCard } from '@/components/FeedCard';
import { CircleCard } from '@/components/CircleCard';
import { colors, radius } from '@/lib/theme';
import { EditorialHeading } from '@/components/EditorialHeading';
import { initialsFor, colorForUserId } from '@/lib/avatar';
import { getStubCircles, sortCirclesByRitualEnding } from '@/lib/circles-stub';

/* ── Data fetchers ── */

async function fetchFeed(_userId: string) {
  const { data, error } = await supabase
    .from('feed_items')
    .select(`
      id, verb, created_at, try_id,
      actor:profiles!actor_id(id, display_name, username, avatar_url),
      recipe:recipes!recipe_id(id, title, cover_image_url, cuisine, palate_vector)
    `)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw error;

  const items = data ?? [];
  const tryIds = items.map((i: any) => i.try_id).filter(Boolean) as string[];
  let triesMap: Record<string, any> = {};
  if (tryIds.length > 0) {
    const { data: tries } = await supabase
      .from('recipe_tries')
      .select('id, rating, note, photo_url')
      .in('id', tryIds);
    for (const t of tries ?? []) {
      triesMap[(t as any).id] = t;
    }
  }

  return items.map((item: any) => ({
    ...item,
    try: item.try_id ? triesMap[item.try_id] ?? null : null,
  }));
}

async function fetchSuggestedUsers(userId: string) {
  const { data: followingData } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', userId);

  const followingIds = (followingData ?? []).map((f: any) => f.following_id);
  const excludeIds = [userId, ...followingIds];

  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, username, avatar_url')
    .not('id', 'in', `(${excludeIds.join(',')})`)
    .limit(10);

  if (error) throw error;
  return data ?? [];
}

/* ── Component ── */

export default function FeedScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const circles = sortCirclesByRitualEnding(getStubCircles()).slice(0, 3);

  const {
    data: feedData,
    isLoading: feedLoading,
    refetch: refetchFeed,
    isRefetching: feedRefetching,
  } = useQuery({
    queryKey: ['feed', user?.id],
    queryFn: () => fetchFeed(user!.id),
    enabled: !!user,
  });

  const { data: suggestedUsers } = useQuery({
    queryKey: ['suggested-users', user?.id],
    queryFn: () => fetchSuggestedUsers(user!.id),
    enabled: !!user,
  });

  const followMutation = useMutation({
    mutationFn: async (targetUserId: string) => {
      await (supabase.from('follows') as any).insert({
        follower_id: user!.id,
        following_id: targetUserId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suggested-users', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['feed', user?.id] });
    },
  });

  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel('feed-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'feed_items' }, () => {
        queryClient.invalidateQueries({ queryKey: ['feed', user?.id] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  const renderHeader = () => (
    <View>
      {/* Compact header */}
      <View style={styles.headerRow}>
        <Text style={styles.wordmark}>
          <Text style={{ color: colors.sage }}>◆ </Text>becipe
        </Text>
        <Pressable
          style={styles.searchIconBtn}
          onPress={() => router.push('/people-search' as any)}
          hitSlop={10}
        >
          <Text style={styles.searchIcon}>⌕</Text>
        </Pressable>
      </View>

      {/* Circle row — hide if no circles */}
      {circles.length > 0 && (
        <>
          <Text style={styles.sectionLabel}>your circles</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 18 }}>
            {circles.map((c) => (
              <CircleCard
                key={c.id}
                circle={c}
                variant="card"
                onPress={() => router.push(`/circle/${c.id}` as any)}
              />
            ))}
          </ScrollView>
        </>
      )}

      <EditorialHeading size={22} emphasis="cooking" emphasisColor="sage">
        {'See what your circle\nis '}
      </EditorialHeading>
      <View style={{ height: 14 }} />
    </View>
  );

  const renderSuggestedUser = (profile: {
    id: string;
    display_name: string;
    username: string;
    avatar_url: string | null;
  }) => {
    const isPending = followMutation.isPending && followMutation.variables === profile.id;
    return (
      <View key={profile.id} style={styles.suggestedUserRow}>
        <Pressable
          style={[styles.suggestedAvatar, { backgroundColor: colorForUserId(profile.id) }]}
          onPress={() => router.push(`/user/${profile.id}` as any)}
        >
          <Text style={styles.suggestedAvatarInitial}>{initialsFor(profile.display_name)}</Text>
        </Pressable>
        <Pressable
          style={styles.suggestedUserInfo}
          onPress={() => router.push(`/user/${profile.id}` as any)}
        >
          <Text style={styles.suggestedDisplayName} numberOfLines={1}>
            {profile.display_name}
          </Text>
          <Text style={styles.suggestedUsername} numberOfLines={1}>
            @{profile.username}
          </Text>
        </Pressable>
        <Pressable
          style={styles.followButton}
          onPress={() => followMutation.mutate(profile.id)}
          disabled={isPending}
        >
          <Text style={styles.followButtonText}>{isPending ? '...' : 'Follow'}</Text>
        </Pressable>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>Nothing yet</Text>
      <Text style={styles.emptyBody}>
        Follow cooks or join a circle to see activity here
      </Text>

      {suggestedUsers && suggestedUsers.length > 0 && (
        <View style={styles.suggestedSection}>
          <Text style={styles.suggestedHeading}>SUGGESTED COOKS</Text>
          {(suggestedUsers as any[]).map(renderSuggestedUser)}
        </View>
      )}
    </View>
  );

  if (feedLoading) {
    return (
      <SafeAreaView style={styles.screen}>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.sage} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <FlatList
        data={feedData as any[]}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <FeedCard item={item} />}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={feedRefetching}
            onRefresh={refetchFeed}
            tintColor={colors.sage}
          />
        }
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bone },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { paddingHorizontal: 22, paddingBottom: 100 },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 6,
    paddingBottom: 14,
  },
  wordmark: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 22,
    color: colors.ink,
    letterSpacing: -0.7,
  },
  searchIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchIcon: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: colors.ink,
  },

  sectionLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    color: colors.muted,
    letterSpacing: 1.0,
    textTransform: 'uppercase',
    marginTop: 4,
    marginBottom: 10,
  },

  emptyContainer: { alignItems: 'center', paddingVertical: 64 },
  emptyTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
    color: colors.ink,
    marginBottom: 12,
    letterSpacing: -0.6,
  },
  emptyBody: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 22,
  },

  suggestedSection: { marginTop: 36, width: '100%', paddingHorizontal: 8 },
  suggestedHeading: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    color: colors.muted,
    letterSpacing: 2,
    marginBottom: 16,
    textAlign: 'center',
  },
  suggestedUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
  },
  suggestedAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  suggestedAvatarInitial: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 14,
    color: '#F5E9D3',
  },
  suggestedUserInfo: { flex: 1, marginRight: 12 },
  suggestedDisplayName: {
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
    color: colors.ink,
  },
  suggestedUsername: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },
  followButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.sage,
    borderRadius: radius.pill,
  },
  followButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    letterSpacing: 0.5,
    color: '#F5E9D3',
    textTransform: 'uppercase',
  },
});
