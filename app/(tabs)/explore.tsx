// Explore — palate-match grid. One surface, one job.
import {
  View,
  Text,
  FlatList,
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
import { colors, radius } from '@/lib/theme';
import { parsePalate, matchScore } from '@/lib/palate';

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
          <View style={styles.cardWrap}>
            {item.match_score != null && (
              <View style={styles.matchPill}>
                <Text style={styles.matchPillText}>{item.match_score}% match</Text>
              </View>
            )}
            <RecipeCard recipe={item} showCreator />
          </View>
        )}
        contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 100 }}
        ListHeaderComponent={
          <View style={{ paddingTop: 6, paddingBottom: 14 }}>
            <EditorialHeading size={26} emphasis="palate" emphasisColor="sage">
              {'For your\n'}
            </EditorialHeading>
            <Text style={styles.subtitle}>
              recipes ranked by how well they match your taste
            </Text>
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
  cardWrap: {
    marginBottom: 14,
    position: 'relative',
  },
  matchPill: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 2,
    backgroundColor: colors.ochreSoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  matchPillText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    color: colors.ochre,
    letterSpacing: 0.3,
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
});
