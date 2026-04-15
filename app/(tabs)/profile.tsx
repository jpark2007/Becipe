import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  Alert,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';
import { RecipeCard } from '@/components/RecipeCard';
import { EditorialHeading } from '@/components/EditorialHeading';
import { colors, shadow } from '@/lib/theme';
import { parsePalate, PALATE_AXES } from '@/lib/palate';

const AV_COLORS = [colors.avJ, colors.avE, colors.avS, colors.avM, colors.avD];

function colorForUser(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return AV_COLORS[Math.abs(hash) % AV_COLORS.length];
}

async function fetchProfile(userId: string) {
  const [profileRes, recipesRes, followersRes, followingRes, triesRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).single(),
    supabase
      .from('recipes')
      .select('*, tries:recipe_tries(rating)')
      .eq('created_by', userId)
      .order('created_at', { ascending: false }),
    supabase.from('follows').select('id:follower_id').eq('following_id', userId),
    supabase.from('follows').select('id:following_id').eq('follower_id', userId),
    supabase.from('recipe_tries').select('id').eq('user_id', userId),
  ]);

  const recipes = (recipesRes.data ?? []).map((r: any) => {
    const ratings = (r.tries ?? []).map((t: any) => t.rating).filter(Boolean);
    return {
      ...r,
      avg_rating: ratings.length
        ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length
        : null,
      try_count: ratings.length,
    };
  });

  return {
    profile: profileRes.data,
    recipes,
    followerCount: followersRes.data?.length ?? 0,
    followingCount: followingRes.data?.length ?? 0,
    tryCount: triesRes.data?.length ?? 0,
  };
}

const AXIS_LABELS: Record<string, string> = {
  salt: 'Salt',
  sweet: 'Sweet',
  umami: 'Umami',
  spice: 'Spice',
  acid: 'Acid',
};

export default function ProfileScreen() {
  const { user, setSession } = useAuthStore();
  const storedPalate = useAuthStore((s) => s.profile?.palate_vector);
  const palate = parsePalate(storedPalate);

  const { data, isLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: () => fetchProfile(user!.id),
    enabled: !!user,
  });

  async function handleSignOut() {
    await supabase.auth.signOut();
    setSession(null);
  }

  if (isLoading || !data) {
    return (
      <SafeAreaView style={styles.loading}>
        <ActivityIndicator color={colors.sage} />
      </SafeAreaView>
    );
  }

  const { recipes, followerCount, followingCount, tryCount } = data;
  const profile = data.profile as any;
  const displayName: string = profile?.display_name ?? 'You';
  const username: string = profile?.username ?? '';
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
          <View>
            <View style={{ paddingHorizontal: 22, paddingTop: 14 }}>
              <EditorialHeading size={30} emphasis="kitchen" emphasisColor="sage">
                {'Your\n'}
              </EditorialHeading>

              {/* Avatar + name row */}
              <View style={styles.userRow}>
                <View style={[styles.av, { backgroundColor: avColor }]}>
                  <Text style={styles.avText}>{initial}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.displayName} numberOfLines={1}>
                    {displayName}
                  </Text>
                  {username ? (
                    <Text style={styles.handle}>@{username}</Text>
                  ) : null}
                </View>
              </View>

              {/* Stats row */}
              <View style={styles.statsRow}>
                <View style={styles.statCol}>
                  <Text style={styles.statNum}>{tryCount}</Text>
                  <Text style={styles.statLabel}>TRIES</Text>
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

              {/* Palate vector readout */}
              <View style={styles.palateCard}>
                <Text style={styles.palateHeader}>YOUR PALATE</Text>
                {PALATE_AXES.map((axis) => {
                  const value = palate ? palate[axis] : 0;
                  return (
                    <View key={axis} style={styles.palateRow}>
                      <Text style={styles.palateLabel}>{AXIS_LABELS[axis]}</Text>
                      <View style={styles.palateTrack}>
                        <View
                          style={[
                            styles.palateFill,
                            { width: `${Math.max(0, Math.min(100, value))}%` },
                          ]}
                        />
                      </View>
                    </View>
                  );
                })}
                <Pressable onPress={() => {}} hitSlop={6}>
                  <Text style={styles.palateEdit}>edit your palate →</Text>
                </Pressable>
              </View>

              {/* Recipes section header */}
              <Text style={styles.sectionTitle}>Your recipes</Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyTitle}>No recipes yet</Text>
            <Text style={styles.emptySub}>
              Tap the + tab to add your first recipe
            </Text>
          </View>
        }
        ListFooterComponent={
          <View style={{ paddingHorizontal: 22, paddingTop: 20 }}>
            <Pressable
              style={styles.signOutBtn}
              onPress={() =>
                Alert.alert('Sign out', 'Are you sure?', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Sign Out', style: 'destructive', onPress: handleSignOut },
                ])
              }
            >
              <Text style={styles.signOutText}>sign out</Text>
            </Pressable>
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
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 8,
    marginBottom: 22,
  },
  av: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.cta,
  },
  avText: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 26,
    color: '#F5E9D3',
    letterSpacing: -0.5,
  },
  displayName: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 20,
    color: colors.ink,
    letterSpacing: -0.5,
  },
  handle: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 28,
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
  palateCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    padding: 18,
    marginBottom: 24,
  },
  palateHeader: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    color: colors.muted,
    letterSpacing: 1.2,
    marginBottom: 14,
  },
  palateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  palateLabel: {
    width: 60,
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
    color: colors.ink,
    letterSpacing: -0.2,
  },
  palateTrack: {
    flex: 1,
    height: 8,
    backgroundColor: colors.sageSoft,
    borderRadius: 4,
    overflow: 'hidden',
  },
  palateFill: {
    height: '100%',
    backgroundColor: colors.sage,
    borderRadius: 4,
  },
  palateEdit: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: colors.sage,
    marginTop: 6,
  },
  sectionTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    color: colors.ink,
    letterSpacing: -0.2,
    marginBottom: 14,
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 18,
    color: colors.ink,
    marginBottom: 6,
    letterSpacing: -0.4,
  },
  emptySub: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 18,
  },
  signOutBtn: {
    backgroundColor: '#F1F1EC',
    borderRadius: 999,
    paddingVertical: 15,
    alignItems: 'center',
  },
  signOutText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
    color: colors.inkSoft,
    letterSpacing: -0.1,
  },
});
