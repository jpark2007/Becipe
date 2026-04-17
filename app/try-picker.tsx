// app/try-picker.tsx
// Log-a-try recipe picker. Sections:
//   - From your Queue (horizontal scroll)
//   - Recently cooked (vertical list, deduped)
//   - Search input at bottom (as-you-type filter)
// Tapping any result -> /try/[id]
import { useMemo, useState } from 'react';
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
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';
import { colors, radius, shadow } from '@/lib/theme';

type PickerRecipe = {
  id: string;
  title: string;
  cuisine?: string | null;
};

async function fetchQueue(userId: string): Promise<PickerRecipe[]> {
  const { data, error } = await supabase
    .from('saved_recipes')
    .select('recipe:recipes(id, title, cuisine)')
    .eq('user_id', userId);
  if (error) throw error;
  return (data ?? [])
    .map((row: any) => row.recipe)
    .filter((r: any): r is PickerRecipe => !!r?.id);
}

async function fetchRecentlyCooked(userId: string): Promise<PickerRecipe[]> {
  const { data, error } = await supabase
    .from('recipe_tries')
    .select('tried_at, recipe:recipes(id, title, cuisine)')
    .eq('user_id', userId)
    .order('tried_at', { ascending: false })
    .limit(20);
  if (error) throw error;
  const seen = new Set<string>();
  const result: PickerRecipe[] = [];
  for (const row of (data ?? []) as any[]) {
    const r = row.recipe;
    if (!r?.id || seen.has(r.id)) continue;
    seen.add(r.id);
    result.push(r);
    if (result.length >= 10) break;
  }
  return result;
}

async function searchRecipes(term: string): Promise<PickerRecipe[]> {
  const t = term.trim();
  if (!t) return [];
  const { data, error } = await supabase
    .from('recipes')
    .select('id, title, cuisine')
    .ilike('title', `%${t}%`)
    .limit(20);
  if (error) throw error;
  return (data ?? []) as PickerRecipe[];
}

export default function TryPickerScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [searchText, setSearchText] = useState('');

  const { data: queue } = useQuery({
    queryKey: ['try-picker-queue', user?.id],
    queryFn: () => fetchQueue(user!.id),
    enabled: !!user,
  });

  const { data: recent } = useQuery({
    queryKey: ['try-picker-recent', user?.id],
    queryFn: () => fetchRecentlyCooked(user!.id),
    enabled: !!user,
  });

  const { data: searchResults, isFetching: searching } = useQuery({
    queryKey: ['try-picker-search', searchText],
    queryFn: () => searchRecipes(searchText),
    enabled: searchText.trim().length > 0,
  });

  const showSearch = searchText.trim().length > 0;

  const goTo = (id: string) => router.replace(`/try/${id}` as any);

  const QueueCard = ({ r }: { r: PickerRecipe }) => (
    <Pressable style={styles.queueCard} onPress={() => goTo(r.id)}>
      <Text style={styles.queueTitle} numberOfLines={2}>{r.title}</Text>
      {r.cuisine ? <Text style={styles.queueCuisine}>{r.cuisine}</Text> : null}
    </Pressable>
  );

  const RowItem = ({ r }: { r: PickerRecipe }) => (
    <Pressable style={styles.row} onPress={() => goTo(r.id)}>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle} numberOfLines={1}>{r.title}</Text>
        {r.cuisine ? <Text style={styles.rowMeta}>{r.cuisine}</Text> : null}
      </View>
      <Text style={styles.chev}>›</Text>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.head}>
        <Pressable style={styles.iconBtn} onPress={() => router.back()}>
          <Text style={styles.iconBtnText}>←</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} keyboardShouldPersistTaps="handled">
        <Text style={styles.h1}>What did you cook?</Text>
        <Text style={styles.subtitle}>Pick a recipe to log your try.</Text>

        {showSearch ? (
          <View style={{ marginTop: 18 }}>
            {searching && <ActivityIndicator color={colors.sage} style={{ marginTop: 16 }} />}
            {(searchResults ?? []).map((r) => (
              <RowItem key={r.id} r={r} />
            ))}
            {!searching && (searchResults ?? []).length === 0 && (
              <Text style={styles.empty}>No recipes found for "{searchText}"</Text>
            )}
          </View>
        ) : (
          <>
            <Text style={styles.sectionLabel}>from your queue</Text>
            {(queue ?? []).length === 0 ? (
              <Text style={styles.empty}>Your queue is empty.</Text>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 18 }}>
                {(queue ?? []).map((r) => <QueueCard key={r.id} r={r} />)}
              </ScrollView>
            )}

            <Text style={styles.sectionLabel}>recently cooked</Text>
            {(recent ?? []).length === 0 ? (
              <Text style={styles.empty}>No recent tries yet.</Text>
            ) : (
              (recent ?? []).map((r) => <RowItem key={r.id} r={r} />)
            )}
          </>
        )}
      </ScrollView>

      {/* Search input at bottom */}
      <View style={styles.searchBar}>
        <Text style={styles.searchGlyph}>⌕</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search any recipe"
          placeholderTextColor={colors.muted}
          value={searchText}
          onChangeText={setSearchText}
          returnKeyType="search"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bone, paddingHorizontal: 22 },
  head: { flexDirection: 'row', paddingTop: 6, paddingBottom: 6 },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.card,
    alignItems: 'center', justifyContent: 'center',
    ...shadow.cta,
  },
  iconBtnText: { fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.ink },
  h1: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 26,
    color: colors.ink,
    letterSpacing: -0.6,
    marginTop: 6,
  },
  subtitle: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: colors.muted,
    marginTop: 6,
  },
  sectionLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    color: colors.muted,
    letterSpacing: 1.0,
    textTransform: 'uppercase',
    marginTop: 22,
    marginBottom: 10,
  },
  queueCard: {
    width: 150,
    height: 90,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginRight: 10,
    justifyContent: 'space-between',
  },
  queueTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
    color: colors.ink,
    letterSpacing: -0.3,
  },
  queueCuisine: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: colors.sage,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
  },
  rowTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    color: colors.ink,
    letterSpacing: -0.3,
  },
  rowMeta: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  chev: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    color: colors.muted,
    marginLeft: 8,
  },
  empty: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: colors.muted,
    marginTop: 6,
  },
  searchBar: {
    position: 'absolute',
    left: 22,
    right: 22,
    bottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 4,
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
});
