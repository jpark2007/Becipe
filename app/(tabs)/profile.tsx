// app/(tabs)/profile.tsx
// You — identity + relationships + settings.
// Stack order: header → stats → palate → friends row → sign out.
import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';
import { colors, radius, shadow } from '@/lib/theme';
import { parsePalate, PALATE_AXES } from '@/lib/palate';
import { initialsFor, colorForUserId } from '@/lib/avatar';
import { InboxIcon } from '@/components/InboxIcon';

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
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const storedPalate = useAuthStore((s) => s.profile?.palate_vector);
  const palate = parsePalate(storedPalate);

  const [editVisible, setEditVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: () => fetchProfile(user!.id),
    enabled: !!user,
  });

  async function handleSaveProfile() {
    if (!user) return;
    setEditSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: editName.trim() || null,
        username: editUsername.trim() || null,
        bio: editBio.trim() || null,
      })
      .eq('id', user.id);
    setEditSaving(false);
    if (error) {
      Alert.alert('Error', 'Could not update profile.');
      return;
    }
    setEditVisible(false);
    queryClient.invalidateQueries({ queryKey: ['profile', user.id] });
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
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <InboxIcon />
            <Pressable style={styles.editBtn} onPress={() => {
              setEditName(displayName === 'You' ? '' : displayName);
              setEditUsername(username);
              setEditBio(profile?.bio ?? '');
              setEditVisible(true);
            }}>
              <Text style={styles.editBtnText}>edit</Text>
            </Pressable>
          </View>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <Pressable
            style={styles.statCol}
            onPress={() => router.push('/my-tries' as any)}
          >
            <Text style={styles.statNum}>{tryCount}</Text>
            <Text style={[styles.statLabel, { color: colors.sage }]}>TRIES</Text>
          </Pressable>
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

        {/* Tries archive */}
        <Pressable
          style={styles.friendsLinkRow}
          onPress={() => router.push('/my-tries' as any)}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.friendsLinkTitle}>My Tries</Text>
            <Text style={styles.friendsLinkSub}>
              {tryCount} cook{tryCount !== 1 ? 's' : ''} logged
            </Text>
          </View>
          <Text style={styles.friendsLinkChevron}>›</Text>
        </Pressable>

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

        {/* Settings */}
        <Pressable
          style={styles.friendsLinkRow}
          onPress={() => router.push('/settings' as any)}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.friendsLinkTitle}>Settings</Text>
            <Text style={styles.friendsLinkSub}>Units, notifications, account</Text>
          </View>
          <Text style={styles.friendsLinkChevron}>›</Text>
        </Pressable>
      </ScrollView>

      {/* Edit profile modal */}
      <Modal visible={editVisible} transparent animationType="fade" onRequestClose={() => setEditVisible(false)}>
        <Pressable style={editStyles.overlay} onPress={() => setEditVisible(false)}>
          <Pressable style={editStyles.sheet} onPress={(e) => e.stopPropagation()}>
            <Text style={editStyles.title}>Edit profile</Text>
            <TextInput style={editStyles.input} placeholder="Display name" placeholderTextColor={colors.muted} value={editName} onChangeText={setEditName} />
            <TextInput style={editStyles.input} placeholder="Username" placeholderTextColor={colors.muted} value={editUsername} onChangeText={setEditUsername} autoCapitalize="none" />
            <TextInput style={[editStyles.input, { height: 80, textAlignVertical: 'top', paddingTop: 12 }]} placeholder="Bio" placeholderTextColor={colors.muted} value={editBio} onChangeText={setEditBio} multiline numberOfLines={3} />
            <Pressable style={[editStyles.saveBtn, editSaving && { opacity: 0.5 }]} onPress={handleSaveProfile} disabled={editSaving}>
              <Text style={editStyles.saveBtnText}>{editSaving ? 'Saving…' : 'Save'}</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
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
  friendsLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginTop: 18,
    height: 52,
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
    marginTop: 1,
  },
  friendsLinkChevron: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    color: colors.muted,
    marginLeft: 12,
    lineHeight: 22,
  },

});

const editStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlayScrim,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  sheet: {
    width: '100%',
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: 24,
    gap: 14,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 17,
    color: colors.ink,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    color: colors.ink,
    backgroundColor: colors.bg,
  },
  saveBtn: {
    backgroundColor: colors.sage,
    borderRadius: radius.pill,
    paddingVertical: 13,
    alignItems: 'center',
  },
  saveBtnText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    color: colors.card,
  },
});
