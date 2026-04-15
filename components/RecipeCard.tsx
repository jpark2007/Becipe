import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import type { Recipe } from '@/lib/database.types';
import { colors, radius, shadow } from '@/lib/theme';
import { Plate } from '@/components/Plate';

interface Props {
  recipe: Recipe & {
    avg_rating?: number;
    try_count?: number;
    creator?: { display_name: string; username: string; avatar_url: string | null };
  };
  variant?: 'plate' | 'flat';
  showCreator?: boolean;
}

const DIFFICULTY_COLOR: Record<string, string> = {
  easy: colors.sage,
  medium: colors.ochre,
  hard: colors.clay,
};

export function RecipeCard({ recipe, variant = 'plate', showCreator }: Props) {
  const router = useRouter();
  const totalTime =
    recipe.prep_time_min !== null && recipe.cook_time_min !== null
      ? (recipe.prep_time_min ?? 0) + (recipe.cook_time_min ?? 0)
      : null;

  if (variant === 'plate') {
    return (
      <TouchableOpacity
        style={styles.plateCard}
        onPress={() => router.push(`/recipe/${recipe.id}`)}
        activeOpacity={0.85}
      >
        <Text style={styles.plateTitle} numberOfLines={2}>
          {recipe.title}
        </Text>
        <View style={styles.plateMetaRow}>
          {showCreator && recipe.creator && (
            <Text style={styles.plateMeta} numberOfLines={1}>
              by {recipe.creator.display_name}
            </Text>
          )}
          {recipe.cuisine && (
            <Text style={styles.plateMeta}>{recipe.cuisine}</Text>
          )}
          {recipe.avg_rating != null && (
            <Text style={styles.plateRating}>{recipe.avg_rating.toFixed(1)}</Text>
          )}
        </View>
        {(totalTime !== null || recipe.difficulty) && (
          <View style={styles.plateSubRow}>
            {totalTime !== null && (
              <Text style={styles.plateMeta}>{totalTime} min</Text>
            )}
            {recipe.difficulty && (
              <Text
                style={[
                  styles.plateMeta,
                  { color: DIFFICULTY_COLOR[recipe.difficulty] ?? colors.muted },
                ]}
              >
                {recipe.difficulty}
              </Text>
            )}
          </View>
        )}
        <View style={styles.plateFloat}>
          <Plate uri={recipe.cover_image_url} size={100} />
        </View>
      </TouchableOpacity>
    );
  }

  // flat variant (legacy layout preserved)
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/recipe/${recipe.id}`)}
      activeOpacity={0.85}
    >
      {recipe.cover_image_url ? (
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: recipe.cover_image_url }}
            style={styles.image}
            resizeMode="cover"
          />
          <View style={styles.scrim} />
          {recipe.cuisine && (
            <View style={styles.cuisineTagOverlay}>
              <Text style={styles.cuisineTagText}>{recipe.cuisine.toUpperCase()}</Text>
            </View>
          )}
          <View style={styles.titleOverlayContainer}>
            <Text style={styles.titleOverlay} numberOfLines={2}>
              {recipe.title}
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.noImageContainer}>
          {recipe.cuisine && (
            <Text style={styles.cuisineTagNoImage}>{recipe.cuisine.toUpperCase()}</Text>
          )}
          <Text style={styles.titleNoImage} numberOfLines={2}>
            {recipe.title}
          </Text>
        </View>
      )}

      <View style={styles.metaRow}>
        {recipe.avg_rating != null && (
          <Text style={styles.rating}>{recipe.avg_rating.toFixed(1)}/10</Text>
        )}
        {totalTime !== null && (
          <Text style={styles.metaMuted}>{totalTime} min</Text>
        )}
        {recipe.difficulty && (
          <Text
            style={[
              styles.metaMuted,
              { color: DIFFICULTY_COLOR[recipe.difficulty] ?? colors.muted },
            ]}
          >
            {recipe.difficulty}
          </Text>
        )}
      </View>

      {showCreator && recipe.creator && (
        <View style={styles.creatorRow}>
          <Text style={styles.creatorText}>by {recipe.creator.display_name}</Text>
        </View>
      )}

      <View style={styles.hairline} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // ── plate variant ──
  plateCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 22,
    paddingVertical: 16,
    paddingLeft: 18,
    paddingRight: 100,
    marginBottom: 14,
    minHeight: 100,
    position: 'relative',
    ...shadow.card,
  },
  plateTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 17,
    color: colors.ink,
    lineHeight: 20,
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  plateMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  plateSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  plateMeta: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: colors.muted,
  },
  plateRating: {
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
    color: colors.ochre,
  },
  plateFloat: {
    position: 'absolute',
    top: '50%',
    right: -14,
    marginTop: -50,
  },

  // ── flat (legacy) variant ──
  card: {
    backgroundColor: colors.card,
    borderWidth: 0,
    marginBottom: 12,
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
    height: 200,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 200,
  },
  scrim: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 110,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  cuisineTagOverlay: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(12,10,8,0.72)',
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  cuisineTagText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 9,
    color: colors.muted,
    letterSpacing: 1.2,
  },
  titleOverlayContainer: {
    position: 'absolute',
    bottom: 10,
    left: 12,
    right: 12,
  },
  titleOverlay: {
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
    color: colors.card,
    lineHeight: 26,
    letterSpacing: -0.4,
  },
  noImageContainer: {
    backgroundColor: colors.card,
    paddingHorizontal: 14,
    paddingTop: 16,
    paddingBottom: 12,
  },
  cuisineTagNoImage: {
    fontFamily: 'Inter_500Medium',
    fontSize: 9,
    color: colors.muted,
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  titleNoImage: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    color: colors.ink,
    lineHeight: 24,
    letterSpacing: -0.4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 8,
  },
  rating: {
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
    color: colors.ochre,
  },
  metaMuted: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: colors.muted,
  },
  creatorRow: {
    paddingHorizontal: 14,
    paddingBottom: 10,
  },
  creatorText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: colors.muted,
  },
  hairline: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
});
