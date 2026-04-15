import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';
import { RecipeCard } from '@/components/RecipeCard';
import { EditorialHeading } from '@/components/EditorialHeading';
import { colors, shadow } from '@/lib/theme';

const AV_COLORS = [colors.avJ, colors.avE, colors.avS, colors.avM, colors.avD];

function colorForUser(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return AV_COLORS[Math.abs(hash) % AV_COLORS.length];
}

async function fetchUserProfile(userId: string, currentUserId: string) {
  const [profileRes, recipesRes, followersRes, followingRes, isFollowingRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).single(),
    supabase
      .from('recipes')
      .select('*, tries:recipe_tries(rating)')
      .eq('created_by', userId)
      .eq('is_public', true)
      .order('created_at', { ascending: false }),
    supabase.from('follows').select('id:follower_id').eq('following_id', userId),
    supabase.from('follows').select('id:following_id').eq('follower_id', userId),
    supabase
      .from('follows')
      .select('follower_id')
      .eq('follower_id', currentUserId)
      .eq('following_id', userId)
      .maybeSingle(),
  ]);

  const recipes = (recipesRes.data ?? []).map((r: any) => {
    const ratings = (r.tries ?? []).map((t: any) => t.rating).filter(Boolean);
    return {
      ...r,
      avg_rating: ratings.length ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length : null,
      try_count: ratings.length,
    };
  });

  return {
    profile: profileRes.data,
    recipes,
    followerCount: followersRes.data?.length ?? 0,
    followingCount: followingRes.data?.length ?? 0,
    isFollowing: !!isFollowingRes.data,
  };
}

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['user-profile', id],
    queryFn: () => fetchUserProfile(id, user!.id),
    enabled: !!user,
  });

  const followMutation = useMutation({
    mutationFn: async () => {
      if (data?.isFollowing) {
        await supabase.from('follows').delete()
          .eq('follower_id', user!.id)
          .eq('following_id', id);
      } else {
        await (supabase.from('follows') as any).insert({ follower_id: user!.id, following_id: id });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile', id] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });

  if (isLoading || !data) {
    return (
      <SafeAreaView style={styles.loading}>
        <ActivityIndicator color={colors.sage} />
      </SafeAreaView>
    );
  }

  const profile = data.profile as any;
  const { recipes, followerCount, followingCount, isFollowing } = data;
  const isOwnProfile = user?.id === id;

  const displayName: string = profile?.display_name ?? 'Cook';
  const username: string = profile?.username ?? '';
  const bio: string | undefined = profile?.bio;
  const initial = displayName.charAt(0).toUpperCase();
  const avColor = profile?.id ? colorForUser(profile.id) : colors.avS;

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={recipes as any[]}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={{ paddingHorizontal: 22 }}>
            <RecipeCard recipe={item} variant="plate" />
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 60 }}
        ListHeaderComponent={
          <View style={{ paddingHorizontal: 22, paddingTop: 10 }}>
            {/* Head row */}
            <View style={styles.headRow}>
              <Pressable style={styles.iconBtn} onPress={() => router.back()}>
                <Text style={styles.iconBtnText}>←</Text>
              </Pressable>
              <Pressable style={styles.iconBtn}>
                <Text style={styles.iconBtnText}>⋯</Text>
              </Pressable>
            </View>

            {/* Avatar */}
            <View style={[styles.av, { backgroundColor: avColor }]}>
              <Text style={styles.avText}>{initial}</Text>
            </View>

            {/* Name */}
            <View style={{ marginTop: 14 }}>
              <EditorialHeading size={28}>{displayName}</EditorialHeading>
              {username ? <Text style={styles.handle}>@{username}</Text> : null}
            </View>

            {/* Bio */}
            {bio ? <Text style={styles.bio}>{bio}</Text> : null}

            {/* Follow / unfollow */}
            {!isOwnProfile && (
              <Pressable
                style={[styles.followBtn, isFollowing ? styles.followBtnFollowing : styles.followBtnFollow]}
                onPress={() => followMutation.mutate()}
                disabled={followMutation.isPending}
              >
                <Text style={isFollowing ? styles.followBtnTextFollowing : styles.followBtnTextFollow}>
                  {isFollowing ? 'following' : 'follow →'}
                </Text>
              </Pressable>
            )}

            {/* Stats row */}
            <View style={styles.statsRow}>
              <View style={styles.statCol}>
                <Text style={styles.statNum}>{recipes.length}</Text>
                <Text style={styles.statLabel}>RECIPES</Text>
              </View>
              <View style={styles.statCol}>
                <Text style={styles.statNum}>{followerCount}</Text>
                <Text style={styles.statLabel}>FOLLOWERS</Text>
              </View>
              <View style={styles.statCol}>
                <Text style={styles.statNum}>{followingCount}</Text>
                <Text style={styles.statLabel}>FOLLOWING</Text>
              </View>
            </View>

            {/* Section header */}
            <Text style={styles.sectionTitle}>Recipes</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyTitle}>No public recipes yet</Text>
            <Text style={styles.emptySub}>This cook hasn't shared a recipe.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bone },
  loading: {
    flex: 1,
    backgroundColor: colors.bone,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 12,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.cta,
  },
  iconBtnText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: colors.ink,
  },

  av: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    ...shadow.cta,
  },
  avText: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 26,
    color: '#F5E9D3',
    letterSpacing: -0.5,
  },

  handle: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: colors.muted,
    marginTop: 4,
  },
  bio: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: colors.inkSoft,
    lineHeight: 20,
    marginTop: 10,
    marginBottom: 4,
  },

  followBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 999,
    marginTop: 16,
  },
  followBtnFollow: { backgroundColor: colors.sage, ...shadow.cta },
  followBtnFollowing: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  followBtnTextFollow: { fontFamily: 'Inter_700Bold', fontSize: 13, color: '#fff' },
  followBtnTextFollowing: { fontFamily: 'Inter_700Bold', fontSize: 13, color: colors.inkSoft },

  statsRow: {
    flexDirection: 'row',
    gap: 28,
    marginTop: 24,
    marginBottom: 22,
  },
  statCol: { alignItems: 'flex-start' },
  statNum: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 24,
    color: colors.ink,
    letterSpacing: -0.8,
  },
  statLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    color: colors.muted,
    letterSpacing: 1.2,
    marginTop: 2,
  },

  sectionTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    color: colors.ink,
    letterSpacing: -0.2,
    marginTop: 6,
    marginBottom: 14,
  },

  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 22,
  },
  emptyTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    color: colors.inkSoft,
    marginBottom: 4,
  },
  emptySub: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: colors.muted,
    textAlign: 'center',
  },
});
