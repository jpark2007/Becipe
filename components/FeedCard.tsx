import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { formatDistanceToNow } from 'date-fns';

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

  const verbLabel: string =
    item.verb === 'tried' ? 'tried' : item.verb === 'saved' ? 'saved' : 'shared';

  const photoUri = item.try?.photo_url ?? item.recipe.cover_image_url ?? null;
  const initial = item.actor.display_name[0]?.toUpperCase() ?? '?';
  const timeAgo = formatDistanceToNow(new Date(item.created_at), { addSuffix: true });

  return (
    <View style={styles.card}>
      {/* ── Header ── */}
      <TouchableOpacity
        style={styles.header}
        onPress={() => router.push(`/user/${item.actor.id}`)}
        activeOpacity={0.8}
      >
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          {item.actor.avatar_url ? (
            <Image source={{ uri: item.actor.avatar_url }} style={styles.avatar} />
          ) : (
            <Text style={styles.avatarInitial}>{initial}</Text>
          )}
        </View>

        {/* Name + verb */}
        <View style={styles.headerMeta}>
          <View style={styles.nameRow}>
            <Text style={styles.displayName}>{item.actor.display_name}</Text>
            <Text style={styles.username}> @{item.actor.username}</Text>
          </View>
          <Text style={styles.verbText}>{verbLabel} a recipe</Text>
        </View>

        {/* Timestamp */}
        <Text style={styles.timestamp}>{timeAgo}</Text>
      </TouchableOpacity>

      {/* ── Full-bleed image ── */}
      {photoUri && (
        <TouchableOpacity onPress={() => router.push(`/recipe/${item.recipe.id}`)}>
          <Image source={{ uri: photoUri }} style={styles.photo} resizeMode="cover" />
        </TouchableOpacity>
      )}

      {/* ── Footer ── */}
      <View style={styles.footer}>
        {/* Rating */}
        {item.try?.rating !== undefined && (
          <View style={styles.ratingRow}>
            <Text style={styles.ratingLarge}>{item.try.rating.toFixed(1)}</Text>
            <Text style={styles.ratingSlash}>/10</Text>
          </View>
        )}

        {/* Note */}
        {item.try?.note ? (
          <Text style={styles.noteText} numberOfLines={3}>
            {item.try.note}
          </Text>
        ) : null}

        {/* Divider + recipe link */}
        <View style={styles.divider} />
        <TouchableOpacity
          style={styles.recipeLinkRow}
          onPress={() => router.push(`/recipe/${item.recipe.id}`)}
          activeOpacity={0.75}
        >
          <Text style={styles.recipeTitle} numberOfLines={1}>
            {item.recipe.title}
          </Text>
          <Text style={styles.viewRecipeArrow}>→ view recipe</Text>
        </TouchableOpacity>
      </View>

      {/* Hairline bottom border */}
      <View style={styles.hairline} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#EEE8DF',
    marginBottom: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 10,
  },
  avatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#C4622D',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    overflow: 'hidden',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarInitial: {
    fontFamily: 'DMMono_400Regular',
    fontSize: 13,
    color: '#EDE8DC',
  },
  headerMeta: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
  },
  displayName: {
    fontFamily: 'DMMono_500Medium',
    fontSize: 11,
    color: '#1C1712',
  },
  username: {
    fontFamily: 'DMMono_400Regular',
    fontSize: 10,
    color: '#A09590',
  },
  verbText: {
    fontFamily: 'Lora_400Regular',
    fontSize: 11,
    color: '#A09590',
    marginTop: 1,
  },
  timestamp: {
    fontFamily: 'DMMono_400Regular',
    fontSize: 10,
    color: '#A09590',
    marginLeft: 8,
    alignSelf: 'flex-start',
    marginTop: 1,
  },
  photo: {
    width: '100%',
    height: 220,
  },
  footer: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 12,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  ratingLarge: {
    fontFamily: 'DMMono_500Medium',
    fontSize: 28,
    color: '#C4622D',
  },
  ratingSlash: {
    fontFamily: 'DMMono_400Regular',
    fontSize: 13,
    color: '#A09590',
    marginLeft: 2,
  },
  noteText: {
    fontFamily: 'Lora_400Regular',
    fontSize: 13,
    color: '#1C1712',
    lineHeight: 20,
    marginBottom: 10,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#D5CCC0',
    marginBottom: 10,
  },
  recipeLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recipeTitle: {
    fontFamily: 'CormorantGaramond_400Regular',
    fontSize: 18,
    color: '#1C1712',
    flex: 1,
    marginRight: 10,
  },
  viewRecipeArrow: {
    fontFamily: 'DMMono_400Regular',
    fontSize: 10,
    color: '#C4622D',
    letterSpacing: 0.4,
  },
  hairline: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#D5CCC0',
  },
});
