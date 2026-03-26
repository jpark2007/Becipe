import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { RecipeCard } from '@/components/RecipeCard';
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

async function fetchByIngredients(ingredients: string[]) {
  if (!ingredients.length) return [];

  const { data, error } = await supabase.rpc('search_by_ingredients', {
    ingredient_list: ingredients.map(i => i.toLowerCase().trim()),
  });

  if (error) {
    // Fallback: manual query
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

export default function ExploreScreen() {
  const [sort, setSort] = useState<SortOption>('smart');
  const [cuisine, setCuisine] = useState<Cuisine>('All');
  const [searchText, setSearchText] = useState('');
  const [mode, setMode] = useState<'browse' | 'fridge'>('browse');
  const [fridgeInput, setFridgeInput] = useState('');
  const [fridgeIngredients, setFridgeIngredients] = useState<string[]>([]);

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

  function addFridgeIngredient() {
    const val = fridgeInput.trim().toLowerCase();
    if (val && !fridgeIngredients.includes(val)) {
      setFridgeIngredients(prev => [...prev, val]);
    }
    setFridgeInput('');
  }

  const smartLabel = getSmartSortLabel();

  return (
    <View style={{ flex: 1, backgroundColor: '#F8F4EE' }}>
      {/* Mode toggle */}
      <View style={{
        flexDirection: 'row',
        backgroundColor: '#EEE8DF',
        borderBottomWidth: 1,
        borderBottomColor: '#D5CCC0',
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 0,
        gap: 32,
      }}>
        <TouchableOpacity
          onPress={() => setMode('browse')}
          style={{ paddingBottom: 12 }}
        >
          <Text style={{
            fontFamily: 'DMMono_400Regular',
            fontSize: 12,
            letterSpacing: 1.5,
            textTransform: 'uppercase',
            color: mode === 'browse' ? '#1C1712' : '#A09590',
          }}>
            Browse
          </Text>
          {mode === 'browse' && (
            <View style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: 2,
              backgroundColor: '#C4622D',
            }} />
          )}
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setMode('fridge')}
          style={{ paddingBottom: 12 }}
        >
          <Text style={{
            fontFamily: 'DMMono_400Regular',
            fontSize: 12,
            letterSpacing: 1.5,
            textTransform: 'uppercase',
            color: mode === 'fridge' ? '#1C1712' : '#A09590',
          }}>
            My Fridge
          </Text>
          {mode === 'fridge' && (
            <View style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: 2,
              backgroundColor: '#C4622D',
            }} />
          )}
        </TouchableOpacity>
      </View>

      {mode === 'browse' ? (
        <FlatList
          data={recipes as any[]}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <RecipeCard recipe={item} showCreator />}
          contentContainerStyle={{ padding: 16 }}
          ListHeaderComponent={
            <View>
              {/* Search */}
              <TextInput
                style={{
                  borderBottomWidth: 1,
                  borderBottomColor: '#D5CCC0',
                  paddingHorizontal: 0,
                  paddingVertical: 10,
                  color: '#1C1712',
                  fontFamily: 'Lora_400Regular',
                  fontSize: 15,
                  marginBottom: 20,
                  backgroundColor: 'transparent',
                }}
                placeholder="Search recipes..."
                placeholderTextColor="#A09590"
                value={searchText}
                onChangeText={setSearchText}
              />

              {/* Sort chips */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', gap: 24, paddingRight: 16 }}>
                  {SORT_OPTIONS.map((opt) => (
                    <TouchableOpacity
                      key={opt.key}
                      onPress={() => setSort(opt.key)}
                      style={{ paddingBottom: 8 }}
                    >
                      <Text style={{
                        fontFamily: 'DMMono_400Regular',
                        fontSize: 11,
                        letterSpacing: 1.2,
                        textTransform: 'uppercase',
                        color: sort === opt.key ? '#C4622D' : '#A09590',
                      }}>
                        {opt.key === 'smart' ? smartLabel : opt.label}
                      </Text>
                      {sort === opt.key && (
                        <View style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          height: 1,
                          backgroundColor: '#C4622D',
                        }} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              {/* Cuisine chips */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
                <View style={{ flexDirection: 'row', gap: 24, paddingRight: 16 }}>
                  {CUISINES.map((c) => (
                    <TouchableOpacity
                      key={c}
                      onPress={() => setCuisine(c)}
                      style={{ paddingBottom: 8 }}
                    >
                      <Text style={{
                        fontFamily: 'DMMono_400Regular',
                        fontSize: 11,
                        letterSpacing: 1.2,
                        textTransform: 'uppercase',
                        color: cuisine === c ? '#C4622D' : '#A09590',
                      }}>
                        {c}
                      </Text>
                      {cuisine === c && (
                        <View style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          height: 1,
                          backgroundColor: '#C4622D',
                        }} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          }
          ListEmptyComponent={
            isLoading ? (
              <ActivityIndicator color="#C4622D" style={{ marginTop: 32 }} />
            ) : (
              <Text style={{
                color: '#A09590',
                textAlign: 'center',
                marginTop: 32,
                fontFamily: 'DMMono_400Regular',
                fontSize: 12,
                letterSpacing: 1,
              }}>
                No recipes found
              </Text>
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
                <Text style={{
                  color: '#C4622D',
                  fontFamily: 'DMMono_400Regular',
                  fontSize: 11,
                  letterSpacing: 0.8,
                  paddingHorizontal: 16,
                  paddingTop: 8,
                }}>
                  {item.match_count} of {item.total_ingredients} ingredients matched
                </Text>
              )}
              <RecipeCard recipe={item} showCreator />
            </View>
          )}
          contentContainerStyle={{ padding: 16 }}
          ListHeaderComponent={
            <View>
              <Text style={{
                fontFamily: 'CormorantGaramond_400Regular',
                fontSize: 26,
                color: '#1C1712',
                marginBottom: 6,
              }}>
                What's in my fridge?
              </Text>
              <Text style={{
                fontFamily: 'DMMono_400Regular',
                fontSize: 11,
                color: '#A09590',
                letterSpacing: 0.5,
                marginBottom: 20,
              }}>
                Add ingredients you have and we'll find matching recipes
              </Text>

              {/* Ingredient input */}
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16, alignItems: 'flex-end' }}>
                <TextInput
                  style={{
                    flex: 1,
                    borderBottomWidth: 1,
                    borderBottomColor: '#D5CCC0',
                    paddingVertical: 10,
                    color: '#1C1712',
                    fontFamily: 'Lora_400Regular',
                    fontSize: 15,
                    backgroundColor: 'transparent',
                  }}
                  placeholder="Add ingredient..."
                  placeholderTextColor="#A09590"
                  value={fridgeInput}
                  onChangeText={setFridgeInput}
                  onSubmitEditing={addFridgeIngredient}
                  returnKeyType="done"
                />
                <TouchableOpacity
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderWidth: 1,
                    borderColor: '#C4622D',
                  }}
                  onPress={addFridgeIngredient}
                >
                  <Text style={{
                    fontFamily: 'DMMono_400Regular',
                    fontSize: 11,
                    letterSpacing: 1.2,
                    textTransform: 'uppercase',
                    color: '#C4622D',
                  }}>
                    Add
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Ingredient chips */}
              {fridgeIngredients.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
                  <View style={{ flexDirection: 'row', gap: 8, paddingRight: 16 }}>
                    {fridgeIngredients.map((ing) => (
                      <TouchableOpacity
                        key={ing}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          backgroundColor: '#F8F4EE',
                          borderWidth: 1,
                          borderColor: '#BEB0A8',
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          gap: 6,
                        }}
                        onPress={() => setFridgeIngredients(prev => prev.filter(i => i !== ing))}
                      >
                        <Text style={{
                          fontFamily: 'DMMono_400Regular',
                          fontSize: 11,
                          letterSpacing: 0.8,
                          color: '#1C1712',
                        }}>
                          {ing}
                        </Text>
                        <Text style={{
                          fontFamily: 'DMMono_400Regular',
                          fontSize: 13,
                          color: '#A09590',
                        }}>
                          ×
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              )}

              {fridgeLoading && <ActivityIndicator color="#C4622D" style={{ marginBottom: 16 }} />}
            </View>
          }
          ListEmptyComponent={
            fridgeIngredients.length === 0 ? null : (
              <Text style={{
                color: '#A09590',
                textAlign: 'center',
                marginTop: 16,
                fontFamily: 'DMMono_400Regular',
                fontSize: 12,
                letterSpacing: 1,
              }}>
                No recipes found with those ingredients
              </Text>
            )
          }
        />
      )}
    </View>
  );
}
