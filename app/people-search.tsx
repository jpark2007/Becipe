// app/people-search.tsx
// Lightweight modal for searching profiles by display name or username.
import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';
import { colors, radius, shadow } from '@/lib/theme';
import { initialsFor, colorForUserId } from '@/lib/avatar';

type Profile = {
  id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
};

async function searchProfiles(term: string, excludeUserId: string): Promise<Profile[]> {
  const t = term.trim();
  let query = supabase
    .from('profiles')
    .select('id, display_name, username, avatar_url')
    .neq('id', excludeUserId)
    .limit(20);
  if (t) {
    const like = `%${t}%`;
    query = query.or(`display_name.ilike.${like},username.ilike.${like}`);
  } else {
    query = query.order('created_at', { ascending: false });
  }
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Profile[];
}

async function fetchFollowingSet(userId: string) {
  const { data, error } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', userId);
  if (error) throw error;
  return new Set((data ?? []).map((f: any) => f.following_id as string));
}

export default function PeopleSearchScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [term, setTerm] = useState('');

  const { data: profiles, isFetching } = useQuery({
    queryKey: ['people-search', term],
    queryFn: () => searchProfiles(term, user!.id),
    enabled: !!user,
  });

  const { data: followingSet } = useQuery({
    queryKey: ['following-set', user?.id],
    queryFn: () => fetchFollowingSet(user!.id),
    enabled: !!user,
  });

  const followMutation = useMutation({
    mutationFn: async (targetId: string) => {
      const { error } = await (supabase.from('follows') as any).insert({
        follower_id: user!.id,
        following_id: targetId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['following-set', user?.id] });
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: async (targetId: string) => {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user!.id)
        .eq('following_id', targetId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['following-set', user?.id] });
    },
  });

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.head}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Find cooks</Text>
        </View>
        <Pressable style={styles.closeBtn} onPress={() => router.back()}>
          <Text style={styles.closeText}>×</Text>
        </Pressable>
      </View>

      <View style={styles.searchBar}>
        <Text style={styles.searchGlyph}>⌕</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or @username"
          placeholderTextColor={colors.muted}
          value={term}
          onChangeText={setTerm}
          autoFocus
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        {isFetching && (profiles ?? []).length === 0 && (
          <ActivityIndicator color={colors.sage} style={{ marginTop: 24 }} />
        )}
        {(profiles ?? []).map((p) => {
          const isFollowing = followingSet?.has(p.id) ?? false;
          return (
            <Pressable
              key={p.id}
              style={styles.row}
              onPress={() => router.push(`/user/${p.id}` as any)}
            >
              <View style={[styles.avatar, { backgroundColor: colorForUserId(p.id) }]}>
                <Text style={styles.avatarText}>{initialsFor(p.display_name ?? p.username)}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.rowName}>{p.display_name ?? p.username ?? 'unknown'}</Text>
                {p.username ? <Text style={styles.rowHandle}>@{p.username}</Text> : null}
              </View>
              <Pressable
                onPress={(e) => {
                  e.stopPropagation?.();
                  if (isFollowing) unfollowMutation.mutate(p.id);
                  else followMutation.mutate(p.id);
                }}
                style={[
                  styles.followBtn,
                  isFollowing ? styles.followBtnFollowing : styles.followBtnFollow,
                ]}
              >
                <Text
                  style={isFollowing ? styles.followBtnTextFollowing : styles.followBtnTextFollow}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </Text>
              </Pressable>
            </Pressable>
          );
        })}
        {!isFetching && (profiles ?? []).length === 0 && (
          <Text style={styles.empty}>No cooks found.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bone, paddingHorizontal: 22, paddingTop: 8 },
  head: { flexDirection: 'row', alignItems: 'center', paddingTop: 4, paddingBottom: 10 },
  title: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 20,
    color: colors.ink,
    letterSpacing: -0.4,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
    color: colors.muted,
    lineHeight: 24,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    marginBottom: 14,
    ...shadow.card,
  },
  searchGlyph: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: colors.muted,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    color: colors.ink,
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
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
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 14,
    color: '#F5E9D3',
    letterSpacing: -0.2,
  },
  rowName: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    color: colors.ink,
  },
  rowHandle: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  followBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
  },
  followBtnFollow: { backgroundColor: colors.sage, ...shadow.cta },
  followBtnFollowing: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  followBtnTextFollow: { fontFamily: 'Inter_700Bold', fontSize: 12, color: '#fff' },
  followBtnTextFollowing: { fontFamily: 'Inter_700Bold', fontSize: 12, color: colors.inkSoft },
  empty: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
    marginTop: 32,
  },
});
