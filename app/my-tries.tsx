import { useMemo } from 'react';
import {
  View,
  Text,
  SectionList,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';
import { colors, radius } from '@/lib/theme';

// ─── Types ────────────────────────────────────────────────────────────────
interface TryEntry {
  id: string;
  recipe_id: string;
  rating: number;
  note: string | null;
  photo_url: string | null;
  tried_at: string;
  recipe: {
    id: string;
    title: string;
    cover_image_url: string | null;
    cuisine: string | null;
  } | null;
}

interface Section {
  title: string;
  data: TryEntry[];
}

// ─── Fetch ────────────────────────────────────────────────────────────────
async function fetchMyTries(userId: string): Promise<TryEntry[]> {
  const { data, error } = await supabase
    .from('recipe_tries')
    .select('id, recipe_id, rating, note, photo_url, tried_at, recipe:recipes!recipe_id(id, title, cover_image_url, cuisine)')
    .eq('user_id', userId)
    .order('tried_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as TryEntry[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────
function monthKey(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function ratingColor(r: number): string {
  if (r >= 8) return colors.sage;
  if (r >= 5) return colors.ochre;
  return colors.clay;
}

// ─── Try row ──────────────────────────────────────────────────────────────
function TryRow({ entry, onPress }: { entry: TryEntry; onPress: () => void }) {
  const thumb = entry.photo_url ?? entry.recipe?.cover_image_url;
  const rc = ratingColor(entry.rating);

  return (
    <Pressable style={rowStyles.row} onPress={onPress}>
      {/* Thumbnail */}
      <View style={rowStyles.thumbWrap}>
        {thumb ? (
          <Image source={{ uri: thumb }} style={rowStyles.thumb} contentFit="cover" />
        ) : (
          <View style={[rowStyles.thumb, rowStyles.thumbFallback]}>
            <Ionicons name="restaurant-outline" size={18} color={colors.muted} />
          </View>
        )}
        {/* photo indicator dot */}
        {entry.photo_url && (
          <View style={rowStyles.photoDot} />
        )}
      </View>

      {/* Content */}
      <View style={rowStyles.content}>
        <Text style={rowStyles.title} numberOfLines={1}>
          {entry.recipe?.title ?? 'Deleted recipe'}
        </Text>
        <View style={rowStyles.metaRow}>
          {entry.recipe?.cuisine && (
            <Text style={rowStyles.cuisine}>{entry.recipe.cuisine}</Text>
          )}
          <Text style={rowStyles.date}>{formatDate(entry.tried_at)}</Text>
        </View>
        {entry.note ? (
          <Text style={rowStyles.note} numberOfLines={2}>{entry.note}</Text>
        ) : null}
      </View>

      {/* Rating */}
      <View style={[rowStyles.ratingBadge, { borderColor: rc + '40', backgroundColor: rc + '12' }]}>
        <Text style={[rowStyles.ratingNum, { color: rc }]}>{entry.rating.toFixed(1)}</Text>
        <Text style={[rowStyles.ratingOf, { color: rc }]}>/10</Text>
      </View>
    </Pressable>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
    gap: 12,
  },
  thumbWrap: {
    position: 'relative',
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: radius.sm,
  },
  thumbFallback: {
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoDot: {
    position: 'absolute',
    bottom: 3,
    right: 3,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.sage,
    borderWidth: 1.5,
    borderColor: colors.card,
  },
  content: {
    flex: 1,
    gap: 3,
    paddingTop: 1,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    color: colors.ink,
    letterSpacing: -0.2,
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cuisine: {
    fontFamily: 'Inter_500Medium',
    fontSize: 10,
    color: colors.muted,
    letterSpacing: 0.3,
  },
  date: {
    fontFamily: 'Inter_500Medium',
    fontSize: 10,
    color: colors.muted,
  },
  note: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: colors.inkSoft,
    lineHeight: 17,
    marginTop: 2,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: 1,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  ratingNum: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 16,
    letterSpacing: -0.5,
  },
  ratingOf: {
    fontFamily: 'Inter_500Medium',
    fontSize: 9,
    opacity: 0.65,
  },
});

// ─── Section header ───────────────────────────────────────────────────────
function SectionHeader({ title, count }: { title: string; count: number }) {
  return (
    <View style={sectionStyles.wrap}>
      <Text style={sectionStyles.title}>{title.toUpperCase()}</Text>
      <View style={sectionStyles.line} />
      <Text style={sectionStyles.count}>{count}</Text>
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 24,
    paddingBottom: 4,
    backgroundColor: colors.bone,
  },
  title: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 10,
    color: colors.muted,
    letterSpacing: 1.5,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: colors.borderSoft,
  },
  count: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    color: colors.muted,
  },
});

// ─── Screen ───────────────────────────────────────────────────────────────
export default function MyTriesScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const { data: tries = [], isLoading } = useQuery({
    queryKey: ['my-tries', user?.id],
    queryFn: () => fetchMyTries(user!.id),
    enabled: !!user,
  });

  const sections = useMemo<Section[]>(() => {
    const map = new Map<string, TryEntry[]>();
    for (const t of tries) {
      const key = monthKey(t.tried_at);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    }
    return Array.from(map.entries()).map(([title, data]) => ({ title, data }));
  }, [tries]);

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="arrow-back" size={22} color={colors.ink} />
        </Pressable>
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={styles.heading}>My Tries</Text>
          {!isLoading && (
            <Text style={styles.subheading}>
              {tries.length} cook{tries.length !== 1 ? 's' : ''} logged
            </Text>
          )}
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.sage} style={{ marginTop: 48 }} />
      ) : tries.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>No tries yet</Text>
          <Text style={styles.emptyBody}>
            When you log a cook, it shows up here as a personal record.
          </Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled
          renderSectionHeader={({ section }) => (
            <SectionHeader title={section.title} count={section.data.length} />
          )}
          renderItem={({ item }) => (
            <TryRow
              entry={item}
              onPress={() => router.push(`/recipe/${item.recipe_id}` as any)}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bone },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
  },
  heading: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 20,
    color: colors.ink,
    letterSpacing: -0.5,
  },
  subheading: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: colors.muted,
    marginTop: 1,
  },
  listContent: {
    paddingHorizontal: 22,
    paddingBottom: 120,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingBottom: 60,
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
