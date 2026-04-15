import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import type { Recipe } from '@/lib/database.types';
import { COLORS, FONTS } from '@/lib/theme';

interface Props {
  recipe: Recipe & {
    avg_rating?: number;
    try_count?: number;
    creator?: { id: string; display_name: string; username: string; avatar_url: string | null };
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

  const initial = recipe.creator?.display_name?.[0]?.toUpperCase() ?? '?';

  return (
    <View style={styles.card}>
      {/* Creator row — tappable, navigates to user profile */}
      {showCreator && recipe.creator && (
        <TouchableOpacity
          style={styles.creatorHeader}
          onPress={() => router.push(`/user/${recipe.creator!.id}`)}
          activeOpacity={0.8}
        >
          <View style={styles.avatarContainer}>
            {recipe.creator.avatar_url ? (
              <Image source={{ uri: recipe.creator.avatar_url }} style={styles.avatar} />
            ) : (
              <Text style={styles.avatarInitial}>{initial}</Text>
            )}
          </View>
          <View style={styles.creatorMeta}>
            <Text style={styles.creatorName}>{recipe.creator.display_name}</Text>
            <Text style={styles.creatorHandle}>@{recipe.creator.username}</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Image + recipe content — tappable, navigates to recipe */}
      <TouchableOpacity
        onPress={() => router.push(`/recipe/${recipe.id}`)}
        activeOpacity={0.9}
      >
        {recipe.cover_image_url ? (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: recipe.cover_image_url }}
              style={styles.image}
              resizeMode="cover"
            />
            {recipe.avg_rating != null && (
              <View style={styles.ratingBadge}>
                <Text style={styles.ratingBadgeText}>{recipe.avg_rating.toFixed(1)}/10</Text>
              </View>
            )}
            {recipe.cuisine && (
              <View style={styles.cuisineTagOverlay}>
                <Text style={styles.cuisineTagText}>{recipe.cuisine.toUpperCase()}</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.noImageContainer}>
            {recipe.cuisine && (
              <Text style={styles.cuisineTagNoImage}>{recipe.cuisine.toUpperCase()}</Text>
            )}
          </View>
        )}

        {/* Title & meta — below image */}
        <View style={styles.footer}>
          <Text style={styles.recipeTitle} numberOfLines={2}>{recipe.title}</Text>
          <View style={styles.metaRow}>
            {recipe.avg_rating != null && !recipe.cover_image_url && (
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
        </View>
      </TouchableOpacity>

      {/* Hairline bottom border */}
      <View style={styles.hairline} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surfaceContainerLow,
    overflow: 'hidden',
    marginBottom: 24,
  },

  /* Creator header */
  creatorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  avatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    overflow: 'hidden',
  },
  avatar: { width: 32, height: 32, borderRadius: 16 },
  avatarInitial: {
    fontFamily: FONTS.bodyBold,
    fontSize: 13,
    color: COLORS.onPrimary,
  },
  creatorMeta: { flex: 1 },
  creatorName: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 13,
    color: COLORS.onSurface,
  },
  creatorHandle: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.onSurfaceVariant,
    marginTop: 1,
  },

  /* Image */
  imageContainer: {
    width: '100%',
    height: 260,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 260,
  },
  ratingBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(251,249,244,0.92)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 100,
  },
  ratingBadgeText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.primary,
  },
  cuisineTagOverlay: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: 'rgba(12,10,8,0.72)',
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  cuisineTagText: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: COLORS.onSurfaceVariant,
    letterSpacing: 1.4,
  },

  /* No-image variant */
  noImageContainer: {
    backgroundColor: COLORS.surfaceContainer,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
  },
  cuisineTagNoImage: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: COLORS.onSurfaceVariant,
    letterSpacing: 1.4,
    marginBottom: 4,
  },

  /* Footer — title & meta below image */
  footer: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
  },
  recipeTitle: {
    fontFamily: FONTS.headlineBold,
    fontSize: 26,
    color: COLORS.onSurface,
    lineHeight: 31,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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

  hairline: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.outlineVariant,
  },
});
