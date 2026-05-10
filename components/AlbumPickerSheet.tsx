// components/AlbumPickerSheet.tsx
import { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { colors, radius } from '@/lib/theme';
import type { Recipe, RecipeCollection } from '@/lib/database.types';

// ─── Types ──────────────────────────────────────────────────────────

export type PickAlbumsMode = {
  mode: 'pick-albums';
  recipeId: string;
  userId: string;
};

export type PickRecipesMode = {
  mode: 'pick-recipes';
  collectionId: string;
  userId: string;
};

export type AlbumPickerSheetProps = {
  visible: boolean;
  onClose: () => void;
} & (PickAlbumsMode | PickRecipesMode);

// ─── Data helpers ────────────────────────────────────────────────────

async function fetchCollections(userId: string): Promise<RecipeCollection[]> {
  const { data, error } = await supabase
    .from('recipe_collections')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

async function fetchCollectionsForRecipe(recipeId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('recipe_collection_items')
    .select('collection_id')
    .eq('recipe_id', recipeId);
  if (error) throw error;
  return (data ?? []).map((r: any) => r.collection_id);
}

async function fetchAllRecipesForUser(userId: string): Promise<Recipe[]> {
  const [savedRes, mineRes] = await Promise.all([
    supabase
      .from('saved_recipes')
      .select('recipe:recipes(*)')
      .eq('user_id', userId),
    supabase
      .from('recipes')
      .select('*')
      .eq('created_by', userId),
  ]);
  const saved = (savedRes.data ?? []).map((r: any) => r.recipe).filter(Boolean);
  const mine = mineRes.data ?? [];
  const map = new Map<string, Recipe>();
  for (const r of saved) map.set(r.id, r);
  for (const r of mine) map.set(r.id, r);
  return Array.from(map.values());
}

async function fetchRecipesInCollection(collectionId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('recipe_collection_items')
    .select('recipe_id')
    .eq('collection_id', collectionId);
  if (error) throw error;
  return (data ?? []).map((r: any) => r.recipe_id);
}

// ─── Shared checkbox row ─────────────────────────────────────────────

function CheckRow({
  label,
  checked,
  onToggle,
  sublabel,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
  sublabel?: string;
}) {
  return (
    <Pressable style={checkStyles.row} onPress={onToggle}>
      <View style={[checkStyles.box, checked && checkStyles.boxChecked]}>
        {checked && <Text style={checkStyles.tick}>✓</Text>}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={checkStyles.label} numberOfLines={1}>{label}</Text>
        {sublabel && <Text style={checkStyles.sublabel}>{sublabel}</Text>}
      </View>
    </Pressable>
  );
}

const checkStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
    gap: 14,
  },
  box: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxChecked: {
    backgroundColor: colors.sage,
    borderColor: colors.sage,
  },
  tick: {
    color: colors.card,
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
  },
  label: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: colors.ink,
  },
  sublabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: colors.muted,
    marginTop: 1,
  },
});

// ─── Pick-Albums mode ────────────────────────────────────────────────

function PickAlbumsContent({
  recipeId,
  userId,
  onClose,
}: {
  recipeId: string;
  userId: string;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: collections = [], isLoading: colLoading } = useQuery({
    queryKey: ['collections', userId],
    queryFn: () => fetchCollections(userId),
  });

  const { data: checkedIds = [], isLoading: checkLoading } = useQuery({
    queryKey: ['recipe-collections', recipeId],
    queryFn: () => fetchCollectionsForRecipe(recipeId),
  });

  const [localChecked, setLocalChecked] = useState<Set<string>>(new Set());

  useEffect(() => {
    setLocalChecked(new Set(checkedIds));
  }, [checkedIds]);

  function toggleAlbum(colId: string) {
    setLocalChecked(prev => {
      const next = new Set(prev);
      if (next.has(colId)) next.delete(colId);
      else next.add(colId);
      return next;
    });
  }

  async function createAndCheck() {
    if (!newName.trim()) return;
    const { data, error } = await supabase
      .from('recipe_collections')
      .insert({ user_id: userId, name: newName.trim() })
      .select()
      .single();
    if (error) { Alert.alert('Error', 'Could not create album.'); return; }
    setNewName('');
    queryClient.invalidateQueries({ queryKey: ['collections', userId] });
    setLocalChecked(prev => new Set([...prev, data.id]));
  }

  async function save() {
    setSaving(true);
    const toAdd = [...localChecked].filter(id => !checkedIds.includes(id));
    const toRemove = checkedIds.filter(id => !localChecked.has(id));

    const inserts = toAdd.map(collection_id => ({ collection_id, recipe_id: recipeId }));
    const tasks: Promise<any>[] = [];
    if (inserts.length) {
      tasks.push(supabase.from('recipe_collection_items').insert(inserts));
    }
    for (const collection_id of toRemove) {
      tasks.push(
        supabase
          .from('recipe_collection_items')
          .delete()
          .eq('collection_id', collection_id)
          .eq('recipe_id', recipeId),
      );
    }
    await Promise.all(tasks);
    queryClient.invalidateQueries({ queryKey: ['recipe-collections', recipeId] });
    queryClient.invalidateQueries({ queryKey: ['collection-items'] });
    queryClient.invalidateQueries({ queryKey: ['collection-counts', userId] });
    setSaving(false);
    onClose();
  }

  const isLoading = colLoading || checkLoading;

  return (
    <>
      <Text style={sheetStyles.title}>Add to album</Text>
      {isLoading ? (
        <ActivityIndicator color={colors.sage} style={{ marginVertical: 24 }} />
      ) : (
        <ScrollView style={{ maxHeight: 280 }} showsVerticalScrollIndicator={false}>
          {collections.map(col => (
            <CheckRow
              key={col.id}
              label={col.name}
              checked={localChecked.has(col.id)}
              onToggle={() => toggleAlbum(col.id)}
            />
          ))}
          <View style={sheetStyles.newRow}>
            <TextInput
              style={sheetStyles.newInput}
              placeholder="New album…"
              placeholderTextColor={colors.muted}
              value={newName}
              onChangeText={setNewName}
              returnKeyType="done"
              onSubmitEditing={createAndCheck}
            />
            {newName.trim().length > 0 && (
              <Pressable onPress={createAndCheck} hitSlop={8}>
                <Text style={sheetStyles.newAdd}>Add</Text>
              </Pressable>
            )}
          </View>
        </ScrollView>
      )}
      <Pressable
        style={[sheetStyles.doneBtn, saving && { opacity: 0.5 }]}
        onPress={save}
        disabled={saving}
      >
        <Text style={sheetStyles.doneBtnText}>{saving ? 'Saving…' : 'Done'}</Text>
      </Pressable>
    </>
  );
}

// ─── Pick-Recipes mode ───────────────────────────────────────────────

function PickRecipesContent({
  collectionId,
  userId,
  onClose,
}: {
  collectionId: string;
  userId: string;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: allRecipes = [], isLoading: recipesLoading } = useQuery({
    queryKey: ['all-recipes-for-user', userId],
    queryFn: () => fetchAllRecipesForUser(userId),
  });

  const { data: checkedIds = [], isLoading: checkLoading } = useQuery({
    queryKey: ['collection-items', collectionId],
    queryFn: () => fetchRecipesInCollection(collectionId),
  });

  const [localChecked, setLocalChecked] = useState<Set<string>>(new Set());

  useEffect(() => {
    setLocalChecked(new Set(checkedIds));
  }, [checkedIds]);

  function toggle(recipeId: string) {
    setLocalChecked(prev => {
      const next = new Set(prev);
      if (next.has(recipeId)) next.delete(recipeId);
      else next.add(recipeId);
      return next;
    });
  }

  const filtered = search.trim()
    ? allRecipes.filter(r => r.title.toLowerCase().includes(search.toLowerCase()))
    : allRecipes;

  async function save() {
    setSaving(true);
    const toAdd = [...localChecked].filter(id => !checkedIds.includes(id));
    const toRemove = checkedIds.filter(id => !localChecked.has(id));

    const inserts = toAdd.map(recipe_id => ({ collection_id: collectionId, recipe_id }));
    const tasks: Promise<any>[] = [];
    if (inserts.length) {
      tasks.push(supabase.from('recipe_collection_items').insert(inserts));
    }
    for (const recipe_id of toRemove) {
      tasks.push(
        supabase
          .from('recipe_collection_items')
          .delete()
          .eq('collection_id', collectionId)
          .eq('recipe_id', recipe_id),
      );
    }
    await Promise.all(tasks);
    queryClient.invalidateQueries({ queryKey: ['collection-items', collectionId] });
    setSaving(false);
    onClose();
  }

  const isLoading = recipesLoading || checkLoading;

  return (
    <>
      <Text style={sheetStyles.title}>Add recipes</Text>
      <TextInput
        style={sheetStyles.searchInput}
        placeholder="Search…"
        placeholderTextColor={colors.muted}
        value={search}
        onChangeText={setSearch}
        clearButtonMode="while-editing"
      />
      {isLoading ? (
        <ActivityIndicator color={colors.sage} style={{ marginVertical: 24 }} />
      ) : (
        <ScrollView style={{ maxHeight: 260 }} showsVerticalScrollIndicator={false}>
          {filtered.map(r => (
            <CheckRow
              key={r.id}
              label={r.title}
              checked={localChecked.has(r.id)}
              onToggle={() => toggle(r.id)}
              sublabel={r.created_by === userId ? 'Your recipe' : 'Saved'}
            />
          ))}
          {filtered.length === 0 && (
            <Text style={sheetStyles.empty}>No recipes found.</Text>
          )}
        </ScrollView>
      )}
      <Pressable
        style={[sheetStyles.doneBtn, saving && { opacity: 0.5 }]}
        onPress={save}
        disabled={saving}
      >
        <Text style={sheetStyles.doneBtnText}>{saving ? 'Saving…' : 'Done'}</Text>
      </Pressable>
    </>
  );
}

// ─── Shell ───────────────────────────────────────────────────────────

export function AlbumPickerSheet(props: AlbumPickerSheetProps) {
  const { visible, onClose } = props;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={sheetStyles.overlay} onPress={onClose}>
        <Pressable style={sheetStyles.sheet} onPress={(e) => e.stopPropagation()}>
          {props.mode === 'pick-albums' ? (
            <PickAlbumsContent
              recipeId={props.recipeId}
              userId={props.userId}
              onClose={onClose}
            />
          ) : (
            <PickRecipesContent
              collectionId={props.collectionId}
              userId={props.userId}
              onClose={onClose}
            />
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const sheetStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
    gap: 14,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 17,
    color: colors.ink,
  },
  newRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 10,
  },
  newInput: {
    flex: 1,
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: colors.ink,
  },
  newAdd: {
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
    color: colors.sage,
  },
  searchInput: {
    height: 36,
    backgroundColor: colors.bg,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: colors.ink,
    borderWidth: 1,
    borderColor: colors.border,
  },
  doneBtn: {
    backgroundColor: colors.sage,
    borderRadius: radius.pill,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 4,
  },
  doneBtnText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    color: colors.card,
  },
  empty: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: colors.muted,
    marginVertical: 16,
    textAlign: 'center',
  },
});
