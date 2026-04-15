// app/(tabs)/profile.tsx
// You — identity + relationships + settings.
// Stack order: header → stats → palate → circles → friends row → sign out.
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';
import { CircleCard } from '@/components/CircleCard';
import { colors, radius, shadow } from '@/lib/theme';
import { parsePalate, PALATE_AXES } from '@/lib/palate';
import { initialsFor, colorForUserId } from '@/lib/avatar';
import { getStubCircles } from '@/lib/circles-stub';

async function fetchProfile(userId: string) {
  const [profileRes, followersRes, followingRes, triesRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).single(),
    supabase.from('follows').select('id:follower_id').eq('following_id', userId),
    supabase.from('follows').select('id:following_id').eq('follower_id', userId),
    supabase.from('recipe_tries').select('id').eq('user_id', userId),
  ]);

  return {
    profile: profileRes.data,
    followerCount: followersRes.data?.length ?? 0,
    followingCount: followingRes.data?.length ?? 0,
    tryCount: triesRes.data?.length ?? 0,
  };
}

const AXIS_LABELS: Record<string, string> = {
  sweet: 'Sweet',
  spicy: 'Spicy',
  savory: 'Savory',
  sour: 'Sour',
  bitter: 'Bitter',
};

export default function ProfileScreen() {
  const router = useRouter();
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

  const { followerCount, followingCount, tryCount } = data;
  const profile = data.profile as any;
  const displayName: string = profile?.display_name ?? 'You';
  const username: string = profile?.username ?? '';
  const avInitials = initialsFor(displayName);
  const avColor = colorForUserId(profile?.id ?? '');

  const circles = getStubCircles();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 22, paddingTop: 14 }}
      >
        {/* Header */}
        <View style={styles.userRow}>
          <View style={[styles.av, { backgroundColor: avColor }]}>
            <Text style={styles.avText}>{avInitials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.displayName} numberOfLines={1}>{displayName}</Text>
            {username ? <Text style={styles.handle}>@{username}</Text> : null}
          </View>
          <Pressable style={styles.editBtn} onPress={() => {}}>
            <Text style={styles.editBtnText}>edit</Text>
          </Pressable>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statCol}>
            <Text style={styles.statNum}>{tryCount}</Text>
            <Text style={styles.statLabel}>TRIES</Text>
          </View>
          <Pressable
            style={styles.statCol}
            onPress={() => router.push('/friends?tab=followers' as any)}
          >
            <Text style={styles.statNum}>{followerCount}</Text>
            <Text style={styles.statLabel}>FOLLOWERS</Text>
          </Pressable>
          <Pressable
            style={styles.statCol}
            onPress={() => router.push('/friends?tab=following' as any)}
          >
            <Text style={styles.statNum}>{followingCount}</Text>
            <Text style={styles.statLabel}>FOLLOWING</Text>
          </Pressable>
        </View>

        {/* Palate card */}
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
          <Pressable
            onPress={() => router.push('/palate-editor' as any)}
            hitSlop={6}
          >
            <Text style={styles.palateEdit}>edit your palate →</Text>
          </Pressable>
        </View>

        {/* Your Circles */}
        <Text style={styles.sectionTitle}>Your Circles</Text>
        {circles.length === 0 ? (
          <Text style={styles.empty}>You're not in any circles yet.</Text>
        ) : (
          circles.map((c) => (
            <CircleCard
              key={c.id}
              circle={c}
              variant="bar"
              onPress={() => router.push(`/circle/${c.id}` as any)}
            />
          ))
        )}

        {/* Friends row — tap to open standalone /friends page */}
        <Pressable
          style={styles.friendsLinkRow}
          onPress={() => router.push('/friends' as any)}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.friendsLinkTitle}>Friends</Text>
            <Text style={styles.friendsLinkSub}>
              {followerCount} followers · {followingCount} following
            </Text>
          </View>
          <Text style={styles.friendsLinkChevron}>›</Text>
        </Pressable>

        {/* Sign out */}
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
      </ScrollView>
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
    fontSize: 22,
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
  editBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  editBtnText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
    color: colors.inkSoft,
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
    borderRadius: radius.lg,
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
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 15,
    color: colors.ink,
    letterSpacing: -0.2,
    marginBottom: 14,
  },
  empty: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: colors.muted,
    marginBottom: 12,
  },
  friendsLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 20,
    minHeight: 50,
  },
  friendsLinkTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    color: colors.ink,
    letterSpacing: -0.2,
  },
  friendsLinkSub: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },
  friendsLinkChevron: {
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
    color: colors.muted,
    marginLeft: 12,
    lineHeight: 24,
  },

  signOutBtn: {
    marginTop: 30,
    backgroundColor: '#F1F1EC',
    borderRadius: radius.pill,
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
