import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import type { Recipe } from '@/lib/database.types';

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
  hard: '#C4622D',
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
      {/* ── Image variant ── */}
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
        /* ── No-image variant ── */
        <View style={styles.noImageContainer}>
          {recipe.cuisine && (
            <Text style={styles.cuisineTagNoImage}>{recipe.cuisine.toUpperCase()}</Text>
          )}
          <Text style={styles.titleNoImage} numberOfLines={2}>
            {recipe.title}
          </Text>
        </View>
      )}

      {/* ── Meta row ── */}
      <View style={styles.metaRow}>
        {recipe.avg_rating !== undefined && (
          <Text style={styles.rating}>{recipe.avg_rating.toFixed(1)}/10</Text>
        )}
        {totalTime !== null && (
          <Text style={styles.metaMuted}>{totalTime} min</Text>
        )}
        {recipe.difficulty && (
          <Text style={[styles.metaMuted, { color: DIFFICULTY_COLOR[recipe.difficulty] ?? '#7A6E64' }]}>
            {recipe.difficulty}
          </Text>
        )}
      </View>

      {/* ── Creator ── */}
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
    backgroundColor: '#161210',
    borderWidth: 0,
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
    fontFamily: 'DMMono_400Regular',
    fontSize: 9,
    color: '#7A6E64',
    letterSpacing: 1.2,
  },
  titleOverlayContainer: {
    position: 'absolute',
    bottom: 10,
    left: 12,
    right: 12,
  },
  titleOverlay: {
    fontFamily: 'CormorantGaramond_600SemiBold',
    fontSize: 26,
    color: '#EDE8DC',
    lineHeight: 30,
  },
  noImageContainer: {
    backgroundColor: '#161210',
    paddingHorizontal: 14,
    paddingTop: 16,
    paddingBottom: 12,
  },
  cuisineTagNoImage: {
    fontFamily: 'DMMono_400Regular',
    fontSize: 9,
    color: '#7A6E64',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  titleNoImage: {
    fontFamily: 'CormorantGaramond_400Regular',
    fontSize: 24,
    color: '#EDE8DC',
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
    fontFamily: 'DMMono_500Medium',
    fontSize: 12,
    color: '#C4622D',
  },
  metaMuted: {
    fontFamily: 'DMMono_400Regular',
    fontSize: 11,
    color: '#7A6E64',
  },
  creatorRow: {
    paddingHorizontal: 14,
    paddingBottom: 10,
  },
  creatorText: {
    fontFamily: 'Lora_400Regular',
    fontSize: 12,
    color: '#7A6E64',
  },
  hairline: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#272018',
  },
});
