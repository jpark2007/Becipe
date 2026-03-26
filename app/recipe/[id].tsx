import { useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';
import { RatingDisplay } from '@/components/RatingDisplay';
import type { Ingredient, Step, Tip } from '@/lib/database.types';

async function fetchRecipe(id: string) {
  const { data, error } = await supabase
    .from('recipes')
    .select(`
      *,
      creator:profiles!created_by(id, display_name, username, avatar_url),
      tries:recipe_tries(rating, note, photo_url, user_id, tried_at,
        author:profiles!user_id(display_name, username, avatar_url)
      )
    `)
    .eq('id', id)
    .single();

  if (error) throw error;

  const ratings = (data.tries ?? []).map((t: any) => t.rating).filter(Boolean);
  return {
    ...data,
    avg_rating: ratings.length ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length : null,
    try_count: ratings.length,
  };
}

const DIFFICULTY_LABEL: Record<string, string> = { easy: 'Easy', medium: 'Medium', hard: 'Challenging' };
const DIFFICULTY_COLOR: Record<string, string> = { easy: '#22c55e', medium: '#eab308', hard: '#ef4444' };

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [tipsOpen, setTipsOpen] = useState(false);

  const { data: recipe, isLoading } = useQuery({
    queryKey: ['recipe', id],
    queryFn: () => fetchRecipe(id),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('saved_recipes').insert({
        user_id: user!.id,
        recipe_id: id,
      });
      if (error && error.code !== '23505') throw error;
    },
    onSuccess: () => Alert.alert('Saved!', 'Recipe added to your saves.'),
  });

  if (isLoading || !recipe) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F8F4EE', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#C4622D" />
      </View>
    );
  }

  const totalTime = (recipe.prep_time_min ?? 0) + (recipe.cook_time_min ?? 0);

  return (
    <View style={{ flex: 1, backgroundColor: '#F8F4EE' }}>
      <ScrollView>
        {recipe.cover_image_url && (
          <Image
            source={{ uri: recipe.cover_image_url }}
            style={{ width: '100%', height: 250 }}
            resizeMode="cover"
          />
        )}

        <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16 }}>
          {/* Cuisine label */}
          {recipe.cuisine && (
            <Text style={{
              fontFamily: 'DMMono_400Regular',
              fontSize: 10,
              letterSpacing: 2.5,
              textTransform: 'uppercase',
              color: '#C4622D',
              marginBottom: 8,
            }}>
              {recipe.cuisine}
            </Text>
          )}

          {/* Title */}
          <Text style={{
            fontFamily: 'CormorantGaramond_600SemiBold',
            fontSize: 36,
            color: '#1C1712',
            lineHeight: 42,
            marginBottom: 12,
          }}>
            {recipe.title}
          </Text>

          {/* Meta row */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 16, alignItems: 'center' }}>
            {recipe.avg_rating !== null && (
              <RatingDisplay rating={recipe.avg_rating} showCount tryCount={recipe.try_count} />
            )}
            {totalTime > 0 && (
              <Text style={{
                fontFamily: 'DMMono_400Regular',
                fontSize: 11,
                color: '#7A6E64',
                letterSpacing: 0.5,
              }}>
                {totalTime} min total
              </Text>
            )}
            {recipe.servings && (
              <Text style={{
                fontFamily: 'DMMono_400Regular',
                fontSize: 11,
                color: '#7A6E64',
                letterSpacing: 0.5,
              }}>
                Serves {recipe.servings}
              </Text>
            )}
            {recipe.difficulty && (
              <Text style={{
                fontFamily: 'DMMono_400Regular',
                fontSize: 11,
                letterSpacing: 0.5,
                color: DIFFICULTY_COLOR[recipe.difficulty],
              }}>
                {DIFFICULTY_LABEL[recipe.difficulty]}
              </Text>
            )}
          </View>

          {/* Description */}
          {recipe.description && (
            <Text style={{
              fontFamily: 'Lora_400Regular',
              fontSize: 14,
              color: '#7A6E64',
              lineHeight: 22,
              marginBottom: 24,
            }}>
              {recipe.description}
            </Text>
          )}

          {/* Action buttons */}
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 32 }}>
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: '#C4622D',
                paddingVertical: 14,
                alignItems: 'center',
              }}
              onPress={() => router.push(`/recipe/${id}/cook`)}
            >
              <Text style={{
                fontFamily: 'DMMono_400Regular',
                fontSize: 11,
                letterSpacing: 2,
                textTransform: 'uppercase',
                color: '#EDE8DC',
              }}>
                Start Cooking
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                flex: 1,
                borderWidth: 1,
                borderColor: '#C4622D',
                paddingVertical: 14,
                alignItems: 'center',
              }}
              onPress={() => router.push(`/try/${id}`)}
            >
              <Text style={{
                fontFamily: 'DMMono_400Regular',
                fontSize: 11,
                letterSpacing: 2,
                textTransform: 'uppercase',
                color: '#C4622D',
              }}>
                Log a Try
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                paddingHorizontal: 16,
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onPress={() => saveMutation.mutate()}
            >
              <Text style={{
                fontFamily: 'DMMono_400Regular',
                fontSize: 11,
                letterSpacing: 1,
                color: '#7A6E64',
              }}>
                Save
              </Text>
            </TouchableOpacity>
          </View>

          {/* Ingredients section */}
          <View style={{
            borderTopWidth: 1,
            borderTopColor: '#D5CCC0',
            paddingTop: 16,
            marginBottom: 8,
          }}>
            <Text style={{
              fontFamily: 'DMMono_400Regular',
              fontSize: 10,
              letterSpacing: 2.5,
              textTransform: 'uppercase',
              color: '#7A6E64',
              marginBottom: 12,
            }}>
              Ingredients
            </Text>
          </View>
          {(recipe.ingredients as Ingredient[]).map((ing, i) => (
            <View key={i} style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: '#D5CCC0',
            }}>
              <Text style={{
                fontFamily: 'DMMono_500Medium',
                fontSize: 13,
                color: '#C4622D',
                width: 72,
              }}>
                {ing.amount}{ing.unit ? ` ${ing.unit}` : ''}
              </Text>
              <Text style={{
                fontFamily: 'Lora_400Regular',
                fontSize: 15,
                color: '#1C1712',
                flex: 1,
              }}>
                {ing.name}
              </Text>
            </View>
          ))}

          {/* Instructions section */}
          <View style={{
            borderTopWidth: 1,
            borderTopColor: '#D5CCC0',
            paddingTop: 16,
            marginTop: 24,
            marginBottom: 8,
          }}>
            <Text style={{
              fontFamily: 'DMMono_400Regular',
              fontSize: 10,
              letterSpacing: 2.5,
              textTransform: 'uppercase',
              color: '#7A6E64',
              marginBottom: 16,
            }}>
              Instructions
            </Text>
          </View>
          {(recipe.steps as Step[]).map((step, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: 16, marginBottom: 20 }}>
              <View style={{
                width: 26,
                height: 26,
                borderWidth: 1,
                borderColor: '#C4622D',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                marginTop: 2,
              }}>
                <Text style={{
                  fontFamily: 'DMMono_500Medium',
                  fontSize: 11,
                  color: '#C4622D',
                }}>
                  {step.order}
                </Text>
              </View>
              <Text style={{
                fontFamily: 'Lora_400Regular',
                fontSize: 15,
                color: '#1C1712',
                flex: 1,
                lineHeight: 24,
              }}>
                {step.instruction}
              </Text>
            </View>
          ))}

          {/* Tips section */}
          {(recipe.tips as Tip[]).length > 0 && (
            <View style={{ marginTop: 8 }}>
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingVertical: 16,
                  borderTopWidth: 1,
                  borderTopColor: '#D5CCC0',
                }}
                onPress={() => setTipsOpen(o => !o)}
              >
                <Text style={{
                  fontFamily: 'DMMono_400Regular',
                  fontSize: 10,
                  letterSpacing: 2.5,
                  textTransform: 'uppercase',
                  color: '#7A6E64',
                }}>
                  Tips & Notes
                </Text>
                <Text style={{
                  fontFamily: 'DMMono_400Regular',
                  fontSize: 11,
                  color: '#7A6E64',
                }}>
                  {tipsOpen ? '▲' : '▼'}
                </Text>
              </TouchableOpacity>
              {tipsOpen && (recipe.tips as Tip[]).map((tip, i) => (
                <Text key={i} style={{
                  fontFamily: 'Lora_400Regular',
                  fontSize: 14,
                  color: '#7A6E64',
                  lineHeight: 22,
                  marginBottom: 10,
                }}>
                  {tip.text}
                </Text>
              ))}
            </View>
          )}

          {/* Source credit */}
          {(recipe.source_credit || recipe.source_name) && (
            <Text style={{
              fontFamily: 'DMMono_400Regular',
              fontSize: 10,
              color: '#7A6E64',
              letterSpacing: 0.5,
              marginTop: 24,
              textAlign: 'center',
            }}>
              {recipe.source_credit ? `${recipe.source_credit}` : ''}
              {recipe.source_name ? ` · ${recipe.source_name}` : ''}
            </Text>
          )}

          {/* Recent tries */}
          {recipe.tries?.length > 0 && (
            <View style={{ marginTop: 32 }}>
              <View style={{
                borderTopWidth: 1,
                borderTopColor: '#D5CCC0',
                paddingTop: 16,
                marginBottom: 16,
              }}>
                <Text style={{
                  fontFamily: 'DMMono_400Regular',
                  fontSize: 10,
                  letterSpacing: 2.5,
                  textTransform: 'uppercase',
                  color: '#7A6E64',
                }}>
                  Recent Tries
                </Text>
              </View>
              {recipe.tries.slice(0, 5).map((t: any, i: number) => (
                <View key={i} style={{
                  backgroundColor: '#EEE8DF',
                  borderWidth: 1,
                  borderColor: '#D5CCC0',
                  padding: 16,
                  marginBottom: 8,
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <View style={{
                      width: 26,
                      height: 26,
                      backgroundColor: '#C4622D',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <Text style={{
                        fontFamily: 'CormorantGaramond_600SemiBold',
                        fontSize: 14,
                        color: '#EDE8DC',
                      }}>
                        {t.author?.display_name?.[0]?.toUpperCase()}
                      </Text>
                    </View>
                    <Text style={{
                      fontFamily: 'DMMono_400Regular',
                      fontSize: 12,
                      color: '#1C1712',
                      flex: 1,
                    }}>
                      {t.author?.display_name}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 2 }}>
                      <Text style={{
                        fontFamily: 'DMMono_500Medium',
                        fontSize: 15,
                        color: '#C4622D',
                      }}>
                        {Number(t.rating).toFixed(1)}
                      </Text>
                      <Text style={{
                        fontFamily: 'DMMono_400Regular',
                        fontSize: 10,
                        color: '#7A6E64',
                      }}>
                        /10
                      </Text>
                    </View>
                  </View>
                  {t.note && (
                    <Text style={{
                      fontFamily: 'Lora_400Regular',
                      fontSize: 14,
                      color: '#7A6E64',
                      lineHeight: 21,
                    }}>
                      {t.note}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
