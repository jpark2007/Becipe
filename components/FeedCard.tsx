import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { formatDistanceToNow } from 'date-fns';
import { COLORS, FONTS } from '@/lib/theme';

interface FeedCardProps {
  item: {
    id: string;
    verb: string;
    created_at: string;
    actor: { id: string; display_name: string; username: string; avatar_url: string | null };
    recipe: { id: string; title: string; cover_image_url: string | null; cuisine: string | null };
    try?: { rating: number; note: string | null; photo_url: string | null } | null;
  };
}

export function FeedCard({ item }: FeedCardProps) {
  const router = useRouter();
  const verbLabel = item.verb === 'tried' ? 'tried' : item.verb === 'saved' ? 'saved' : 'shared';
  const photoUri = item.try?.photo_url ?? item.recipe.cover_image_url ?? null;
  const initial = item.actor.display_name[0]?.toUpperCase() ?? '?';
  const timeAgo = formatDistanceToNow(new Date(item.created_at), { addSuffix: true });

  return (
    <View style={styles.card}>
      {/* Creator row */}
      <TouchableOpacity
        style={styles.header}
        onPress={() => router.push(`/user/${item.actor.id}`)}
        activeOpacity={0.8}
      >
        <View style={styles.avatarContainer}>
          {item.actor.avatar_url ? (
            <Image source={{ uri: item.actor.avatar_url }} style={styles.avatar} />
          ) : (
            <Text style={styles.avatarInitial}>{initial}</Text>
          )}
        </View>
        <View style={styles.headerMeta}>
          <Text style={styles.displayName}>{item.actor.display_name}</Text>
          <Text style={styles.verbText}>
            {verbLabel} a recipe · {timeAgo}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Full-bleed image with rating badge */}
      {photoUri && (
        <TouchableOpacity
          onPress={() => router.push(`/recipe/${item.recipe.id}`)}
          activeOpacity={0.95}
        >
          <View style={styles.imageWrapper}>
            <Image source={{ uri: photoUri }} style={styles.photo} resizeMode="cover" />
            {item.try?.rating != null && (
              <View style={styles.ratingBadge}>
                <Text style={styles.ratingBadgeText}>
                  {item.try.rating.toFixed(1)}/10
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      )}

      {/* Footer */}
      <TouchableOpacity
        style={styles.footer}
        onPress={() => router.push(`/recipe/${item.recipe.id}`)}
        activeOpacity={0.8}
      >
        {item.recipe.cuisine && (
          <Text style={styles.cuisineTag}>{item.recipe.cuisine.toUpperCase()}</Text>
        )}
        <Text style={styles.recipeTitle} numberOfLines={2}>
          {item.recipe.title}
        </Text>
        {item.try?.note ? (
          <Text style={styles.noteText} numberOfLines={3}>
            {item.try.note}
          </Text>
        ) : null}
        <Text style={styles.viewRecipe}>View recipe →</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  avatarContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  avatar: { width: 36, height: 36, borderRadius: 18 },
  avatarInitial: {
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
    color: COLORS.onPrimary,
  },
  headerMeta: { flex: 1 },
  displayName: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 13,
    color: COLORS.onSurface,
  },
  verbText: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    marginTop: 2,
  },
  imageWrapper: { position: 'relative' },
  photo: { width: '100%', height: 260 },
  ratingBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
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
  footer: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 18,
  },
  cuisineTag: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    letterSpacing: 1.5,
    color: COLORS.primary,
    marginBottom: 6,
  },
  recipeTitle: {
    fontFamily: FONTS.headlineBold,
    fontSize: 24,
    color: COLORS.onSurface,
    lineHeight: 30,
    marginBottom: 8,
  },
  noteText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.onSurfaceVariant,
    lineHeight: 20,
    fontStyle: 'italic',
    marginBottom: 10,
  },
  viewRecipe: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    letterSpacing: 0.5,
    color: COLORS.primary,
    textTransform: 'uppercase',
    marginTop: 4,
  },
});
