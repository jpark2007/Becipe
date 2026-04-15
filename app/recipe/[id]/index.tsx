import { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  Pressable,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { colors, radius, shadow } from '@/lib/theme';
import { Plate } from '@/components/Plate';
import { EditorialHeading } from '@/components/EditorialHeading';
import { matchScore, parsePalate } from '@/lib/palate';
import { useAuthStore } from '@/store/auth';
import type { Ingredient, Tip } from '@/lib/database.types';

async function fetchRecipe(id: string) {
  const { data, error } = await supabase
    .from('recipes')
    .select(`
      *,
      palate_vector,
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
    avg_rating: ratings.length
      ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length
      : null,
    try_count: ratings.length,
  };
}

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const userPalate = useAuthStore(s => s.profile?.palate_vector ?? null);
  const [isSaved, setIsSaved] = useState(false);
  const [tipsOpen, setTipsOpen] = useState(false);

  const { data: recipe, isLoading } = useQuery({
    queryKey: ['recipe', id],
    queryFn: () => fetchRecipe(id),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase.from('saved_recipes') as any).insert({
        user_id: user!.id,
        recipe_id: id,
      });
      if (error && error.code !== '23505') throw error;
    },
    onSuccess: () => {
      setIsSaved(true);
      Alert.alert('Saved!', 'Recipe added to your saves.');
    },
  });

  if (isLoading || !recipe) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bone, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.clay} />
      </View>
    );
  }

  const score = matchScore(parsePalate(userPalate), parsePalate(recipe.palate_vector));
  const ingredients = ((recipe.ingredients as Ingredient[]) || []);
  const tips = ((recipe.tips as Tip[]) || []);
  const totalTime = (recipe.prep_time_min ?? 0) + (recipe.cook_time_min ?? 0);
  const titleWords = (recipe.title ?? '').split(' ');
  const emphasisWord = titleWords.slice(-1)[0] ?? '';
  const titleLead = titleWords.slice(0, -1).join(' ') + (titleWords.length > 1 ? '\n' : '');

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 60 }}>
        {/* Header buttons */}
        <View style={styles.head}>
          <Pressable style={styles.iconBtn} onPress={() => router.back()}>
            <Text style={styles.iconText}>←</Text>
          </Pressable>
          <Pressable
            style={styles.iconBtn}
            onPress={() => saveMutation.mutate()}
          >
            <Text style={[styles.iconText, isSaved && { color: colors.clay }]}>
              {isSaved ? '♥' : '♡'}
            </Text>
          </Pressable>
        </View>

        <Text style={styles.eyebrow}>
          {(recipe.cuisine || 'recipe').toUpperCase()} · CANONICAL
        </Text>

        {/* Hero card */}
        <View style={styles.hero}>
          <EditorialHeading size={32} emphasis={emphasisWord} emphasisColor="ink">
            {titleLead}
          </EditorialHeading>
          <View style={styles.byline}>
            <View style={styles.miniAv}>
              <Text style={styles.miniAvText}>
                {recipe.creator?.display_name?.charAt(0).toUpperCase() ?? '?'}
              </Text>
            </View>
            <Text style={styles.bylineText}>
              by{' '}
              <Text style={{ color: colors.ink, fontFamily: 'Inter_700Bold' }}>
                {recipe.creator?.display_name?.toLowerCase() ?? 'someone'}
              </Text>
            </Text>
          </View>
          <View style={styles.statRow}>
            <Stat dot="sage" text={`${totalTime || '-'} min`} />
            <Stat dot="clay" text={`serves ${recipe.servings ?? '-'}`} />
            <Stat dot="ochre" text={recipe.difficulty ?? 'easy'} />
          </View>
          <View style={styles.heroPlate}>
            <Plate uri={recipe.cover_image_url} size={170} />
          </View>
        </View>

        {/* Score card */}
        {score != null && (
          <View style={styles.scoreCard}>
            <Text style={styles.scoreLabel}>PALATE MATCH · FOR YOU</Text>
            <Text style={styles.scoreBig}>
              {score}
              <Text style={styles.pct}>%</Text>
            </Text>
            <Text style={styles.why}>
              Based on your palate vector. Adjust anytime in your profile.
            </Text>
          </View>
        )}

        {/* Average rating (if any tries) */}
        {recipe.avg_rating != null && (
          <View style={styles.avgCard}>
            <Text style={styles.avgLabel}>AVG RATING · {recipe.try_count} TRIES</Text>
            <Text style={styles.avgBig}>
              {Number(recipe.avg_rating).toFixed(1)}
              <Text style={styles.avgOf}> / 10</Text>
            </Text>
          </View>
        )}

        {/* Ingredients */}
        <View style={styles.sectionH}>
          <Text style={styles.sectionTitle}>Ingredients</Text>
          <Text style={styles.count}>{ingredients.length} items</Text>
        </View>
        <View style={{ gap: 10, marginBottom: 22 }}>
          {ingredients.slice(0, 6).map((ing, i) => (
            <View key={i} style={styles.ingItem}>
              <Plate uri={recipe.cover_image_url} size={44} />
              <Text style={styles.ingName}>{ing.name}</Text>
              <Text style={styles.ingQ}>
                {ing.amount}
                {ing.unit ? ` ${ing.unit}` : ''}
              </Text>
            </View>
          ))}
          {ingredients.length > 6 && (
            <Text style={styles.moreText}>+ {ingredients.length - 6} more in cook mode</Text>
          )}
        </View>

        {/* Start cooking CTA */}
        <Pressable
          style={styles.cookBtn}
          onPress={() => router.push(`/recipe/${id}/cook`)}
        >
          <Text style={styles.cookBtnText}>start cooking →</Text>
        </Pressable>

        {/* Log a try secondary CTA */}
        <Pressable
          style={styles.tryBtn}
          onPress={() => router.push(`/try/${id}`)}
        >
          <Text style={styles.tryBtnText}>log a try</Text>
        </Pressable>

        {/* Tips accordion */}
        {tips.length > 0 && (
          <View style={styles.tipsWrap}>
            <Pressable
              style={styles.tipsHead}
              onPress={() => setTipsOpen(o => !o)}
            >
              <Text style={styles.sectionTitle}>Tips & Notes</Text>
              <Text style={styles.tipsChev}>{tipsOpen ? '▲' : '▼'}</Text>
            </Pressable>
            {tipsOpen &&
              tips.map((tip, i) => (
                <Text key={i} style={styles.tipText}>
                  {tip.text}
                </Text>
              ))}
          </View>
        )}

        {/* Recent tries */}
        {recipe.tries?.length > 0 && (
          <View style={{ marginTop: 28 }}>
            <View style={styles.sectionH}>
              <Text style={styles.sectionTitle}>Recent Tries</Text>
              <Text style={styles.count}>{recipe.tries.length}</Text>
            </View>
            <View style={{ gap: 10 }}>
              {recipe.tries.slice(0, 5).map((t: any, i: number) => (
                <View key={i} style={styles.tryCard}>
                  <View style={styles.tryHead}>
                    <View style={styles.tryAv}>
                      <Text style={styles.tryAvText}>
                        {t.author?.display_name?.[0]?.toUpperCase() ?? '?'}
                      </Text>
                    </View>
                    <Text style={styles.tryName}>{t.author?.display_name}</Text>
                    <Text style={styles.tryRating}>
                      {Number(t.rating).toFixed(1)}
                      <Text style={styles.tryRatingOf}> /10</Text>
                    </Text>
                  </View>
                  {t.note && <Text style={styles.tryNote}>{t.note}</Text>}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Source credit */}
        {(recipe.source_credit || recipe.source_name) && (
          <Text style={styles.source}>
            {recipe.source_credit ? recipe.source_credit : ''}
            {recipe.source_name ? ` · ${recipe.source_name}` : ''}
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ dot, text }: { dot: 'sage' | 'clay' | 'ochre'; text: string }) {
  const dotColor = { sage: colors.sage, clay: colors.clay, ochre: colors.ochre }[dot];
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: dotColor }} />
      <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 11, color: colors.muted }}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bone },
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 14,
    paddingBottom: 26,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.cta,
  },
  iconText: { fontSize: 18, color: colors.ink },
  eyebrow: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    color: colors.sage,
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  hero: {
    backgroundColor: colors.card,
    borderRadius: 26,
    paddingVertical: 26,
    paddingLeft: 24,
    paddingRight: 150,
    minHeight: 220,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative',
    overflow: 'visible',
    ...shadow.card,
  },
  byline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    marginBottom: 14,
  },
  miniAv: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.avJ,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniAvText: { fontFamily: 'Inter_700Bold', fontSize: 10, color: '#F5E9D3' },
  bylineText: { fontFamily: 'Inter_500Medium', fontSize: 11, color: colors.muted },
  statRow: { flexDirection: 'row', gap: 14 },
  heroPlate: {
    position: 'absolute',
    top: '50%',
    right: -30,
    marginTop: -90,
  },
  scoreCard: {
    backgroundColor: colors.sageSoft,
    borderRadius: 22,
    padding: 22,
    marginBottom: 16,
  },
  scoreLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    color: colors.sage,
    letterSpacing: 1.2,
  },
  scoreBig: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 56,
    color: colors.sage,
    letterSpacing: -2.4,
    lineHeight: 56,
    marginVertical: 4,
  },
  pct: { fontFamily: 'Inter_600SemiBold', fontSize: 22, color: colors.sage },
  why: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: colors.inkSoft,
    lineHeight: 18,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(74,107,62,0.2)',
  },
  avgCard: {
    backgroundColor: colors.ochreSoft,
    borderRadius: 18,
    padding: 18,
    marginBottom: 22,
  },
  avgLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    color: colors.ochre,
    letterSpacing: 1.2,
  },
  avgBig: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 32,
    color: colors.ochre,
    letterSpacing: -1,
    marginTop: 4,
  },
  avgOf: { fontFamily: 'Inter_600SemiBold', fontSize: 16, color: colors.ochre },
  sectionH: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    color: colors.ink,
    letterSpacing: -0.2,
  },
  count: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    color: colors.ochre,
    backgroundColor: colors.ochreSoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  ingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ingName: { flex: 1, fontFamily: 'Inter_600SemiBold', fontSize: 13, color: colors.ink },
  ingQ: { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: colors.muted, paddingRight: 8 },
  moreText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: colors.muted,
    textAlign: 'center',
    marginTop: 4,
  },
  cookBtn: {
    backgroundColor: colors.clay,
    borderRadius: 999,
    paddingVertical: 17,
    alignItems: 'center',
    ...shadow.cta,
  },
  cookBtnText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    color: '#fff',
    letterSpacing: -0.1,
  },
  tryBtn: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  tryBtnText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
    color: colors.ink,
    letterSpacing: -0.1,
  },
  tipsWrap: {
    marginTop: 28,
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tipsHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tipsChev: { fontFamily: 'Inter_500Medium', fontSize: 11, color: colors.muted },
  tipText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: colors.inkSoft,
    lineHeight: 20,
    marginTop: 10,
  },
  tryCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tryHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  tryAv: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.avS,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tryAvText: { fontFamily: 'Inter_700Bold', fontSize: 11, color: '#F5E9D3' },
  tryName: {
    flex: 1,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: colors.ink,
  },
  tryRating: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    color: colors.ochre,
  },
  tryRatingOf: {
    fontFamily: 'Inter_500Medium',
    fontSize: 10,
    color: colors.muted,
  },
  tryNote: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: colors.inkSoft,
    lineHeight: 20,
  },
  source: {
    fontFamily: 'Inter_500Medium',
    fontSize: 10,
    color: colors.muted,
    letterSpacing: 0.5,
    marginTop: 24,
    textAlign: 'center',
  },
});
