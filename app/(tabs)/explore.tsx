import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Image,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';
import { RecipeCard } from '@/components/RecipeCard';
import { EditorialHeading } from '@/components/EditorialHeading';
import { colors, shadow } from '@/lib/theme';
import {
  CUISINES,
  type Cuisine,
  type SortOption,
  getSmartFilters,
  getSmartSortLabel,
  isWeekend,
} from '@/lib/smart-sort';

const SORT_OPTIONS: { key: SortOption; label: string }[] = [
  { key: 'smart', label: isWeekend() ? 'Weekend' : 'For Tonight' },
  { key: 'new', label: 'New' },
  { key: 'top_rated', label: 'Top Rated' },
  { key: 'most_tried', label: 'Most Tried' },
];

async function fetchRecipes(sort: SortOption, cuisine: Cuisine, search: string) {
  let query = supabase
    .from('recipes')
    .select(`
      *,
      creator:profiles!created_by(display_name, username, avatar_url),
      tries:recipe_tries(rating)
    `)
    .eq('is_public', true);

  if (cuisine !== 'All') {
    query = query.eq('cuisine', cuisine);
  }

  if (search.trim()) {
    query = query.ilike('title', `%${search.trim()}%`);
  }

  if (sort === 'smart') {
    const filters = getSmartFilters();
    if (filters.difficulty) {
      query = query.in('difficulty', filters.difficulty);
    }
    if (filters.maxTotalMinutes) {
      query = query.lte('prep_time_min', filters.maxTotalMinutes);
    }
  }

  query = query.order('created_at', { ascending: false }).limit(40);

  const { data, error } = await query;
  if (error) throw error;

  const enriched = (data ?? []).map((r: any) => {
    const ratings = (r.tries ?? []).map((t: any) => t.rating).filter(Boolean);
    return {
      ...r,
      avg_rating: ratings.length ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length : null,
      try_count: ratings.length,
    };
  });

  if (sort === 'top_rated') return enriched.sort((a, b) => (b.avg_rating ?? 0) - (a.avg_rating ?? 0));
  if (sort === 'most_tried') return enriched.sort((a, b) => b.try_count - a.try_count);
  return enriched;
}

async function fetchProfiles(search: string, excludeUserId?: string) {
  if (!excludeUserId) return [];
  let query = supabase
    .from('profiles')
    .select('id, display_name, username, avatar_url, created_at')
    .neq('id', excludeUserId);

  if (search.trim()) {
    const term = `%${search.trim()}%`;
    query = query.or(`username.ilike.${term},display_name.ilike.${term}`);
  } else {
    query = query.order('created_at', { ascending: false });
  }

  query = query.limit(50);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

async function fetchFollowing(userId: string) {
  const { data, error } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', userId);
  if (error) throw error;
  return new Set((data ?? []).map((f: any) => f.following_id));
}

async function fetchByIngredients(ingredients: string[]) {
  if (!ingredients.length) return [];

  const { data, error } = await supabase.rpc('search_by_ingredients', {
    ingredient_list: ingredients.map(i => i.toLowerCase().trim()),
  });

  if (error) {
    const { data: flat } = await supabase
      .from('recipe_ingredients_flat')
      .select('recipe_id, ingredient_name')
      .in('ingredient_name', ingredients.map(i => i.toLowerCase().trim()));

    const counts: Record<string, number> = {};
    for (const row of flat ?? []) {
      counts[row.recipe_id] = (counts[row.recipe_id] ?? 0) + 1;
    }
    const sortedIds = Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20)
      .map(([id]) => id);

    const { data: recipes } = await supabase
      .from('recipes')
      .select('*, tries:recipe_tries(rating)')
      .in('id', sortedIds)
      .eq('is_public', true);

    return (recipes ?? []).map((r: any) => ({
      ...r,
      match_count: counts[r.id] ?? 0,
      total_ingredients: (r.ingredients ?? []).length,
    }));
  }

  return data ?? [];
}

type ExploreTab = 'browse' | 'fridge' | 'people';

export default function ExploreScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const [sort, setSort] = useState<SortOption>('smart');
  const [cuisine, setCuisine] = useState<Cuisine>('All');
  const [searchText, setSearchText] = useState('');
  const [mode, setMode] = useState<ExploreTab>('browse');
  const [fridgeInput, setFridgeInput] = useState('');
  const [fridgeIngredients, setFridgeIngredients] = useState<string[]>([]);
  const [peopleSearch, setPeopleSearch] = useState('');

  const { data: recipes, isLoading } = useQuery({
    queryKey: ['explore', sort, cuisine, searchText],
    queryFn: () => fetchRecipes(sort, cuisine, searchText),
    enabled: mode === 'browse',
  });

  const { data: fridgeResults, isLoading: fridgeLoading } = useQuery({
    queryKey: ['fridge', fridgeIngredients],
    queryFn: () => fetchByIngredients(fridgeIngredients),
    enabled: mode === 'fridge' && fridgeIngredients.length > 0,
  });

  const { data: profiles, isLoading: peopleLoading } = useQuery({
    queryKey: ['people', peopleSearch],
    queryFn: () => fetchProfiles(peopleSearch, user?.id),
    enabled: mode === 'people' && !!user?.id,
  });

  const { data: followingSet } = useQuery({
    queryKey: ['following', user?.id],
    queryFn: () => fetchFollowing(user!.id),
    enabled: mode === 'people' && !!user?.id,
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
      queryClient.invalidateQueries({ queryKey: ['following', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['people'] });
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
      queryClient.invalidateQueries({ queryKey: ['following', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['people'] });
    },
  });

  function addFridgeIngredient() {
    const val = fridgeInput.trim().toLowerCase();
    if (val && !fridgeIngredients.includes(val)) {
      setFridgeIngredients(prev => [...prev, val]);
    }
    setFridgeInput('');
  }

  const smartLabel = getSmartSortLabel();

  const ModePill = ({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) => (
    <Pressable
      onPress={onPress}
      style={[styles.modePill, active ? styles.modePillActive : styles.modePillInactive]}
    >
      <Text style={[styles.modePillText, active ? styles.modePillTextActive : styles.modePillTextInactive]}>
        {label}
      </Text>
    </Pressable>
  );

  const Chip = ({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) => (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active ? styles.chipActive : styles.chipInactive]}
    >
      <Text style={[styles.chipText, active ? styles.chipTextActive : styles.chipTextInactive]}>
        {label}
      </Text>
    </Pressable>
  );

  const HeaderBlock = (
    <View>
      <EditorialHeading size={26} emphasis="cooks" emphasisColor="sage">
        {'What your circle\n'}
      </EditorialHeading>
      <Text style={styles.subtitle}>explore, fridge-match, or find people</Text>

      {/* Mode pill tabs */}
      <View style={styles.modeRow}>
        <ModePill label="browse" active={mode === 'browse'} onPress={() => setMode('browse')} />
        <ModePill label="fridge" active={mode === 'fridge'} onPress={() => setMode('fridge')} />
        <ModePill label="people" active={mode === 'people'} onPress={() => setMode('people')} />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      {mode === 'people' ? (
        <FlatList
          data={(profiles as any[]) ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 100 }}
          ListHeaderComponent={
            <View>
              {HeaderBlock}

              {/* Search */}
              <View style={styles.searchRow}>
                <Text style={styles.searchGlyph}>⌕</Text>
                <TextInput
                  style={styles.searchInput}
                  placeholder="search by name or username"
                  placeholderTextColor={colors.muted}
                  value={peopleSearch}
                  onChangeText={setPeopleSearch}
                />
              </View>

              {!peopleSearch.trim() && (
                <Text style={styles.sectionLabel}>suggested cooks</Text>
              )}
            </View>
          }
          renderItem={({ item }) => {
            const isFollowing = followingSet?.has(item.id) ?? false;
            const isSelf = user?.id === item.id;
            const initial = (item.display_name?.[0] || item.username?.[0] || '?').toUpperCase();

            return (
              <Pressable
                onPress={() => router.push(`/user/${item.id}`)}
                style={styles.personRow}
              >
                {item.avatar_url ? (
                  <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, { backgroundColor: colors.clay, alignItems: 'center', justifyContent: 'center' }]}>
                    <Text style={styles.avatarText}>{initial}</Text>
                  </View>
                )}

                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.personName}>{item.display_name || item.username}</Text>
                  {item.username && <Text style={styles.personHandle}>@{item.username}</Text>}
                </View>

                {!isSelf && (
                  <Pressable
                    onPress={() => {
                      if (isFollowing) unfollowMutation.mutate(item.id);
                      else followMutation.mutate(item.id);
                    }}
                    style={[
                      styles.followBtn,
                      isFollowing ? styles.followBtnFollowing : styles.followBtnFollow,
                    ]}
                  >
                    <Text style={isFollowing ? styles.followBtnTextFollowing : styles.followBtnTextFollow}>
                      {isFollowing ? 'following' : 'follow'}
                    </Text>
                  </Pressable>
                )}
              </Pressable>
            );
          }}
          ListEmptyComponent={
            peopleLoading ? (
              <ActivityIndicator color={colors.sage} style={{ marginTop: 32 }} />
            ) : (
              <Text style={styles.empty}>no users found</Text>
            )
          }
        />
      ) : mode === 'browse' ? (
        <FlatList
          data={recipes as any[]}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <RecipeCard recipe={item} showCreator />}
          contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 100 }}
          ListHeaderComponent={
            <View>
              {HeaderBlock}

              {/* Search */}
              <View style={styles.searchRow}>
                <Text style={styles.searchGlyph}>⌕</Text>
                <TextInput
                  style={styles.searchInput}
                  placeholder="search recipes"
                  placeholderTextColor={colors.muted}
                  value={searchText}
                  onChangeText={setSearchText}
                />
              </View>

              {/* Sort chips */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                {SORT_OPTIONS.map((opt) => (
                  <Chip
                    key={opt.key}
                    label={opt.key === 'smart' ? smartLabel : opt.label}
                    active={sort === opt.key}
                    onPress={() => setSort(opt.key)}
                  />
                ))}
              </ScrollView>

              {/* Cuisine chips */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                {CUISINES.map((c) => (
                  <Chip
                    key={c}
                    label={c}
                    active={cuisine === c}
                    onPress={() => setCuisine(c)}
                  />
                ))}
              </ScrollView>
            </View>
          }
          ListEmptyComponent={
            isLoading ? (
              <ActivityIndicator color={colors.sage} style={{ marginTop: 32 }} />
            ) : (
              <Text style={styles.empty}>no recipes found</Text>
            )
          }
        />
      ) : (
        <FlatList
          data={(fridgeResults as any[]) ?? []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View>
              {item.match_count !== undefined && (
                <Text style={styles.matchText}>
                  {item.match_count} of {item.total_ingredients} ingredients matched
                </Text>
              )}
              <RecipeCard recipe={item} showCreator />
            </View>
          )}
          contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 100 }}
          ListHeaderComponent={
            <View>
              {HeaderBlock}

              <EditorialHeading size={22} emphasis="fridge?" emphasisColor="clay">
                {"What's in your\n"}
              </EditorialHeading>
              <Text style={styles.subtitle}>add ingredients you have and we'll match recipes</Text>

              {/* Ingredient input row */}
              <View style={styles.fridgeRow}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="add ingredient"
                  placeholderTextColor={colors.muted}
                  value={fridgeInput}
                  onChangeText={setFridgeInput}
                  onSubmitEditing={addFridgeIngredient}
                  returnKeyType="done"
                />
                <Pressable style={styles.addBtn} onPress={addFridgeIngredient}>
                  <Text style={styles.addBtnText}>add</Text>
                </Pressable>
              </View>

              {/* Ingredient chips */}
              {fridgeIngredients.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                  {fridgeIngredients.map((ing) => (
                    <Pressable
                      key={ing}
                      style={[styles.chip, styles.chipInactive, styles.fridgeChip]}
                      onPress={() => setFridgeIngredients(prev => prev.filter(i => i !== ing))}
                    >
                      <Text style={styles.chipTextInactive}>{ing}</Text>
                      <Text style={styles.removeGlyph}>  ×</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              )}

              {fridgeLoading && <ActivityIndicator color={colors.sage} style={{ marginBottom: 16 }} />}
            </View>
          }
          ListEmptyComponent={
            fridgeIngredients.length === 0 ? null : (
              <Text style={styles.empty}>no recipes matched those ingredients</Text>
            )
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bone, paddingTop: 8 },
  subtitle: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: colors.muted,
    marginTop: 6,
    marginBottom: 18,
  },
  modeRow: { flexDirection: 'row', gap: 6, marginBottom: 16 },
  modePill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    ...shadow.card,
  },
  modePillActive: { backgroundColor: colors.ink },
  modePillInactive: { backgroundColor: colors.card },
  modePillText: { fontFamily: 'Inter_700Bold', fontSize: 12, letterSpacing: -0.1 },
  modePillTextActive: { color: '#fff' },
  modePillTextInactive: { color: colors.inkSoft },

  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginBottom: 14,
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

  chipScroll: { marginBottom: 14 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    marginRight: 6,
  },
  chipInactive: {
    backgroundColor: colors.card,
    ...shadow.card,
  },
  chipActive: { backgroundColor: colors.ink },
  chipText: { fontFamily: 'Inter_700Bold', fontSize: 12, letterSpacing: -0.1 },
  chipTextInactive: { color: colors.inkSoft },
  chipTextActive: { color: '#fff' },

  sectionLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    color: colors.muted,
    letterSpacing: 1.0,
    textTransform: 'uppercase',
    marginTop: 4,
    marginBottom: 10,
  },

  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 10,
  },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.card },
  avatarText: { fontFamily: 'Inter_700Bold', fontSize: 16, color: '#F5E9D3' },
  personName: { fontFamily: 'Inter_700Bold', fontSize: 14, color: colors.ink },
  personHandle: { fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.muted, marginTop: 2 },

  followBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  followBtnFollow: { backgroundColor: colors.sage, ...shadow.cta },
  followBtnFollowing: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  followBtnTextFollow: { fontFamily: 'Inter_700Bold', fontSize: 12, color: '#fff' },
  followBtnTextFollowing: { fontFamily: 'Inter_700Bold', fontSize: 12, color: colors.inkSoft },

  empty: {
    color: colors.muted,
    textAlign: 'center',
    marginTop: 32,
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
  },

  fridgeRow: { flexDirection: 'row', gap: 8, marginBottom: 12, alignItems: 'center' },
  input: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: colors.ink,
  },
  addBtn: {
    backgroundColor: colors.clay,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 14,
    ...shadow.cta,
  },
  addBtnText: { fontFamily: 'Inter_700Bold', fontSize: 13, color: '#fff' },
  fridgeChip: { flexDirection: 'row', alignItems: 'center' },
  removeGlyph: { fontFamily: 'Inter_700Bold', fontSize: 13, color: colors.muted },
  matchText: {
    color: colors.sage,
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    letterSpacing: 0.6,
    paddingHorizontal: 4,
    paddingTop: 6,
    textTransform: 'uppercase',
  },
});
