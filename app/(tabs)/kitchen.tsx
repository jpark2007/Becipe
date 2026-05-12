// app/(tabs)/kitchen.tsx
import { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';
import { EditorialHeading } from '@/components/EditorialHeading';
import { colors, radius } from '@/lib/theme';
import { Ionicons } from '@expo/vector-icons';
import { InboxIcon } from '@/components/InboxIcon';
import type { Recipe, RecipeCollection } from '@/lib/database.types';
import { AlbumPickerSheet } from '@/components/AlbumPickerSheet';
import { ActionSheet } from '@/components/ActionSheet';
import type { ActionSheetAction } from '@/components/ActionSheet';

// ─── Album colors (cycles) ──────────────────────────────────────────
const ALBUM_COLORS = [colors.sageSoft, colors.claySoft, colors.ochreSoft];
const ALBUM_TEXT   = [colors.sage,     colors.clay,     colors.ochre];

function albumColor(index: number) { return ALBUM_COLORS[index % 3]; }
function albumTextColor(index: number) { return ALBUM_TEXT[index % 3]; }

// ─── Data fetchers ──────────────────────────────────────────────────
async function fetchCollections(userId: string): Promise<RecipeCollection[]> {
  const { data, error } = await supabase
    .from('recipe_collections')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

async function fetchCollectionCounts(userId: string): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from('recipe_collection_items')
    .select('collection_id, recipe_collections!inner(user_id)')
    .eq('recipe_collections.user_id', userId);
  if (error) return {};
  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    counts[(row as any).collection_id] = (counts[(row as any).collection_id] ?? 0) + 1;
  }
  return counts;
}

async function fetchSavedRecipes(userId: string) {
  const { data, error } = await supabase
    .from('saved_recipes')
    .select('recipe_id, recipe:recipes(*)')
    .eq('user_id', userId)
    .order('saved_at', { ascending: false });
  if (error) throw error;
  return (data ?? [])
    .map((row: any) => ({ ...row.recipe, _source: 'saved' as const }))
    .filter(Boolean) as (Recipe & { _source: 'saved' })[];
}

async function fetchMyRecipes(userId: string) {
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('created_by', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r: Recipe) => ({ ...r, _source: 'mine' as const }));
}

async function fetchLikedCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('recipe_likes')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);
  if (error) return 0;
  return count ?? 0;
}

function mergeAllRecipes(
  saved: (Recipe & { _source: 'saved' })[],
  mine: (Recipe & { _source: 'mine' })[],
): (Recipe & { _source: 'saved' | 'mine' })[] {
  const map = new Map<string, Recipe & { _source: 'saved' | 'mine' }>();
  for (const r of saved) map.set(r.id, r);
  for (const r of mine) map.set(r.id, r);
  return Array.from(map.values());
}

// ─── New Album Modal ────────────────────────────────────────────────
function NewAlbumModal({
  visible,
  onClose,
  onCreated,
}: {
  visible: boolean;
  onClose: () => void;
  onCreated: (collection: RecipeCollection) => void;
}) {
  const { user } = useAuthStore();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  async function create() {
    if (!name.trim() || !user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('recipe_collections')
      .insert({ user_id: user.id, name: name.trim() })
      .select()
      .single();
    setLoading(false);
    if (error) { Alert.alert('Error', 'Could not create album.'); return; }
    setName('');
    onCreated(data as RecipeCollection);
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={newAlbumStyles.overlay} onPress={onClose}>
        <Pressable style={newAlbumStyles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={newAlbumStyles.title}>New album</Text>
          <TextInput
            style={newAlbumStyles.input}
            placeholder="Album name"
            placeholderTextColor={colors.muted}
            value={name}
            onChangeText={setName}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={create}
          />
          <Pressable
            style={[newAlbumStyles.btn, (!name.trim() || loading) && { opacity: 0.4 }]}
            onPress={create}
            disabled={!name.trim() || loading}
          >
            <Text style={newAlbumStyles.btnText}>{loading ? 'Creating…' : 'Create'}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const newAlbumStyles = StyleSheet.create({
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
  btn: {
    backgroundColor: colors.sage,
    borderRadius: radius.pill,
    paddingVertical: 12,
    alignItems: 'center',
  },
  btnText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    color: colors.card,
  },
});

// ─── Compact recipe row ─────────────────────────────────────────────
function RecipeRow({
  recipe,
  onPress,
  onMenu,
}: {
  recipe: Recipe & { _source: 'saved' | 'mine' };
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
        <Text style={rowStyles.source}>{recipe._source === 'mine' ? 'Your recipe' : 'Saved'}</Text>
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
  title: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: colors.ink,
  },
  source: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },
  menu: { paddingHorizontal: 4 },
  menuText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: colors.muted,
  },
});

// ─── Main screen ────────────────────────────────────────────────────
type Tab = 'albums' | 'all' | 'mine';

export default function KitchenScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const [tab, setTab] = useState<Tab>('albums');
  const [search, setSearch] = useState('');
  const [newAlbumVisible, setNewAlbumVisible] = useState(false);
  const [pickerRecipeId, setPickerRecipeId] = useState<string | null>(null);
  const [menuRecipe, setMenuRecipe] = useState<(Recipe & { _source: 'saved' | 'mine' }) | null>(null);
  const [menuAlbum, setMenuAlbum] = useState<RecipeCollection | null>(null);

  const { data: collections = [], isLoading: collectionsLoading } = useQuery({
    queryKey: ['collections', user?.id],
    queryFn: () => fetchCollections(user!.id),
    enabled: !!user,
  });

  const { data: albumCounts = {} } = useQuery({
    queryKey: ['collection-counts', user?.id],
    queryFn: () => fetchCollectionCounts(user!.id),
    enabled: !!user,
  });

  const { data: likedCount = 0 } = useQuery({
    queryKey: ['liked-count', user?.id],
    queryFn: () => fetchLikedCount(user!.id),
    enabled: !!user,
  });

  const { data: savedRecipes = [], isLoading: savedLoading } = useQuery({
    queryKey: ['kitchen-saved', user?.id],
    queryFn: () => fetchSavedRecipes(user!.id),
    enabled: !!user,
  });

  const { data: myRecipes = [], isLoading: mineLoading } = useQuery({
    queryKey: ['kitchen-mine', user?.id],
    queryFn: () => fetchMyRecipes(user!.id),
    enabled: !!user,
  });

  const allRecipes = useMemo(
    () => mergeAllRecipes(savedRecipes, myRecipes),
    [savedRecipes, myRecipes],
  );

  const filteredAll = useMemo(
    () => search.trim()
      ? allRecipes.filter(r => r.title.toLowerCase().includes(search.toLowerCase()))
      : allRecipes,
    [allRecipes, search],
  );

  const filteredMine = useMemo(
    () => search.trim()
      ? myRecipes.filter(r => r.title.toLowerCase().includes(search.toLowerCase()))
      : myRecipes,
    [myRecipes, search],
  );

  function handleMenuAll(recipe: Recipe & { _source: 'saved' | 'mine' }) {
    setMenuRecipe(recipe);
  }

  const menuActions = useMemo<ActionSheetAction[]>(() => {
    if (!menuRecipe) return [];
    const actions: ActionSheetAction[] = [
      { label: 'View recipe', onPress: () => router.push(`/recipe/${menuRecipe.id}` as any) },
      { label: 'Add to album', onPress: () => setPickerRecipeId(menuRecipe.id) },
    ];
    if (menuRecipe._source === 'mine') {
      actions.splice(1, 0, {
        label: 'Edit recipe',
        onPress: () => router.push({ pathname: '/add-recipe', params: { editId: menuRecipe.id } } as any),
      });
    }
    if (menuRecipe._source === 'saved') {
      actions.push({
        label: 'Remove from saved',
        destructive: true,
        onPress: async () => {
          await supabase
            .from('saved_recipes')
            .delete()
            .eq('user_id', user!.id)
            .eq('recipe_id', menuRecipe.id);
          queryClient.invalidateQueries({ queryKey: ['kitchen-saved', user?.id] });
        },
      });
    }
    return actions;
  }, [menuRecipe]);

  const albumMenuActions = useMemo<ActionSheetAction[]>(() => {
    if (!menuAlbum) return [];
    return [
      {
        label: 'Delete album',
        destructive: true,
        onPress: async () => {
          await supabase
            .from('recipe_collections')
            .delete()
            .eq('id', menuAlbum.id);
          queryClient.invalidateQueries({ queryKey: ['collections', user?.id] });
          queryClient.invalidateQueries({ queryKey: ['collection-counts', user?.id] });
        },
      },
    ];
  }, [menuAlbum]);

  function onAlbumCreated(collection: RecipeCollection) {
    queryClient.invalidateQueries({ queryKey: ['collections', user?.id] });
    queryClient.invalidateQueries({ queryKey: ['collection-counts', user?.id] });
    setNewAlbumVisible(false);
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: 'albums', label: 'Albums' },
    { key: 'all', label: 'All' },
    { key: 'mine', label: 'My Recipes' },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <EditorialHeading size={30} emphasis="Kitchen" emphasisColor="sage">
            {'Your\n'}
          </EditorialHeading>
        </View>
        <InboxIcon />
      </View>

      {/* Search bar — only for list tabs */}
      {tab !== 'albums' && (
        <View style={styles.searchWrap}>
          <View style={styles.search}>
            <Ionicons name="search-outline" size={20} color={colors.muted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search recipes…"
              placeholderTextColor={colors.muted}
              value={search}
              onChangeText={setSearch}
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
          </View>
        </View>
      )}

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {TABS.map(t => (
          <Pressable
            key={t.key}
            style={[styles.tabBtn, tab === t.key && styles.tabBtnActive]}
            onPress={() => { setTab(t.key); setSearch(''); }}
          >
            <Text style={[styles.tabLabel, tab === t.key && styles.tabLabelActive]}>
              {t.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Albums tab */}
      {tab === 'albums' && (
        <ScrollView
          contentContainerStyle={styles.albumGrid}
          showsVerticalScrollIndicator={false}
        >
          {collectionsLoading ? (
            <ActivityIndicator color={colors.sage} style={{ marginTop: 40, width: '100%' }} />
          ) : (
            <>
              {/* Liked virtual album — always first */}
              <Pressable
                style={[styles.albumCard, { backgroundColor: colors.claySoft }]}
                onPress={() => router.push('/liked' as any)}
              >
                <Text style={{ fontSize: 24, marginBottom: 4 }}>♥</Text>
                <Text style={[styles.albumName, { color: colors.clay }]}>Favorites</Text>
                <Text style={[styles.albumCount, { color: colors.clay }]}>
                  {likedCount} recipe{likedCount !== 1 ? 's' : ''}
                </Text>
              </Pressable>
              {collections.map((col, i) => (
                <Pressable
                  key={col.id}
                  style={[styles.albumCard, { backgroundColor: albumColor(i) }]}
                  onPress={() => router.push(`/collection/${col.id}` as any)}
                  onLongPress={() => setMenuAlbum(col)}
                >
                  <Text style={[styles.albumName, { color: albumTextColor(i) }]} numberOfLines={2}>
                    {col.name}
                  </Text>
                  <Text style={[styles.albumCount, { color: albumTextColor(i) }]}>
                    {albumCounts[col.id] ?? 0} recipe{(albumCounts[col.id] ?? 0) !== 1 ? 's' : ''}
                  </Text>
                </Pressable>
              ))}
              <Pressable
                style={[styles.albumCard, styles.albumCardNew]}
                onPress={() => setNewAlbumVisible(true)}
              >
                <Text style={styles.albumPlus}>＋</Text>
                <Text style={styles.albumNewLabel}>New album</Text>
              </Pressable>
            </>
          )}
        </ScrollView>
      )}

      {/* All tab */}
      {tab === 'all' && (
        <ScrollView contentContainerStyle={styles.listContent}>
          {(savedLoading || mineLoading) ? (
            <ActivityIndicator color={colors.sage} style={{ marginTop: 40 }} />
          ) : filteredAll.length === 0 ? (
            <Text style={styles.empty}>
              {search ? 'No recipes match your search.' : 'Save or create recipes to see them here.'}
            </Text>
          ) : (
            filteredAll.map(r => (
              <RecipeRow
                key={r.id}
                recipe={r}
                onPress={() => router.push(`/recipe/${r.id}` as any)}
                onMenu={() => handleMenuAll(r)}
              />
            ))
          )}
        </ScrollView>
      )}

      {/* Mine tab */}
      {tab === 'mine' && (
        <ScrollView contentContainerStyle={styles.listContent}>
          {mineLoading ? (
            <ActivityIndicator color={colors.sage} style={{ marginTop: 40 }} />
          ) : filteredMine.length === 0 ? (
            <Text style={styles.empty}>
              {search ? 'No recipes match your search.' : 'No recipes yet. Tap + to add your first.'}
            </Text>
          ) : (
            filteredMine.map(r => (
              <RecipeRow
                key={r.id}
                recipe={r as Recipe & { _source: 'mine' }}
                onPress={() => router.push(`/recipe/${r.id}` as any)}
                onMenu={() => handleMenuAll(r as Recipe & { _source: 'mine' })}
              />
            ))
          )}
        </ScrollView>
      )}

      <NewAlbumModal
        visible={newAlbumVisible}
        onClose={() => setNewAlbumVisible(false)}
        onCreated={onAlbumCreated}
      />
      <ActionSheet
        visible={!!menuRecipe}
        onClose={() => setMenuRecipe(null)}
        title={menuRecipe?.title}
        actions={menuActions}
      />
      <ActionSheet
        visible={!!menuAlbum}
        onClose={() => setMenuAlbum(null)}
        title={menuAlbum?.name}
        actions={albumMenuActions}
      />
      {user && pickerRecipeId && (
        <AlbumPickerSheet
          visible={!!pickerRecipeId}
          onClose={() => setPickerRecipeId(null)}
          mode="pick-albums"
          recipeId={pickerRecipeId}
          userId={user.id}
        />
      )}
    </SafeAreaView>
  );
}

const COL_PADDING = 22;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bone },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: COL_PADDING,
    paddingTop: 6,
  },
  searchWrap: {
    paddingHorizontal: COL_PADDING,
    paddingTop: 4,
    paddingBottom: 6,
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
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: COL_PADDING,
    gap: 6,
    marginBottom: 14,
  },
  tabBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabBtnActive: {
    backgroundColor: colors.sage,
    borderColor: colors.sage,
  },
  tabLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: colors.muted,
  },
  tabLabelActive: {
    color: colors.card,
  },
  albumGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: COL_PADDING,
    gap: 12,
    paddingBottom: 120,
  },
  albumCard: {
    width: '47%',
    aspectRatio: 1,
    borderRadius: radius.lg,
    padding: 16,
    justifyContent: 'flex-end',
  },
  albumName: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
  },
  albumCount: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    marginTop: 4,
    opacity: 0.7,
  },
  albumCardNew: {
    backgroundColor: colors.borderSoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.border,
  },
  albumPlus: {
    fontFamily: 'Inter_700Bold',
    fontSize: 28,
    color: colors.muted,
  },
  albumNewLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: colors.muted,
    marginTop: 4,
  },
  listContent: {
    paddingHorizontal: COL_PADDING,
    paddingBottom: 120,
  },
  empty: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: colors.muted,
    marginTop: 32,
    textAlign: 'center',
  },
});
