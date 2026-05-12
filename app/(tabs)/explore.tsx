import { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Pressable,
  StyleSheet,
  TextInput,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';
import { colors, radius, shadow } from '@/lib/theme';
import { parsePalate, matchScore } from '@/lib/palate';
import { InboxIcon } from '@/components/InboxIcon';
import type { Recipe } from '@/lib/database.types';

// ─── Types ─────────────────────────────────────────────────────────────────
type SearchMode = 'name' | 'cuisine' | 'ingredient';

type RankedRecipe = Recipe & {
  avg_rating: number | null;
  try_count: number;
  match_score: number | null;
  creator?: {
    id: string;
    display_name: string;
    username: string;
    avatar_url: string | null;
  };
};

// ─── Constants ──────────────────────────────────────────────────────────────
const SCREEN_W = Dimensions.get('window').width;
const H_PAD = 20;
const COL_GAP = 10;
const CARD_W = (SCREEN_W - H_PAD * 2 - COL_GAP) / 2;
const CARD_H = CARD_W * 1.35;

const MODES: { key: SearchMode; label: string }[] = [
  { key: 'name', label: 'Name' },
  { key: 'cuisine', label: 'Cuisine' },
  { key: 'ingredient', label: 'Ingredient' },
];

// ─── Fallback colors for recipes without images ──────────────────────────
const FALLBACK_PALETTE = [
  colors.sageSoft,
  colors.claySoft,
  colors.ochreSoft,
  colors.bg,
];
const FALLBACK_TEXT = [colors.sage, colors.clay, colors.ochre, colors.inkSoft];

function fallbackIndex(id: string): number {
  let n = 0;
  for (let i = 0; i < id.length; i++) n += id.charCodeAt(i);
  return n % FALLBACK_PALETTE.length;
}

// ─── Data fetching ──────────────────────────────────────────────────────────
async function fetchPublicRecipes(): Promise<RankedRecipe[]> {
  const { data, error } = await supabase
    .from('recipes')
    .select('*, creator:profiles!created_by(id, display_name, username, avatar_url), tries:recipe_tries(rating)')
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []).map((r: any) => {
    const ratings = (r.tries ?? []).map((t: any) => t.rating).filter(Boolean);
    return {
      ...r,
      avg_rating: ratings.length
        ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length
        : null,
      try_count: ratings.length,
      match_score: null,
    };
  });
}

// ─── Grid card ──────────────────────────────────────────────────────────────
function ExploreCard({ recipe, onPress }: { recipe: RankedRecipe; onPress: () => void }) {
  const fi = fallbackIndex(recipe.id);
  const hasImage = !!recipe.cover_image_url;
  const initial = (recipe.title?.[0] ?? '?').toUpperCase();
  const totalTime =
    recipe.prep_time_min != null && recipe.cook_time_min != null
      ? recipe.prep_time_min + recipe.cook_time_min
      : recipe.prep_time_min ?? recipe.cook_time_min ?? null;

  return (
    <Pressable
      style={[cardStyles.card, { width: CARD_W, height: CARD_H }]}
      onPress={onPress}
      android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
    >
      {/* Background: image or tinted fallback */}
      {hasImage ? (
        <Image
          source={{ uri: recipe.cover_image_url! }}
          style={StyleSheet.absoluteFillObject}
          contentFit="cover"
        />
      ) : (
        <View
          style={[
            StyleSheet.absoluteFillObject,
            { backgroundColor: FALLBACK_PALETTE[fi], alignItems: 'center', justifyContent: 'center' },
          ]}
        >
          <Text style={[cardStyles.fallbackInitial, { color: FALLBACK_TEXT[fi] }]}>
            {initial}
          </Text>
        </View>
      )}

      {/* Dark overlay — bottom half for legibility on images */}
      {hasImage && (
        <>
          <View style={cardStyles.overlayTop} />
          <View style={cardStyles.overlayBottom} />
        </>
      )}

      {/* Top badges */}
      <View style={cardStyles.topRow}>
        {recipe.cuisine ? (
          <View style={[cardStyles.cuisineChip, hasImage && cardStyles.cuisineChipDark]}>
            <Text style={[cardStyles.cuisineText, hasImage && cardStyles.cuisineTextDark]} numberOfLines={1}>
              {recipe.cuisine.toUpperCase()}
            </Text>
          </View>
        ) : <View />}

        {recipe.match_score != null && (
          <View style={cardStyles.matchBadge}>
            <Text style={cardStyles.matchText}>{recipe.match_score}%</Text>
          </View>
        )}
      </View>

      {/* Bottom: title + creator + time */}
      <View style={[cardStyles.bottomMeta, !hasImage && cardStyles.bottomMetaLight]}>
        <Text
          style={[cardStyles.cardTitle, !hasImage && { color: FALLBACK_TEXT[fi] }]}
          numberOfLines={2}
        >
          {recipe.title}
        </Text>
        <View style={cardStyles.cardFooter}>
          {recipe.creator && (
            <Text style={[cardStyles.cardCreator, !hasImage && { color: FALLBACK_TEXT[fi], opacity: 0.65 }]} numberOfLines={1}>
              {recipe.creator.display_name}
            </Text>
          )}
          {totalTime !== null && (
            <Text style={[cardStyles.cardTime, !hasImage && { color: FALLBACK_TEXT[fi], opacity: 0.55 }]}>
              {totalTime} min
            </Text>
          )}
        </View>
      </View>

      {/* Rating dot — top right when no match score */}
      {recipe.match_score == null && recipe.avg_rating != null && (
        <View style={cardStyles.ratingDot}>
          <Text style={cardStyles.ratingText}>{recipe.avg_rating.toFixed(1)}</Text>
        </View>
      )}
    </Pressable>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.bg,
    ...shadow.card,
  },
  fallbackInitial: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 56,
    letterSpacing: -2,
    opacity: 0.25,
  },
  overlayTop: {
    ...StyleSheet.absoluteFillObject,
    bottom: '25%',
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  overlayBottom: {
    ...StyleSheet.absoluteFillObject,
    top: '75%',
    backgroundColor: 'rgba(0,0,0,0.72)',
  },
  topRow: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cuisineChip: {
    backgroundColor: colors.bg,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radius.pill,
    maxWidth: CARD_W * 0.55,
  },
  cuisineChipDark: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  cuisineText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 8,
    letterSpacing: 0.8,
    color: colors.inkSoft,
  },
  cuisineTextDark: {
    color: 'rgba(255,255,255,0.85)',
  },
  matchBadge: {
    backgroundColor: colors.ochre,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  matchText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 9,
    color: '#fff',
    letterSpacing: 0.3,
  },
  bottomMeta: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    paddingBottom: 14,
  },
  bottomMetaLight: {
    padding: 14,
    paddingBottom: 16,
    justifyContent: 'flex-end',
    bottom: 0,
    position: 'absolute',
    left: 0,
    right: 0,
  },
  cardTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    color: '#fff',
    lineHeight: 18,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
  },
  cardCreator: {
    fontFamily: 'Inter_500Medium',
    fontSize: 10,
    color: 'rgba(255,255,255,0.65)',
    letterSpacing: 0.1,
    flex: 1,
  },
  cardTime: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    color: 'rgba(255,255,255,0.65)',
    letterSpacing: 0.1,
  },
  ratingDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: colors.ochreSoft,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  ratingText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 9,
    color: colors.ochre,
  },
});

// ─── Main screen ─────────────────────────────────────────────────────────────
export default function ExploreScreen() {
  const router = useRouter();
  const storedPalate = useAuthStore((s) => s.profile?.palate_vector);
  const userPalate = parsePalate(storedPalate);

  const [search, setSearch] = useState('');
  const [mode, setMode] = useState<SearchMode>('name');

  const { data: rawRecipes, isLoading } = useQuery({
    queryKey: ['explore-palate'],
    queryFn: fetchPublicRecipes,
  });

  // Rank by palate match
  const ranked = useMemo<RankedRecipe[]>(() => {
    if (!rawRecipes) return [];
    return rawRecipes
      .map((r) => ({
        ...r,
        match_score: userPalate ? matchScore(userPalate, parsePalate(r.palate_vector)) : null,
      }))
      .sort((a, b) => (b.match_score ?? -1) - (a.match_score ?? -1))
      .slice(0, 50);
  }, [rawRecipes, userPalate]);

  // Filter by search
  const displayed = useMemo<RankedRecipe[]>(() => {
    const q = search.trim().toLowerCase();
    if (!q) return ranked;
    return ranked.filter((r) => {
      if (mode === 'name') return r.title.toLowerCase().includes(q);
      if (mode === 'cuisine') return (r.cuisine ?? '').toLowerCase().includes(q);
      if (mode === 'ingredient') {
        return (r.ingredients ?? []).some((ing) => ing.name.toLowerCase().includes(q));
      }
      return true;
    });
  }, [ranked, search, mode]);

  const isSearching = search.trim().length > 0;

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={displayed}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <ExploreCard
            recipe={item}
            onPress={() => router.push(`/recipe/${item.id}` as any)}
          />
        )}
        ListHeaderComponent={
          <Header
            search={search}
            setSearch={setSearch}
            mode={mode}
            setMode={setMode}
            isSearching={isSearching}
            resultCount={displayed.length}
            isLoading={isLoading}
            hasPalate={!!userPalate}
            onTakeQuiz={() => router.push('/(onboarding)/palate-quiz' as any)}
          />
        }
        ListEmptyComponent={
          isLoading ? null : (
            <View style={styles.emptyWrap}>
              {isSearching ? (
                <>
                  <Text style={styles.emptyTitle}>No results</Text>
                  <Text style={styles.emptyBody}>
                    Nothing matched "{search}" in {mode === 'name' ? 'recipe names' : mode === 'cuisine' ? 'cuisines' : 'ingredients'}.
                  </Text>
                </>
              ) : (
                <>
                  <Text style={styles.emptyTitle}>Nothing here yet</Text>
                  <Text style={styles.emptyBody}>Public recipes will appear as people add them.</Text>
                </>
              )}
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

// ─── Header component ─────────────────────────────────────────────────────
function Header({
  search,
  setSearch,
  mode,
  setMode,
  isSearching,
  resultCount,
  isLoading,
  hasPalate,
  onTakeQuiz,
}: {
  search: string;
  setSearch: (v: string) => void;
  mode: SearchMode;
  setMode: (m: SearchMode) => void;
  isSearching: boolean;
  resultCount: number;
  isLoading: boolean;
  hasPalate: boolean;
  onTakeQuiz: () => void;
}) {
  return (
    <View style={headerStyles.wrap}>
      {/* Title row */}
      <View style={headerStyles.titleRow}>
        <View>
          <Text style={headerStyles.eyebrow}>DISCOVER</Text>
          <Text style={headerStyles.heading}>
            {hasPalate ? 'For your palate' : 'All recipes'}
          </Text>
        </View>
        <InboxIcon />
      </View>

      {/* Palate nudge banner */}
      {!hasPalate && (
        <Pressable style={headerStyles.nudgeBanner} onPress={onTakeQuiz}>
          <View style={{ flex: 1 }}>
            <Text style={headerStyles.nudgeTitle}>Personalize your feed</Text>
            <Text style={headerStyles.nudgeBody}>Take the palate quiz to rank recipes by taste match</Text>
          </View>
          <Ionicons name="arrow-forward" size={16} color={colors.sage} />
        </Pressable>
      )}

      {/* Search bar */}
      <View style={headerStyles.searchBar}>
        <Ionicons name="search-outline" size={18} color={colors.muted} />
        <TextInput
          style={headerStyles.searchInput}
          placeholder={
            mode === 'name' ? 'Search recipes…'
            : mode === 'cuisine' ? 'Search by cuisine…'
            : 'Search by ingredient…'
          }
          placeholderTextColor={colors.muted}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
          clearButtonMode="while-editing"
          autoCorrect={false}
          autoCapitalize="none"
        />
        {search.length > 0 && (
          <Pressable hitSlop={8} onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={colors.muted} />
          </Pressable>
        )}
      </View>

      {/* Mode chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={headerStyles.modeRow}
      >
        {MODES.map((m) => {
          const active = m.key === mode;
          return (
            <Pressable
              key={m.key}
              style={[headerStyles.modeChip, active && headerStyles.modeChipActive]}
              onPress={() => setMode(m.key)}
            >
              <Text style={[headerStyles.modeLabel, active && headerStyles.modeLabelActive]}>
                {m.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Result count / loading */}
      <View style={headerStyles.statusRow}>
        {isLoading ? (
          <ActivityIndicator color={colors.sage} size="small" />
        ) : (
          <Text style={headerStyles.statusText}>
            {isSearching
              ? `${resultCount} result${resultCount !== 1 ? 's' : ''}`
              : `${resultCount} recipe${resultCount !== 1 ? 's' : ''} ranked for you`}
          </Text>
        )}
      </View>
    </View>
  );
}

const headerStyles = StyleSheet.create({
  wrap: {
    paddingTop: 8,
    paddingBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  eyebrow: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    color: colors.sage,
    letterSpacing: 2,
    marginBottom: 4,
  },
  heading: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 30,
    color: colors.ink,
    letterSpacing: -0.8,
    lineHeight: 34,
  },
  searchBar: {
    height: 46,
    backgroundColor: colors.card,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 12,
    ...shadow.card,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: colors.ink,
    height: '100%',
  },
  modeRow: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 2,
  },
  modeChip: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  modeChipActive: {
    backgroundColor: colors.sage,
    borderColor: colors.sage,
  },
  modeLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: colors.muted,
  },
  modeLabelActive: {
    color: colors.card,
  },
  statusRow: {
    marginTop: 14,
    marginBottom: 2,
    height: 18,
  },
  statusText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: colors.muted,
    letterSpacing: 0.2,
  },
  nudgeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.sageSoft,
    borderRadius: radius.md,
    padding: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: colors.sage + '28',
  },
  nudgeTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
    color: colors.sage,
    marginBottom: 2,
  },
  nudgeBody: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: colors.sage,
    opacity: 0.75,
    lineHeight: 15,
  },
});

// ─── Screen styles ────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bone,
  },
  listContent: {
    paddingHorizontal: H_PAD,
    paddingBottom: 110,
  },
  row: {
    gap: COL_GAP,
    marginBottom: COL_GAP,
  },
  emptyWrap: {
    paddingTop: 48,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  emptyTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: colors.ink,
    letterSpacing: -0.4,
    marginBottom: 8,
  },
  emptyBody: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
});
