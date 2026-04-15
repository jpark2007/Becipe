import { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Pressable,
  TouchableOpacity,
  Image,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';
import { FeedCard } from '@/components/FeedCard';
import { RecipeCard } from '@/components/RecipeCard';
import { colors, radius } from '@/lib/theme';
import { EditorialHeading } from '@/components/EditorialHeading';

/* ── Types ── */
type FeedTab = 'discover' | 'following';

/* ── Data fetchers ── */

async function fetchFeed(userId: string) {
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

  // Fetch try data separately (no FK constraint on try_id)
  const items = data ?? [];
  const tryIds = items.map(i => i.try_id).filter(Boolean) as string[];
  let triesMap: Record<string, any> = {};
  if (tryIds.length > 0) {
    const { data: tries } = await supabase
      .from('recipe_tries')
      .select('id, rating, note, photo_url')
      .in('id', tryIds);
    for (const t of tries ?? []) {
      triesMap[t.id] = t;
    }
  }

  return items.map(item => ({
    ...item,
    try: item.try_id ? triesMap[item.try_id] ?? null : null,
  }));
}

async function fetchDiscover() {
  const { data, error } = await supabase
    .from('recipes')
    .select('*, creator:profiles!created_by(id, display_name, username, avatar_url), tries:recipe_tries(rating)')
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw error;

  return (data ?? []).map((r: any) => {
    const ratings = (r.tries ?? []).map((t: any) => t.rating).filter(Boolean);
    return {
      ...r,
      avg_rating: ratings.length
        ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length
        : null,
      try_count: ratings.length,
    };
  });
}

async function fetchSuggestedUsers(userId: string) {
  // Get IDs the current user already follows
  const { data: followingData } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', userId);

  const followingIds = (followingData ?? []).map(f => f.following_id);
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
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<FeedTab>('discover');

  /* ── Discover query ── */
  const {
    data: discoverData,
    isLoading: discoverLoading,
    refetch: refetchDiscover,
    isRefetching: discoverRefetching,
  } = useQuery({
    queryKey: ['discover'],
    queryFn: fetchDiscover,
    enabled: activeTab === 'discover',
  });

  /* ── Following feed query ── */
  const {
    data: feedData,
    isLoading: feedLoading,
    refetch: refetchFeed,
    isRefetching: feedRefetching,
  } = useQuery({
    queryKey: ['feed', user?.id],
    queryFn: () => fetchFeed(user!.id),
    enabled: !!user && activeTab === 'following',
  });

  /* ── Suggested users (for empty following state) ── */
  const { data: suggestedUsers } = useQuery({
    queryKey: ['suggested-users', user?.id],
    queryFn: () => fetchSuggestedUsers(user!.id),
    enabled: !!user && activeTab === 'following',
  });

  /* ── Follow mutation ── */
  const followMutation = useMutation({
    mutationFn: async (targetUserId: string) => {
      await supabase.from('follows').insert({
        follower_id: user!.id,
        following_id: targetUserId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suggested-users', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['feed', user?.id] });
    },
  });

  /* ── Realtime subscription for feed_items ── */
  useEffect(() => {
    if (!user?.id) return; // don't open WebSocket before auth is ready

    const channel = supabase
      .channel('feed-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'feed_items' }, () => {
        queryClient.invalidateQueries({ queryKey: ['feed', user?.id] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  /* ── Derived state ── */
  const isLoading = activeTab === 'discover' ? discoverLoading : feedLoading;
  const isRefetching = activeTab === 'discover' ? discoverRefetching : feedRefetching;
  const onRefresh = activeTab === 'discover' ? refetchDiscover : refetchFeed;

  /* ── Tab header ── */
  const renderHeader = () => (
    <View>
      <View style={styles.headerBlock}>
        <View style={styles.wordmarkRow}>
          <Text style={styles.wordmark}>
            <Text style={{ color: colors.sage }}>◆ </Text>becipe
          </Text>
        </View>
        <EditorialHeading size={26} emphasis="cooking" emphasisColor="sage">
          {'See what your circle\nis '}
        </EditorialHeading>
      </View>

      {/* Pill tabs */}
      <View style={styles.pillRow}>
        {([
          { key: 'discover' as FeedTab, label: 'Discover' },
          { key: 'following' as FeedTab, label: 'Following' },
        ]).map(({ key, label }) => {
          const active = activeTab === key;
          return (
            <Pressable
              key={key}
              onPress={() => setActiveTab(key)}
              style={[
                styles.pill,
                { backgroundColor: active ? colors.ink : 'transparent' },
              ]}
            >
              <Text
                style={[
                  styles.pillLabel,
                  { color: active ? '#fff' : colors.muted },
                ]}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );

  /* ── Suggested user card ── */
  const renderSuggestedUser = (profile: {
    id: string;
    display_name: string;
    username: string;
    avatar_url: string | null;
  }) => {
    const initial = profile.display_name?.[0]?.toUpperCase() ?? '?';
    const isPending = followMutation.isPending && followMutation.variables === profile.id;

    return (
      <View key={profile.id} style={styles.suggestedUserRow}>
        {/* Avatar */}
        <View style={styles.suggestedAvatar}>
          {profile.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.suggestedAvatarImage} />
          ) : (
            <Text style={styles.suggestedAvatarInitial}>{initial}</Text>
          )}
        </View>

        {/* Name + username */}
        <View style={styles.suggestedUserInfo}>
          <Text style={styles.suggestedDisplayName} numberOfLines={1}>
            {profile.display_name}
          </Text>
          <Text style={styles.suggestedUsername} numberOfLines={1}>
            @{profile.username}
          </Text>
        </View>

        {/* Follow button */}
        <TouchableOpacity
          style={styles.followButton}
          onPress={() => followMutation.mutate(profile.id)}
          disabled={isPending}
          activeOpacity={0.75}
        >
          <Text style={styles.followButtonText}>
            {isPending ? '...' : 'Follow'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  /* ── Empty states ── */
  const renderDiscoverEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>Nothing yet</Text>
      <Text style={styles.emptyBody}>
        No recipes yet — be the first to add one!
      </Text>
    </View>
  );

  const renderFollowingEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>Nothing yet</Text>
      <Text style={styles.emptyBody}>
        Follow friends or try a recipe to see activity here
      </Text>

      {/* Suggested users */}
      {suggestedUsers && suggestedUsers.length > 0 && (
        <View style={styles.suggestedSection}>
          <Text style={styles.suggestedHeading}>SUGGESTED COOKS</Text>
          {suggestedUsers.map(renderSuggestedUser)}
        </View>
      )}
    </View>
  );

  /* ── Loading state ── */
  if (isLoading) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.sage} />
        </View>
      </SafeAreaView>
    );
  }

  /* ── Discover tab ── */
  if (activeTab === 'discover') {
    return (
      <SafeAreaView style={styles.screen}>
        <FlatList
          data={discoverData as any[]}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.cardPadding}>
              <RecipeCard recipe={item} showCreator />
            </View>
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={onRefresh}
              tintColor={colors.sage}
            />
          }
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderDiscoverEmpty}
        />
      </SafeAreaView>
    );
  }

  /* ── Following tab ── */
  return (
    <SafeAreaView style={styles.screen}>
      <FlatList
        data={feedData as any[]}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <FeedCard item={item} />}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={onRefresh}
            tintColor={colors.sage}
          />
        }
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderFollowingEmpty}
      />
    </SafeAreaView>
  );
}

/* ── Styles ── */
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bone,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: 22,
    paddingBottom: 100,
  },
  cardPadding: {
    marginBottom: 14,
  },

  /* Header */
  headerBlock: {
    paddingTop: 14,
    paddingBottom: 8,
  },
  wordmarkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  wordmark: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 22,
    color: colors.ink,
    letterSpacing: -0.7,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 18,
    marginBottom: 18,
  },
  pill: {
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderRadius: 999,
  },
  pillLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
  },

  /* Empty states */
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 64,
  },
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

  /* Suggested users */
  suggestedSection: {
    marginTop: 36,
    width: '100%',
    paddingHorizontal: 8,
  },
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
    backgroundColor: colors.sage,
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
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: '#F5E9D3',
  },
  suggestedUserInfo: {
    flex: 1,
    marginRight: 12,
  },
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
