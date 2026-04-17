// app/friends.tsx
// Standalone Friends page (followers / following / blocked).
// Pushed from profile.tsx rather than inlined, so the list can scale
// and the You tab stays clean.
import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';
import { colors, radius } from '@/lib/theme';
import { initialsFor, colorForUserId } from '@/lib/avatar';

type FriendsTab = 'followers' | 'following' | 'blocked';

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

export default function FriendsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: string }>();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const initialTab: FriendsTab =
    params.tab === 'followers' || params.tab === 'blocked' ? params.tab : 'following';
  const [tab, setTab] = useState<FriendsTab>(initialTab);

  const { data: followers, isLoading: loadingFollowers } = useQuery({
    queryKey: ['friends-followers', user?.id],
    queryFn: () => fetchFollowers(user!.id),
    enabled: !!user,
  });

  const { data: followingList, isLoading: loadingFollowing } = useQuery({
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

  const rows =
    tab === 'followers'
      ? followers ?? []
      : tab === 'following'
      ? followingList ?? []
      : [];

  const emptyCopy =
    tab === 'followers'
      ? 'No followers yet.'
      : tab === 'following'
      ? "You're not following anyone yet."
      : 'No one is blocked.';

  const loading =
    (tab === 'followers' && loadingFollowers) ||
    (tab === 'following' && loadingFollowing);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.head}>
        <Pressable style={styles.iconBtn} onPress={() => router.back()} hitSlop={10}>
          <Text style={styles.iconText}>←</Text>
        </Pressable>
        <Text style={styles.title}>Friends</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.tabs}>
        {(['followers', 'following', 'blocked'] as FriendsTab[]).map((t) => {
          const active = tab === t;
          return (
            <Pressable
              key={t}
              onPress={() => setTab(t)}
              style={[styles.pill, active ? styles.pillActive : styles.pillInactive]}
            >
              <Text
                style={[
                  styles.pillText,
                  active ? styles.pillTextActive : styles.pillTextInactive,
                ]}
              >
                {t}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 80 }}
      >
        {loading ? (
          <ActivityIndicator color={colors.sage} style={{ marginTop: 40 }} />
        ) : rows.length === 0 ? (
          <Text style={styles.empty}>{emptyCopy}</Text>
        ) : (
          rows.map((p: any) => {
            const label = p.display_name ?? p.username ?? 'unknown';
            return (
              <Pressable
                key={p.id}
                style={styles.row}
                onPress={() => router.push(`/user/${p.id}` as any)}
              >
                <View style={[styles.av, { backgroundColor: colorForUserId(p.id) }]}>
                  <Text style={styles.avText}>{initialsFor(label)}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.name}>{label}</Text>
                  {p.username && <Text style={styles.handle}>@{p.username}</Text>}
                </View>
                <Pressable
                  style={styles.action}
                  onPress={(e) => {
                    e.stopPropagation?.();
                    if (tab === 'followers') removeFollower.mutate(p.id);
                    else if (tab === 'following') unfollow.mutate(p.id);
                  }}
                >
                  <Text style={styles.actionText}>
                    {tab === 'followers'
                      ? 'Remove'
                      : tab === 'following'
                      ? 'Unfollow'
                      : 'Unblock'}
                  </Text>
                </Pressable>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bone },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: 12,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: colors.ink,
  },
  title: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 20,
    color: colors.ink,
    letterSpacing: -0.4,
  },
  tabs: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 22,
    marginBottom: 14,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
  },
  pillActive: { backgroundColor: colors.ink },
  pillInactive: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    letterSpacing: -0.1,
    textTransform: 'capitalize',
  },
  pillTextActive: { color: '#fff' },
  pillTextInactive: { color: colors.inkSoft },
  empty: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: colors.muted,
    marginTop: 40,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 8,
  },
  av: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avText: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 14,
    color: '#F5E9D3',
  },
  name: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    color: colors.ink,
  },
  handle: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  action: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.borderSoft,
  },
  actionText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    color: colors.inkSoft,
  },
});
