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

/* ── Design tokens ── */
const CREAM = '#F8F4EE';
const CHARCOAL = '#1C1712';
const TERRA = '#C4622D';
const MUTED = '#A09590';
const BORDER = '#D5CCC0';
const CARD = '#EEE8DF';

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
    <View style={styles.headerContainer}>
      <Text style={styles.title}>Dishr</Text>

      {/* Tab toggle */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={styles.tabButton}
          onPress={() => setActiveTab('discover')}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.tabLabel,
              activeTab === 'discover' && styles.tabLabelActive,
            ]}
          >
            DISCOVER
          </Text>
          {activeTab === 'discover' && <View style={styles.tabUnderline} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabButton}
          onPress={() => setActiveTab('following')}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.tabLabel,
              activeTab === 'following' && styles.tabLabelActive,
            ]}
          >
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={TERRA} />
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
              tintColor={TERRA}
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
            tintColor={TERRA}
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
    backgroundColor: CREAM,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: CREAM,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: 16,
  },
  cardPadding: {
    marginBottom: 4,
  },

  /* Header */
  headerContainer: {
    marginBottom: 20,
  },
  title: {
    fontFamily: 'CormorantGaramond_600SemiBold',
    fontSize: 38,
    color: CHARCOAL,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 16,
  },
  tabButton: {
    paddingBottom: 8,
    position: 'relative',
  },
  tabLabel: {
    fontFamily: 'DMMono_400Regular',
    fontSize: 11,
    letterSpacing: 1.5,
    color: MUTED,
  },
  tabLabelActive: {
    color: CHARCOAL,
  },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: TERRA,
  },
  headerDivider: {
    height: 1,
    backgroundColor: BORDER,
    marginTop: 0,
  },

  /* Empty states */
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontFamily: 'CormorantGaramond_600SemiBold',
    fontSize: 32,
    color: '#B5ADA8',
    marginBottom: 12,
  },
  emptyBody: {
    fontFamily: 'Lora_400Regular',
    fontSize: 14,
    color: MUTED,
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
    fontFamily: 'DMMono_400Regular',
    fontSize: 10,
    color: MUTED,
    letterSpacing: 2,
    marginBottom: 16,
    textAlign: 'center',
  },
  suggestedUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
  },
  suggestedAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: TERRA,
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
    fontFamily: 'DMMono_400Regular',
    fontSize: 16,
    color: '#EDE8DC',
  },
  suggestedUserInfo: {
    flex: 1,
    marginRight: 12,
  },
  suggestedDisplayName: {
    fontFamily: 'DMMono_500Medium',
    fontSize: 13,
    color: CHARCOAL,
  },
  suggestedUsername: {
    fontFamily: 'DMMono_400Regular',
    fontSize: 11,
    color: MUTED,
    marginTop: 2,
  },
  followButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: TERRA,
  },
  followButtonText: {
    fontFamily: 'DMMono_400Regular',
    fontSize: 11,
    letterSpacing: 1,
    color: '#EDE8DC',
    textTransform: 'uppercase',
  },
});
