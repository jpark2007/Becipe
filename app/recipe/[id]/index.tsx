import { useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';
import { RatingDisplay } from '@/components/RatingDisplay';
import { COLORS, FONTS } from '@/lib/theme';
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
      <View style={{ flex: 1, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={COLORS.primaryContainer} />
      </View>
    );
  }

  const totalTime = (recipe.prep_time_min ?? 0) + (recipe.cook_time_min ?? 0);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.surface }}>
      <ScrollView>
        {/* Full-bleed hero with gradient overlay */}
        {recipe.cover_image_url && (
          <View style={styles.heroContainer}>
            <Image
              source={{ uri: recipe.cover_image_url }}
              style={styles.heroImage}
              resizeMode="cover"
            />
            <View style={styles.heroContent}>
              {recipe.cuisine && (
                <Text style={styles.heroCuisineTag}>{recipe.cuisine.toUpperCase()}</Text>
              )}
              <Text style={styles.heroTitle}>{recipe.title}</Text>
              <View style={styles.heroMeta}>
                {totalTime > 0 && (
                  <Text style={styles.heroMetaItem}>{totalTime} MIN</Text>
                )}
                {recipe.difficulty && (
                  <Text style={styles.heroMetaItem}>
                    {recipe.difficulty.toUpperCase()}
                  </Text>
                )}
                {recipe.avg_rating !== null && (
                  <Text style={styles.heroRating}>{recipe.avg_rating.toFixed(1)}/10</Text>
                )}
              </View>
            </View>
          </View>
        )}

        <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16 }}>
          {/* If no cover image, show title here */}
          {!recipe.cover_image_url && (
            <>
              {recipe.cuisine && (
                <Text style={{
                  fontFamily: FONTS.mono,
                  fontSize: 10,
                  letterSpacing: 2.5,
                  textTransform: 'uppercase',
                  color: COLORS.primary,
                  marginBottom: 8,
                }}>
                  {recipe.cuisine}
                </Text>
              )}
              <Text style={{
                fontFamily: FONTS.headlineBold,
                fontSize: 36,
                color: COLORS.onSurface,
                lineHeight: 42,
                marginBottom: 12,
              }}>
                {recipe.title}
              </Text>
            </>
          )}

          {/* Meta row (when no hero) */}
          {recipe.cover_image_url === null && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 16, alignItems: 'center' }}>
              {recipe.avg_rating !== null && (
                <RatingDisplay rating={recipe.avg_rating} showCount tryCount={recipe.try_count} />
              )}
              {totalTime > 0 && (
                <Text style={{ fontFamily: FONTS.mono, fontSize: 11, color: COLORS.onSurfaceVariant, letterSpacing: 0.5 }}>
                  {totalTime} min total
                </Text>
              )}
              {recipe.servings && (
                <Text style={{ fontFamily: FONTS.mono, fontSize: 11, color: COLORS.onSurfaceVariant, letterSpacing: 0.5 }}>
                  Serves {recipe.servings}
                </Text>
              )}
              {recipe.difficulty && (
                <Text style={{ fontFamily: FONTS.mono, fontSize: 11, letterSpacing: 0.5, color: DIFFICULTY_COLOR[recipe.difficulty] }}>
                  {DIFFICULTY_LABEL[recipe.difficulty]}
                </Text>
              )}
            </View>
          )}

          {/* Servings/rating meta below hero */}
          {recipe.cover_image_url && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 16, marginTop: 8, alignItems: 'center' }}>
              {recipe.avg_rating !== null && (
                <RatingDisplay rating={recipe.avg_rating} showCount tryCount={recipe.try_count} />
              )}
              {recipe.servings && (
                <Text style={{ fontFamily: FONTS.mono, fontSize: 11, color: COLORS.onSurfaceVariant, letterSpacing: 0.5 }}>
                  Serves {recipe.servings}
                </Text>
              )}
              {recipe.difficulty && (
                <Text style={{ fontFamily: FONTS.mono, fontSize: 11, letterSpacing: 0.5, color: DIFFICULTY_COLOR[recipe.difficulty] }}>
                  {DIFFICULTY_LABEL[recipe.difficulty]}
                </Text>
              )}
            </View>
          )}

          {/* Description */}
          {recipe.description && (
            <Text style={{
              fontFamily: FONTS.body,
              fontSize: 14,
              color: COLORS.onSurfaceVariant,
              lineHeight: 22,
              marginBottom: 24,
            }}>
              {recipe.description}
            </Text>
          )}

          {/* Action buttons */}
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 32 }}>
            <TouchableOpacity
              style={styles.startCookingButton}
              onPress={() => router.push(`/recipe/${id}/cook`)}
            >
              <Text style={styles.startCookingText}>Start Cooking</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.logTryButton}
              onPress={() => router.push(`/try/${id}`)}
            >
              <Text style={styles.logTryText}>Log a Try</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' }}
              onPress={() => saveMutation.mutate()}
            >
              <Text style={{ fontFamily: FONTS.mono, fontSize: 11, letterSpacing: 1, color: COLORS.onSurfaceVariant }}>
                Save
              </Text>
            </TouchableOpacity>
          </View>

          {/* Ingredients section */}
          <View style={{ borderTopWidth: 1, borderTopColor: COLORS.outlineVariant + '33', paddingTop: 16, marginBottom: 8 }}>
            <Text style={{
              fontFamily: FONTS.mono,
              fontSize: 10,
              letterSpacing: 2.5,
              textTransform: 'uppercase',
              color: COLORS.onSurfaceVariant,
              marginBottom: 12,
            }}>
              Ingredients
            </Text>
          </View>
          {(recipe.ingredients as Ingredient[]).map((ing, i) => (
            <View key={i} style={styles.ingredientRow}>
              <Text style={styles.ingredientAmount}>
                {ing.amount}{ing.unit ? ` ${ing.unit}` : ''}
              </Text>
              <Text style={styles.ingredientName}>{ing.name}</Text>
            </View>
          ))}

          {/* Instructions section */}
          <View style={{ borderTopWidth: 1, borderTopColor: COLORS.outlineVariant + '33', paddingTop: 16, marginTop: 24, marginBottom: 8 }}>
            <Text style={{
              fontFamily: FONTS.mono,
              fontSize: 10,
              letterSpacing: 2.5,
              textTransform: 'uppercase',
              color: COLORS.onSurfaceVariant,
              marginBottom: 16,
            }}>
              Instructions
            </Text>
          </View>
          {(recipe.steps as Step[]).map((step, i) => (
            <View key={i} style={styles.stepRow}>
              <Text style={styles.stepNumber}>{step.order}</Text>
              <Text style={styles.stepInstruction}>{step.instruction}</Text>
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
                  borderTopColor: COLORS.outlineVariant + '33',
                }}
                onPress={() => setTipsOpen(o => !o)}
              >
                <Text style={{ fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 2.5, textTransform: 'uppercase', color: COLORS.onSurfaceVariant }}>
                  Tips & Notes
                </Text>
                <Text style={{ fontFamily: FONTS.mono, fontSize: 11, color: COLORS.onSurfaceVariant }}>
                  {tipsOpen ? '▲' : '▼'}
                </Text>
              </TouchableOpacity>
              {tipsOpen && (recipe.tips as Tip[]).map((tip, i) => (
                <Text key={i} style={{ fontFamily: FONTS.body, fontSize: 14, color: COLORS.onSurfaceVariant, lineHeight: 22, marginBottom: 10 }}>
                  {tip.text}
                </Text>
              ))}
            </View>
          )}

          {/* Source credit */}
          {(recipe.source_credit || recipe.source_name) && (
            <Text style={{ fontFamily: FONTS.mono, fontSize: 10, color: COLORS.onSurfaceVariant, letterSpacing: 0.5, marginTop: 24, textAlign: 'center' }}>
              {recipe.source_credit ? `${recipe.source_credit}` : ''}
              {recipe.source_name ? ` · ${recipe.source_name}` : ''}
            </Text>
          )}

          {/* Recent tries */}
          {recipe.tries?.length > 0 && (
            <View style={{ marginTop: 32 }}>
              <View style={{ borderTopWidth: 1, borderTopColor: COLORS.outlineVariant + '33', paddingTop: 16, marginBottom: 16 }}>
                <Text style={{ fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 2.5, textTransform: 'uppercase', color: COLORS.onSurfaceVariant }}>
                  Recent Tries
                </Text>
              </View>
              {recipe.tries.slice(0, 5).map((t: any, i: number) => (
                <View key={i} style={{
                  backgroundColor: COLORS.surfaceContainer,
                  borderRadius: 4,
                  padding: 16,
                  marginBottom: 8,
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <View style={{
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      backgroundColor: COLORS.primaryContainer,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <Text style={{ fontFamily: FONTS.bodyBold, fontSize: 12, color: COLORS.onPrimary }}>
                        {t.author?.display_name?.[0]?.toUpperCase()}
                      </Text>
                    </View>
                    <Text style={{ fontFamily: FONTS.bodySemiBold, fontSize: 13, color: COLORS.onSurface, flex: 1 }}>
                      {t.author?.display_name}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 2 }}>
                      <Text style={{ fontFamily: FONTS.monoMedium, fontSize: 15, color: COLORS.primary }}>
                        {Number(t.rating).toFixed(1)}
                      </Text>
                      <Text style={{ fontFamily: FONTS.mono, fontSize: 10, color: COLORS.onSurfaceVariant }}>
                        /10
                      </Text>
                    </View>
                  </View>
                  {t.note && (
                    <Text style={{ fontFamily: FONTS.body, fontSize: 14, color: COLORS.onSurfaceVariant, lineHeight: 21, fontStyle: 'italic' }}>
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

const styles = StyleSheet.create({
  heroContainer: {
    position: 'relative',
    width: '100%',
    height: 420,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    paddingBottom: 28,
    backgroundColor: 'rgba(27,28,25,0.72)',
  },
  heroCuisineTag: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    letterSpacing: 2,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontFamily: FONTS.headlineBold,
    fontSize: 36,
    color: '#ffffff',
    lineHeight: 42,
    marginBottom: 12,
  },
  heroMeta: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  heroMetaItem: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1,
  },
  heroRating: {
    fontFamily: FONTS.monoMedium,
    fontSize: 13,
    color: COLORS.primaryFixed,
  },
  startCookingButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 2,
  },
  startCookingText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: COLORS.onPrimary,
  },
  logTryButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 2,
  },
  logTryText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: COLORS.primary,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.outlineVariant + '33',
  },
  ingredientAmount: {
    fontFamily: FONTS.monoMedium,
    fontSize: 12,
    color: COLORS.primary,
    width: 80,
    textTransform: 'uppercase',
  },
  ingredientName: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.onSurface,
    flex: 1,
    lineHeight: 22,
  },
  stepRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 28,
  },
  stepNumber: {
    fontFamily: FONTS.headlineBold,
    fontSize: 32,
    color: COLORS.secondaryFixedDim,
    lineHeight: 36,
    minWidth: 36,
  },
  stepInstruction: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.onSurface,
    flex: 1,
    lineHeight: 24,
    paddingTop: 4,
  },
});
