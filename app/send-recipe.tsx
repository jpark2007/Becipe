import { useState } from 'react';
import { View, Text, TextInput, FlatList, Pressable, Image, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';
import { colors, radius, shadow } from '@/lib/theme';
import { Ionicons } from '@expo/vector-icons';

export default function SendRecipeScreen() {
  const { recipeId, recipeTitle } = useLocalSearchParams<{ recipeId: string; recipeTitle: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const myId = useAuthStore((s) => s.session?.user?.id);

  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [note, setNote] = useState('');

  const { data: following = [] } = useQuery({
    queryKey: ['following-list', myId],
    queryFn: async () => {
      const { data } = await supabase
        .from('follows')
        .select('following:profiles!following_id(id, display_name, username, avatar_url)')
        .eq('follower_id', myId!);
      return (data ?? []).map((f: any) => f.following);
    },
    enabled: !!myId,
  });

  const filtered = following.filter((u: any) =>
    !search || u.display_name?.toLowerCase().includes(search.toLowerCase())
      || u.username?.toLowerCase().includes(search.toLowerCase())
  );

  const sendMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('recipe_shares').insert({
        sender_id: myId!,
        recipient_id: selectedId!,
        recipe_id: recipeId!,
        note: note.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inbox'] });
      router.back();
    },
    onError: (err: any) => {
      Alert.alert('Error', err.message ?? 'Could not send recipe');
    },
  });

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.cancel}>Cancel</Text>
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>Send "{recipeTitle}"</Text>
        <Pressable
          style={[styles.sendBtn, !selectedId && styles.sendDisabled]}
          disabled={!selectedId}
          onPress={() => sendMutation.mutate()}
        >
          <Text style={styles.sendText}>Send</Text>
        </Pressable>
      </View>

      <TextInput
        style={styles.search}
        placeholder="Search friends..."
        placeholderTextColor={colors.muted}
        value={search}
        onChangeText={setSearch}
      />

      <FlatList
        data={filtered}
        keyExtractor={(item: any) => item.id}
        style={{ maxHeight: 260 }}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        renderItem={({ item }: any) => (
          <Pressable
            style={[styles.userRow, selectedId === item.id && styles.userSelected]}
            onPress={() => setSelectedId(item.id)}
          >
            {item.avatar_url ? (
              <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarInit}>{(item.display_name ?? 'U').charAt(0).toUpperCase()}</Text>
              </View>
            )}
            <View>
              <Text style={styles.userName}>{item.display_name}</Text>
              <Text style={styles.userHandle}>@{item.username}</Text>
            </View>
            {selectedId === item.id && <Ionicons name="checkmark" size={18} color={colors.sage} />}
          </Pressable>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {following.length === 0 ? 'Follow people to share recipes with them' : 'No matches'}
          </Text>
        }
      />

      <View style={styles.noteSection}>
        <Text style={styles.noteLabel}>Add a note (optional)</Text>
        <TextInput
          style={styles.noteInput}
          placeholder="Try this tonight!"
          placeholderTextColor={colors.muted}
          value={note}
          onChangeText={(t) => setNote(t.slice(0, 200))}
          multiline
          maxLength={200}
        />
        <Text style={styles.charCount}>{note.length}/200</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bone },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  cancel: { fontFamily: 'Inter_500Medium', fontSize: 14, color: colors.muted },
  title: { fontFamily: 'Inter_700Bold', fontSize: 15, color: colors.ink, flex: 1, textAlign: 'center', marginHorizontal: 8 },
  sendBtn: { backgroundColor: colors.sage, paddingHorizontal: 16, paddingVertical: 8, borderRadius: radius.pill },
  sendDisabled: { opacity: 0.4 },
  sendText: { fontFamily: 'Inter_700Bold', fontSize: 13, color: '#fff' },
  search: {
    margin: 16,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: 12,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: colors.ink,
    borderWidth: 1,
    borderColor: colors.border,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  userSelected: { backgroundColor: colors.sageSoft, marginHorizontal: -8, paddingHorizontal: 8, borderRadius: radius.sm },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  avatarFallback: { backgroundColor: colors.sageSoft, alignItems: 'center', justifyContent: 'center' },
  avatarInit: { fontFamily: 'Inter_700Bold', fontSize: 15, color: colors.sage },
  userName: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.ink },
  userHandle: { fontFamily: 'Inter_400Regular', fontSize: 11, color: colors.muted },
  check: { marginLeft: 'auto', fontSize: 18, color: colors.sage },
  emptyText: { fontFamily: 'Inter_400Regular', fontSize: 13, color: colors.muted, textAlign: 'center', marginTop: 20 },
  noteSection: { padding: 16, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  noteLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: colors.inkSoft, marginBottom: 8 },
  noteInput: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: 12,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: colors.ink,
    minHeight: 60,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: colors.border,
  },
  charCount: { fontFamily: 'Inter_400Regular', fontSize: 10, color: colors.muted, textAlign: 'right', marginTop: 4 },
});
