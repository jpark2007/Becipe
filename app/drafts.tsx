import { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';
import { colors, radius } from '@/lib/theme';
import type { Recipe } from '@/lib/database.types';

async function fetchDraftRecipes(userId: string): Promise<Recipe[]> {
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('created_by', userId)
    .eq('is_public', false)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Recipe[];
}

export default function DraftsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');

  const { data: recipes = [], isLoading } = useQuery({
    queryKey: ['drafts', user?.id],
    queryFn: () => fetchDraftRecipes(user!.id),
    enabled: !!user,
  });

  const filtered = useMemo(
    () => search.trim()
      ? recipes.filter(r => r.title.toLowerCase().includes(search.toLowerCase()))
      : recipes,
    [recipes, search],
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Text style={styles.back}>←</Text>
        </Pressable>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.title}>Drafts</Text>
          <Text style={styles.count}>{recipes.length} recipe{recipes.length !== 1 ? 's' : ''}</Text>
        </View>
      </View>

      <View style={styles.searchWrap}>
        <TextInput
          style={styles.search}
          placeholder="Search drafts…"
          placeholderTextColor={colors.muted}
          value={search}
          onChangeText={setSearch}
          clearButtonMode="while-editing"
        />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {isLoading ? (
          <ActivityIndicator color={colors.sage} style={{ marginTop: 40 }} />
        ) : filtered.length === 0 ? (
          <Text style={styles.empty}>
            {search ? 'No drafts match your search.' : 'No drafts yet. Save a recipe without publishing to see it here.'}
          </Text>
        ) : (
          filtered.map(recipe => (
            <Pressable
              key={recipe.id}
              style={styles.row}
              onPress={() => router.push(`/recipe/${recipe.id}` as any)}
            >
              {recipe.cover_image_url ? (
                <Image source={{ uri: recipe.cover_image_url }} style={styles.thumb} contentFit="cover" />
              ) : (
                <View style={[styles.thumb, { backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }]}>
                  <Text style={{ fontSize: 18 }}>📝</Text>
                </View>
              )}
              <View style={styles.meta}>
                <Text style={styles.rowTitle} numberOfLines={1}>{recipe.title}</Text>
                {recipe.cuisine && (
                  <Text style={styles.cuisine}>{recipe.cuisine}</Text>
                )}
              </View>
              <Pressable
                hitSlop={8}
                onPress={() => router.push(`/add-recipe?editId=${recipe.id}` as any)}
                style={styles.editBtn}
              >
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: colors.sage }}>Edit</Text>
              </Pressable>
            </Pressable>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bone },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 6,
  },
  back: {
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
    color: colors.ink,
  },
  title: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 20,
    color: colors.ink,
    letterSpacing: -0.4,
  },
  count: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: colors.muted,
    marginTop: 1,
  },
  searchWrap: {
    paddingHorizontal: 22,
    paddingBottom: 10,
  },
  search: {
    height: 38,
    backgroundColor: colors.bg,
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: colors.ink,
    borderWidth: 1,
    borderColor: colors.border,
  },
  content: {
    paddingHorizontal: 22,
    paddingBottom: 120,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
    gap: 12,
  },
  thumb: { width: 44, height: 44, borderRadius: radius.sm },
  meta: { flex: 1 },
  rowTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: colors.ink,
  },
  cuisine: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },
  editBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: colors.sageSoft,
    borderRadius: radius.sm,
  },
  empty: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: colors.muted,
    marginTop: 32,
    textAlign: 'center',
  },
});
