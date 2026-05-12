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
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';
import { colors, radius } from '@/lib/theme';
import { Ionicons } from '@expo/vector-icons';
import type { Recipe } from '@/lib/database.types';

async function fetchLikedRecipes(userId: string): Promise<Recipe[]> {
  const { data, error } = await supabase
    .from('recipe_likes')
    .select('recipe:recipes(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r: any) => r.recipe).filter(Boolean);
}

export default function LikedScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');

  const { data: recipes = [], isLoading } = useQuery({
    queryKey: ['liked-recipes', user?.id],
    queryFn: () => fetchLikedRecipes(user!.id),
    enabled: !!user,
  });

  const unlikeMutation = useMutation({
    mutationFn: async (recipeId: string) => {
      const { error } = await supabase
        .from('recipe_likes')
        .delete()
        .eq('user_id', user!.id)
        .eq('recipe_id', recipeId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['liked-recipes', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['liked-count', user?.id] });
    },
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
          <Text style={styles.title}>Favorites</Text>
          <Text style={styles.count}>{recipes.length} recipe{recipes.length !== 1 ? 's' : ''}</Text>
        </View>
      </View>

      <View style={styles.searchWrap}>
        <View style={styles.search}>
          <Ionicons name="search-outline" size={16} color={colors.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search favorites…"
            placeholderTextColor={colors.muted}
            value={search}
            onChangeText={setSearch}
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {isLoading ? (
          <ActivityIndicator color={colors.clay} style={{ marginTop: 40 }} />
        ) : filtered.length === 0 ? (
          <Text style={styles.empty}>
            {search ? 'No recipes match your search.' : 'No favorites yet. Heart a recipe to see it here.'}
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
                  <Ionicons name="restaurant-outline" size={20} color={colors.muted} />
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
                onPress={() => unlikeMutation.mutate(recipe.id)}
                style={styles.heartBtn}
              >
                <Ionicons name="heart" size={18} color={colors.clay} />
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
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: colors.ink,
    height: '100%',
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
  heartBtn: {
    paddingHorizontal: 4,
  },
  empty: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: colors.muted,
    marginTop: 32,
    textAlign: 'center',
  },
});
