// app/(tabs)/kitchen.tsx
// Your cookbook. Queue (saved_recipes) + My Recipes (created_by = me)
// + a small link to the Fridge sub-screen.
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';
import { RecipeCard } from '@/components/RecipeCard';
import { EditorialHeading } from '@/components/EditorialHeading';
import { colors, radius } from '@/lib/theme';

async function fetchQueue(userId: string) {
  const { data, error } = await supabase
    .from('saved_recipes')
    .select('id, recipe:recipes(*)')
    .eq('user_id', userId)
    .order('saved_at', { ascending: false });
  if (error) throw error;
  return (data ?? [])
    .map((row: any) => ({ savedId: row.id, recipe: row.recipe }))
    .filter((row: any) => !!row.recipe);
}

async function fetchMyRecipes(userId: string) {
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('created_by', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export default function KitchenScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const { data: queue, isLoading: queueLoading } = useQuery({
    queryKey: ['kitchen-queue', user?.id],
    queryFn: () => fetchQueue(user!.id),
    enabled: !!user,
  });

  const { data: myRecipes, isLoading: recipesLoading } = useQuery({
    queryKey: ['kitchen-my-recipes', user?.id],
    queryFn: () => fetchMyRecipes(user!.id),
    enabled: !!user,
  });

  const removeFromQueue = useMutation({
    mutationFn: async (savedId: string) => {
      const { error } = await supabase
        .from('saved_recipes')
        .delete()
        .eq('id', savedId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kitchen-queue', user?.id] });
    },
  });

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 120, paddingTop: 6 }}>
        <EditorialHeading size={30} emphasis="Kitchen" emphasisColor="sage">
          {'Your\n'}
        </EditorialHeading>

        {/* Queue section */}
        <View style={styles.sectionHead}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Text style={styles.sectionTitle}>Cooking soon</Text>
            <View style={styles.countPill}>
              <Text style={styles.countPillText}>{(queue ?? []).length}</Text>
            </View>
          </View>
          <Pressable
            style={styles.fridgeLink}
            onPress={() => router.push('/fridge' as any)}
            hitSlop={6}
          >
            <Text style={styles.fridgeLinkText}>🧊 Fridge →</Text>
          </Pressable>
        </View>

        {queueLoading ? (
          <ActivityIndicator color={colors.sage} />
        ) : (queue ?? []).length === 0 ? (
          <Text style={styles.empty}>
            Save recipes you want to try — they'll show up here.
          </Text>
        ) : (
          (queue ?? []).map((row: any) => (
            <View key={row.savedId} style={styles.queueItem}>
              <RecipeCard recipe={row.recipe} variant="plate" />
              <Pressable
                style={styles.removeBtn}
                onPress={() => removeFromQueue.mutate(row.savedId)}
                hitSlop={8}
              >
                <Text style={styles.removeBtnText}>×</Text>
              </Pressable>
            </View>
          ))
        )}

        {/* My Recipes section */}
        <View style={[styles.sectionHead, { marginTop: 28 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Text style={styles.sectionTitle}>Your recipes</Text>
            <View style={styles.countPill}>
              <Text style={styles.countPillText}>{(myRecipes ?? []).length}</Text>
            </View>
          </View>
        </View>

        {recipesLoading ? (
          <ActivityIndicator color={colors.sage} />
        ) : (myRecipes ?? []).length === 0 ? (
          <Text style={styles.empty}>
            No recipes yet. Tap the + button to add your first.
          </Text>
        ) : (
          (myRecipes ?? []).map((r: any) => {
            const isDraft = r.is_public === false;
            const isImported = r.source_type && r.source_type !== 'manual';
            return (
              <View key={r.id}>
                {(isDraft || isImported) && (
                  <View style={styles.badgeRow}>
                    {isDraft && (
                      <View style={[styles.badge, { backgroundColor: colors.ochreSoft }]}>
                        <Text style={[styles.badgeText, { color: colors.ochre }]}>DRAFT</Text>
                      </View>
                    )}
                    {isImported && (
                      <View style={[styles.badge, { backgroundColor: colors.borderSoft }]}>
                        <Text style={[styles.badgeText, { color: colors.muted }]}>
                          IMPORTED
                        </Text>
                      </View>
                    )}
                  </View>
                )}
                <RecipeCard recipe={r} variant="plate" />
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bone },
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 16,
    color: colors.ink,
    letterSpacing: -0.3,
  },
  countPill: {
    backgroundColor: colors.sageSoft,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  countPillText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    color: colors.sage,
    letterSpacing: 0.3,
  },
  fridgeLink: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  fridgeLinkText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
    color: colors.clay,
    letterSpacing: -0.2,
  },
  queueItem: { position: 'relative' },
  removeBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  removeBtnText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: colors.muted,
    lineHeight: 18,
  },
  empty: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: colors.muted,
    marginBottom: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  badgeText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 9,
    letterSpacing: 0.8,
  },
});
