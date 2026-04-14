import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import type { Recipe } from '@/lib/database.types';
import { COLORS, FONTS } from '@/lib/theme';

interface Props {
  recipe: Recipe & {
    avg_rating?: number;
    try_count?: number;
    creator?: { display_name: string; username: string; avatar_url: string | null };
  };
  showCreator?: boolean;
}

const DIFFICULTY_COLOR: Record<string, string> = {
  easy: '#6A9E6A',
  medium: '#C4A44A',
  hard: COLORS.primaryContainer,
};

export function RecipeCard({ recipe, showCreator }: Props) {
  const router = useRouter();
  const totalTime =
    recipe.prep_time_min !== null && recipe.cook_time_min !== null
      ? (recipe.prep_time_min ?? 0) + (recipe.cook_time_min ?? 0)
      : null;

  return (
    <TouchableOpacity
      className="mb-3 overflow-hidden"
      style={styles.card}
      onPress={() => router.push(`/recipe/${recipe.id}`)}
      activeOpacity={0.85}
    >
      {/* Image variant */}
      {recipe.cover_image_url ? (
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: recipe.cover_image_url }}
            style={styles.image}
            resizeMode="cover"
          />
          {/* Dark scrim at bottom */}
          <View style={styles.scrim} />

          {/* Cuisine tag — top right */}
          {recipe.cuisine && (
            <View style={styles.cuisineTagOverlay}>
              <Text style={styles.cuisineTagText}>{recipe.cuisine.toUpperCase()}</Text>
            </View>
          )}

          {/* Title overlaid on image bottom */}
          <View style={styles.titleOverlayContainer}>
            <Text style={styles.titleOverlay} numberOfLines={2}>
              {recipe.title}
            </Text>
          </View>
        </View>
      ) : (
        /* No-image variant */
        <View style={styles.noImageContainer}>
          {recipe.cuisine && (
            <Text style={styles.cuisineTagNoImage}>{recipe.cuisine.toUpperCase()}</Text>
          )}
          <Text style={styles.titleNoImage} numberOfLines={2}>
            {recipe.title}
          </Text>
        </View>
      )}

      {/* Meta row */}
      <View style={styles.metaRow}>
        {recipe.avg_rating != null && (
          <Text style={styles.rating}>{recipe.avg_rating.toFixed(1)}/10</Text>
        )}
        {totalTime !== null && (
          <Text style={styles.metaMuted}>{totalTime} min</Text>
        )}
        {recipe.difficulty && (
          <Text style={[styles.metaMuted, { color: DIFFICULTY_COLOR[recipe.difficulty] ?? COLORS.onSurfaceVariant }]}>
            {recipe.difficulty}
          </Text>
        )}
      </View>

      {/* Creator */}
      {showCreator && recipe.creator && (
        <View style={styles.creatorRow}>
          <Text style={styles.creatorText}>by {recipe.creator.display_name}</Text>
        </View>
      )}

      {/* Hairline bottom border */}
      <View style={styles.hairline} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: 4,
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
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: COLORS.onSurfaceVariant,
    letterSpacing: 1.2,
  },
  titleOverlayContainer: {
    position: 'absolute',
    bottom: 10,
    left: 12,
    right: 12,
  },
  titleOverlay: {
    fontFamily: FONTS.headlineBold,
    fontSize: 26,
    color: '#ffffff',
    lineHeight: 30,
  },
  noImageContainer: {
    backgroundColor: COLORS.surfaceContainer,
    paddingHorizontal: 14,
    paddingTop: 16,
    paddingBottom: 12,
  },
  cuisineTagNoImage: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: COLORS.onSurfaceVariant,
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  titleNoImage: {
    fontFamily: FONTS.headline,
    fontSize: 24,
    color: COLORS.onSurface,
    lineHeight: 28,
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
    fontFamily: FONTS.monoMedium,
    fontSize: 12,
    color: COLORS.primaryContainer,
  },
  metaMuted: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.onSurfaceVariant,
  },
  creatorRow: {
    paddingHorizontal: 14,
    paddingBottom: 10,
  },
  creatorText: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
  },
  hairline: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.outlineVariant,
  },
});
