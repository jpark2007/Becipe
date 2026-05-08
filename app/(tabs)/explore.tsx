// Explore — palate-match grid. One surface, one job.
import {
  View,
  Text,
  FlatList,
  ScrollView,
  Image,
  ActivityIndicator,
  Pressable,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';
import { RecipeCard } from '@/components/RecipeCard';
import { EditorialHeading } from '@/components/EditorialHeading';
import { colors, radius, shadow } from '@/lib/theme';
import { parsePalate, matchScore } from '@/lib/palate';
import { InboxIcon } from '@/components/InboxIcon';

async function fetchPublicRecipes() {
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
    };
  });
}

function CarouselSection({
  title,
  data,
  onPress,
}: {
  title: string;
  data: any[];
  onPress: (id: string) => void;
}) {
  if (!data?.length) return null;
  return (
    <View style={styles.carouselSection}>
      <Text style={styles.carouselTitle}>{title}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
      >
        {data.map((recipe) => (
          <Pressable
            key={recipe.id}
            style={styles.carouselCard}
            onPress={() => onPress(recipe.id)}
          >
            {recipe.cover_image_url ? (
              <Image
                source={{ uri: recipe.cover_image_url }}
                style={styles.carouselImage}
              />
            ) : (
              <View style={[styles.carouselImage, styles.carouselFallback]}>
                <Text style={styles.carouselFallbackText}>
                  {recipe.cuisine ?? '🍽'}
                </Text>
              </View>
            )}
            <View style={styles.carouselInfo}>
              <Text style={styles.carouselName} numberOfLines={2}>
                {recipe.title}
              </Text>
              {recipe.match_score != null && (
                <View style={styles.matchBadge}>
                  <Text style={styles.matchBadgeText}>
                    {Math.round(recipe.match_score)}% match
                  </Text>
                </View>
              )}
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

export default function ExploreScreen() {
  const router = useRouter();
  const storedPalate = useAuthStore((s) => s.profile?.palate_vector);
  const userPalate = parsePalate(storedPalate);

  const { data: recipes, isLoading } = useQuery({
    queryKey: ['explore-palate'],
    queryFn: fetchPublicRecipes,
  });

  const ranked = (recipes ?? [])
    .map((r: any) => {
      const score = matchScore(userPalate, parsePalate(r.palate_vector));
      return { ...r, match_score: score };
    })
    .sort((a: any, b: any) => (b.match_score ?? -1) - (a.match_score ?? -1))
    .slice(0, 50);

  // Carousel data derived from ranked list
  const bestForPalate = ranked.slice(0, 8);
  const quickEasy = ranked
    .filter((r: any) => {
      const time = r.total_time_min || r.cook_time_min || 999;
      return time <= 30;
    })
    .slice(0, 10);
  const trending = [...ranked]
    .sort((a: any, b: any) => (b.try_count ?? 0) - (a.try_count ?? 0))
    .slice(0, 10);
  const cuisineGroups = new Map<string, any[]>();
  for (const r of ranked) {
    if (!r.cuisine) continue;
    const arr = cuisineGroups.get(r.cuisine) || [];
    arr.push(r);
    cuisineGroups.set(r.cuisine, arr);
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.sage} />
        </View>
      </SafeAreaView>
    );
  }

  if (!userPalate) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>Finish your palate quiz</Text>
          <Text style={styles.emptyBody}>
            We'll rank recipes based on how well they match your taste.
          </Text>
          <Pressable
            style={styles.cta}
            onPress={() => router.push('/(onboarding)/palate-quiz' as any)}
          >
            <Text style={styles.ctaText}>Take the quiz →</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={ranked}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <RecipeCard
            recipe={item}
            showCreator
            matchScore={item.match_score}
          />
        )}
        contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 100 }}
        ListHeaderComponent={
          <View style={{ marginHorizontal: -22 }}>
            <View style={{ paddingTop: 6, paddingBottom: 14, paddingHorizontal: 22 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1 }}>
                  <EditorialHeading size={26} emphasis="palate" emphasisColor="sage">
                    {'For your\n'}
                  </EditorialHeading>
                </View>
                <InboxIcon />
              </View>
              <Text style={styles.subtitle}>
                recipes ranked by how well they match your taste
              </Text>
            </View>
            <CarouselSection
              title="Best for your palate"
              data={bestForPalate}
              onPress={(id) => router.push(`/recipe/${id}` as any)}
            />
            <CarouselSection
              title="Quick & easy"
              data={quickEasy}
              onPress={(id) => router.push(`/recipe/${id}` as any)}
            />
            <CarouselSection
              title="Trending"
              data={trending}
              onPress={(id) => router.push(`/recipe/${id}` as any)}
            />
            {Array.from(cuisineGroups.entries()).map(([cuisine, recipes]) => (
              <CarouselSection
                key={cuisine}
                title={cuisine}
                data={recipes.slice(0, 8)}
                onPress={(id) => router.push(`/recipe/${id}` as any)}
              />
            ))}
            <Text style={styles.allRecipesLabel}>All recipes</Text>
          </View>
        }
        ListEmptyComponent={
          <Text style={styles.empty}>No public recipes yet — try adding one.</Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bone },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  subtitle: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: colors.muted,
    marginTop: 6,
    marginBottom: 6,
  },
  empty: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
    marginTop: 48,
  },
  emptyTitle: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 22,
    color: colors.ink,
    marginBottom: 10,
    letterSpacing: -0.4,
  },
  emptyBody: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  cta: {
    backgroundColor: colors.sage,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: radius.pill,
  },
  ctaText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
    color: '#fff',
  },
  allRecipesLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: 17,
    color: colors.ink,
    paddingHorizontal: 22,
    marginTop: 8,
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  // Carousel styles
  carouselSection: {
    marginBottom: 20,
  },
  carouselTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 17,
    color: colors.ink,
    paddingHorizontal: 16,
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  carouselCard: {
    width: 150,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  carouselImage: {
    width: 150,
    height: 110,
  },
  carouselFallback: {
    backgroundColor: colors.sageSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  carouselFallbackText: {
    fontSize: 24,
  },
  carouselInfo: {
    padding: 10,
  },
  carouselName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: colors.ink,
    lineHeight: 17,
    letterSpacing: -0.2,
  },
  matchBadge: {
    backgroundColor: colors.sageSoft,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  matchBadgeText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    color: colors.sage,
  },
});
