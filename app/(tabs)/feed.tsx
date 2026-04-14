import { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Image,
  StyleSheet,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';
import { FeedCard } from '@/components/FeedCard';
import { RecipeCard } from '@/components/RecipeCard';
import { COLORS, FONTS } from '@/lib/theme';

/* ── Types ── */
type FeedTab = 'discover' | 'following';

/* ── Data fetchers ── */

async function fetchFeed(userId: string) {
  const { data, error } = await supabase
    .from('feed_items')
    .select(`
      id, verb, created_at, try_id,
      actor:profiles!actor_id(id, display_name, username, avatar_url),
      recipe:recipes!recipe_id(id, title, cover_image_url, cuisine)
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
    if (!user?.id) return;

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
    <View style={styles.headerContainer}>
      <Text style={styles.title}>Dishr</Text>

      {/* Tab toggle */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={styles.tabButton}
          onPress={() => setActiveTab('discover')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabLabel, activeTab === 'discover' && styles.tabLabelActive]}>
            DISCOVER
          </Text>
          {activeTab === 'discover' && <View style={styles.tabUnderline} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabButton}
          onPress={() => setActiveTab('following')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabLabel, activeTab === 'following' && styles.tabLabelActive]}>
            FOLLOWING
          </Text>
          {activeTab === 'following' && <View style={styles.tabUnderline} />}
        </TouchableOpacity>
      </View>

      <View style={styles.headerDivider} />
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
        <View style={styles.suggestedAvatar}>
          {profile.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.suggestedAvatarImage} />
          ) : (
            <Text style={styles.suggestedAvatarInitial}>{initial}</Text>
          )}
        </View>

        <View style={styles.suggestedUserInfo}>
          <Text style={styles.suggestedDisplayName} numberOfLines={1}>
            {profile.display_name}
          </Text>
          <Text style={styles.suggestedUsername} numberOfLines={1}>
            @{profile.username}
          </Text>
        </View>

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
      <Text style={styles.emptyBody}>No recipes yet — be the first to add one!</Text>
    </View>
  );

  const renderFollowingEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>Nothing yet</Text>
      <Text style={styles.emptyBody}>
        Follow friends or try a recipe to see activity here
      </Text>

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
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={COLORS.primaryContainer} />
      </View>
    );
  }

  /* ── Discover tab ── */
  if (activeTab === 'discover') {
    return (
      <View style={styles.screen}>
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
              tintColor={COLORS.primaryContainer}
            />
          }
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderDiscoverEmpty}
        />
      </View>
    );
  }

  /* ── Following tab ── */
  return (
    <View style={styles.screen}>
      <FlatList
        data={feedData as any[]}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <FeedCard item={item} />}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={onRefresh}
            tintColor={COLORS.primaryContainer}
          />
        }
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderFollowingEmpty}
      />
    </View>
  );
}

/* ── Styles ── */
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
