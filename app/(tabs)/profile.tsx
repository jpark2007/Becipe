// app/(tabs)/profile.tsx
// You — identity + relationships + settings.
// Stack order: header → stats → palate → circles → friends → sign out.
import { useRef, useState } from 'react';
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
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';
import { EditorialHeading } from '@/components/EditorialHeading';
import { CircleCard } from '@/components/CircleCard';
import { colors, radius, shadow } from '@/lib/theme';
import { parsePalate, PALATE_AXES } from '@/lib/palate';
import { initialsFor, colorForUserId } from '@/lib/avatar';
import { getStubCircles } from '@/lib/circles-stub';

type FriendsTab = 'followers' | 'following' | 'blocked';

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

async function fetchFollowers(userId: string) {
  const { data } = await supabase
    .from('follows')
    .select('follower:profiles!follower_id(id, display_name, username, avatar_url)')
    .eq('following_id', userId);
  return (data ?? [])
    .map((row: any) => row.follower)
    .filter((p: any) => !!p?.id);
}

async function fetchFollowing(userId: string) {
  const { data } = await supabase
    .from('follows')
    .select('following:profiles!following_id(id, display_name, username, avatar_url)')
    .eq('follower_id', userId);
  return (data ?? [])
    .map((row: any) => row.following)
    .filter((p: any) => !!p?.id);
}

const AXIS_LABELS: Record<string, string> = {
  salt: 'Salt',
  sweet: 'Sweet',
  umami: 'Umami',
  spice: 'Spice',
  acid: 'Acid',
};

export default function ProfileScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, setSession } = useAuthStore();
  const storedPalate = useAuthStore((s) => s.profile?.palate_vector);
  const palate = parsePalate(storedPalate);

  const friendsRef = useRef<View>(null);
  const scrollRef = useRef<ScrollView>(null);
  const [friendsTab, setFriendsTab] = useState<FriendsTab>('following');

  const { data, isLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: () => fetchProfile(user!.id),
    enabled: !!user,
  });

  const { data: followers } = useQuery({
    queryKey: ['friends-followers', user?.id],
    queryFn: () => fetchFollowers(user!.id),
    enabled: !!user,
  });

  const { data: followingList } = useQuery({
    queryKey: ['friends-following', user?.id],
    queryFn: () => fetchFollowing(user!.id),
    enabled: !!user,
  });

  const removeFollower = useMutation({
    mutationFn: async (followerId: string) => {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', followerId)
        .eq('following_id', user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends-followers', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
    },
  });

  const unfollow = useMutation({
    mutationFn: async (targetId: string) => {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user!.id)
        .eq('following_id', targetId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends-following', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
    },
  });

  async function handleSignOut() {
    await supabase.auth.signOut();
    setSession(null);
  }

  function scrollToFriends() {
    // Reasonable fallback: scroll to bottom.
    scrollRef.current?.scrollToEnd({ animated: true });
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

  const friendsRows =
    friendsTab === 'followers'
      ? followers ?? []
      : friendsTab === 'following'
      ? followingList ?? []
      : [];

  const emptyFriendsCopy =
    friendsTab === 'followers'
      ? 'No followers yet.'
      : friendsTab === 'following'
      ? "You're not following anyone yet."
      : 'No one is blocked.';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        ref={scrollRef}
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
            onPress={() => {
              setFriendsTab('followers');
              scrollToFriends();
            }}
          >
            <Text style={styles.statNum}>{followerCount}</Text>
            <Text style={styles.statLabel}>FOLLOWERS</Text>
          </Pressable>
          <Pressable
            style={styles.statCol}
            onPress={() => {
              setFriendsTab('following');
              scrollToFriends();
            }}
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
            onPress={() => router.push('/(onboarding)/palate-quiz' as any)}
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

        {/* Friends section */}
        <View ref={friendsRef}>
          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Friends</Text>

          <View style={styles.friendsTabs}>
            {(['followers', 'following', 'blocked'] as FriendsTab[]).map((t) => {
              const active = friendsTab === t;
              return (
                <Pressable
                  key={t}
                  onPress={() => setFriendsTab(t)}
                  style={[
                    styles.friendsPill,
                    active ? styles.friendsPillActive : styles.friendsPillInactive,
                  ]}
                >
                  <Text
                    style={[
                      styles.friendsPillText,
                      active ? styles.friendsPillTextActive : styles.friendsPillTextInactive,
                    ]}
                  >
                    {t}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {friendsRows.length === 0 ? (
            <Text style={styles.empty}>{emptyFriendsCopy}</Text>
          ) : (
            friendsRows.map((p: any) => {
              const label = p.display_name ?? p.username ?? 'unknown';
              return (
                <Pressable
                  key={p.id}
                  style={styles.friendRow}
                  onPress={() => router.push(`/user/${p.id}` as any)}
                >
                  <View style={[styles.friendAv, { backgroundColor: colorForUserId(p.id) }]}>
                    <Text style={styles.friendAvText}>{initialsFor(label)}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.friendName}>{label}</Text>
                    {p.username && <Text style={styles.friendHandle}>@{p.username}</Text>}
                  </View>
                  <Pressable
                    style={styles.friendAction}
                    onPress={(e) => {
                      e.stopPropagation?.();
                      if (friendsTab === 'followers') removeFollower.mutate(p.id);
                      else if (friendsTab === 'following') unfollow.mutate(p.id);
                      // blocked tab is a stub
                    }}
                  >
                    <Text style={styles.friendActionText}>
                      {friendsTab === 'followers'
                        ? 'Remove'
                        : friendsTab === 'following'
                        ? 'Unfollow'
                        : 'Unblock'}
                    </Text>
                  </Pressable>
                </Pressable>
              );
            })
          )}
        </View>

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
  friendsTabs: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
  },
  friendsPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
  },
  friendsPillActive: { backgroundColor: colors.ink },
  friendsPillInactive: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  friendsPillText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    letterSpacing: -0.1,
    textTransform: 'capitalize',
  },
  friendsPillTextActive: { color: '#fff' },
  friendsPillTextInactive: { color: colors.inkSoft },

  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 8,
  },
  friendAv: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  friendAvText: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 14,
    color: '#F5E9D3',
  },
  friendName: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    color: colors.ink,
  },
  friendHandle: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  friendAction: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.borderSoft,
  },
  friendActionText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    color: colors.inkSoft,
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
