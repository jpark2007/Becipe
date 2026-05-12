// app/collection/[id].tsx
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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';
import { colors, radius } from '@/lib/theme';
import { AlbumPickerSheet } from '@/components/AlbumPickerSheet';
import { ActionSheet } from '@/components/ActionSheet';
import type { Recipe, RecipeCollection } from '@/lib/database.types';

async function fetchCollection(id: string): Promise<RecipeCollection> {
  const { data, error } = await supabase
    .from('recipe_collections')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

async function fetchCollectionRecipes(collectionId: string): Promise<Recipe[]> {
  const { data, error } = await supabase
    .from('recipe_collection_items')
    .select('recipe:recipes(*)')
    .eq('collection_id', collectionId)
    .order('added_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r: any) => r.recipe).filter(Boolean);
}

function RecipeRow({
  recipe,
  onPress,
  onMenu,
}: {
  recipe: Recipe;
  onPress: () => void;
  onMenu: () => void;
}) {
  return (
    <Pressable style={rowStyles.row} onPress={onPress} onLongPress={onMenu}>
      {recipe.cover_image_url ? (
        <Image source={{ uri: recipe.cover_image_url }} style={rowStyles.thumb} contentFit="cover" />
      ) : (
        <View style={[rowStyles.thumb, { backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }]}>
          <Text style={{ fontSize: 18 }}>🍽</Text>
        </View>
      )}
      <View style={rowStyles.meta}>
        <Text style={rowStyles.title} numberOfLines={1}>{recipe.title}</Text>
        {recipe.cuisine && (
          <Text style={rowStyles.cuisine}>{recipe.cuisine}</Text>
        )}
      </View>
      <Pressable hitSlop={8} onPress={onMenu} style={rowStyles.menu}>
        <Text style={rowStyles.menuText}>⋯</Text>
      </Pressable>
    </Pressable>
  );
}

const rowStyles = StyleSheet.create({
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
  title: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.ink },
  cuisine: { fontFamily: 'Inter_500Medium', fontSize: 11, color: colors.muted, marginTop: 2 },
  menu: { paddingHorizontal: 4 },
  menuText: { fontFamily: 'Inter_700Bold', fontSize: 18, color: colors.muted },
});

export default function CollectionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const [search, setSearch] = useState('');
  const [addRecipesVisible, setAddRecipesVisible] = useState(false);
  const [menuRecipe, setMenuRecipe] = useState<Recipe | null>(null);

  const { data: collection, isLoading: colLoading } = useQuery({
    queryKey: ['collection', id],
    queryFn: () => fetchCollection(id),
  });

  const { data: recipes = [], isLoading: recipesLoading } = useQuery({
    queryKey: ['collection-items', id],
    queryFn: () => fetchCollectionRecipes(id),
  });

  const removeRecipe = useMutation({
    mutationFn: async (recipeId: string) => {
      const { error } = await supabase
        .from('recipe_collection_items')
        .delete()
        .eq('collection_id', id)
        .eq('recipe_id', recipeId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collection-items', id] });
      queryClient.invalidateQueries({ queryKey: ['collection-counts', user?.id] });
    },
  });

  const filtered = useMemo(
    () =>
      search.trim()
        ? recipes.filter(r => r.title.toLowerCase().includes(search.toLowerCase()))
        : recipes,
    [recipes, search],
  );

  if (colLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bone, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.sage} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Text style={styles.back}>←</Text>
        </Pressable>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.albumName} numberOfLines={1}>{collection?.name ?? ''}</Text>
          <Text style={styles.count}>{recipes.length} recipe{recipes.length !== 1 ? 's' : ''}</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <TextInput
          style={styles.search}
          placeholder="Search in album…"
          placeholderTextColor={colors.muted}
          value={search}
          onChangeText={setSearch}
          clearButtonMode="while-editing"
        />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {recipesLoading ? (
          <ActivityIndicator color={colors.sage} style={{ marginTop: 40 }} />
        ) : filtered.length === 0 ? (
          <Text style={styles.empty}>
            {search ? 'No recipes match your search.' : 'No recipes in this album yet.'}
          </Text>
        ) : (
          filtered.map(r => (
            <RecipeRow
              key={r.id}
              recipe={r}
              onPress={() => router.push(`/recipe/${r.id}` as any)}
              onMenu={() => setMenuRecipe(r)}
            />
          ))
        )}

        <Pressable style={styles.addBtn} onPress={() => setAddRecipesVisible(true)}>
          <Text style={styles.addBtnText}>＋  Add recipes</Text>
        </Pressable>
      </ScrollView>

      <ActionSheet
        visible={!!menuRecipe}
        onClose={() => setMenuRecipe(null)}
        title={menuRecipe?.title}
        actions={menuRecipe ? [
          { label: 'View recipe', onPress: () => router.push(`/recipe/${menuRecipe.id}` as any) },
          { label: 'Remove from album', destructive: true, onPress: () => removeRecipe.mutate(menuRecipe.id) },
        ] : []}
      />
      {user && (
        <AlbumPickerSheet
          visible={addRecipesVisible}
          onClose={() => {
            setAddRecipesVisible(false);
            queryClient.invalidateQueries({ queryKey: ['collection-items', id] });
          }}
          mode="pick-recipes"
          collectionId={id}
          userId={user.id}
        />
      )}
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
  albumName: {
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
  empty: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: colors.muted,
    marginTop: 32,
    textAlign: 'center',
  },
  addBtn: {
    marginTop: 28,
    alignSelf: 'center',
    backgroundColor: colors.sage,
    borderRadius: radius.pill,
    paddingHorizontal: 28,
    paddingVertical: 13,
  },
  addBtnText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    color: colors.card,
  },
});
