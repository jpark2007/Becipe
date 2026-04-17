// app/fridge.tsx
// Device-local fridge utility. Root-level stack push from Kitchen.
// Users add ingredients (autocomplete from lib/ingredients), remove them
// with ×, and tap "What can I make tonight?" to filter Queue + My Recipes
// by fridge coverage (>=60% match).
import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';
import { colors, radius, shadow } from '@/lib/theme';
import { INGREDIENTS_SORTED } from '@/lib/ingredients';
import { EditorialHeading } from '@/components/EditorialHeading';
import {
  getFridge,
  addToFridge,
  removeFromFridge,
  type FridgeItem,
} from '@/lib/fridge-store';

type MatchableRecipe = {
  id: string;
  title: string;
  ingredients: any[] | null;
  source: 'queue' | 'mine';
};

async function fetchMatchableRecipes(userId: string): Promise<MatchableRecipe[]> {
  const [queueRes, mineRes] = await Promise.all([
    supabase
      .from('saved_recipes')
      .select('recipe:recipes(id, title, ingredients)')
      .eq('user_id', userId),
    supabase
      .from('recipes')
      .select('id, title, ingredients')
      .eq('created_by', userId),
  ]);

  const results: MatchableRecipe[] = [];
  for (const row of (queueRes.data ?? []) as any[]) {
    const r = row.recipe;
    if (r?.id) results.push({ ...r, source: 'queue' });
  }
  for (const r of (mineRes.data ?? []) as any[]) {
    if (r?.id) results.push({ ...r, source: 'mine' });
  }
  return results;
}

function normalizeIng(name: string): string {
  return name.toLowerCase().trim();
}

function matchPercent(recipe: MatchableRecipe, fridgeNames: Set<string>): number {
  const ings = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
  if (ings.length === 0) return 0;
  let hit = 0;
  for (const ing of ings) {
    const raw = typeof ing === 'string' ? ing : ing?.name ?? '';
    const needle = normalizeIng(String(raw));
    if (!needle) continue;
    let matched = false;
    for (const have of fridgeNames) {
      if (needle.includes(have) || have.includes(needle)) {
        matched = true;
        break;
      }
    }
    if (matched) hit++;
  }
  return Math.round((hit / ings.length) * 100);
}

export default function FridgeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [items, setItems] = useState<FridgeItem[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [showMatches, setShowMatches] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    getFridge(user.id).then((list) => {
      setItems(list);
      setLoading(false);
    });
  }, [user?.id]);

  const suggestions = useMemo(() => {
    const q = text.trim().toLowerCase();
    if (!q) return [] as string[];
    return INGREDIENTS_SORTED.filter((s) => s.toLowerCase().includes(q)).slice(0, 8);
  }, [text]);

  async function add(name: string) {
    if (!user?.id) return;
    const next = await addToFridge(user.id, name);
    setItems(next);
    setText('');
  }

  async function remove(name: string) {
    if (!user?.id) return;
    const next = await removeFromFridge(user.id, name);
    setItems(next);
  }

  const { data: matchables } = useQuery({
    queryKey: ['fridge-matchables', user?.id],
    queryFn: () => fetchMatchableRecipes(user!.id),
    enabled: !!user && showMatches,
  });

  const ranked = useMemo(() => {
    if (!matchables) return [] as (MatchableRecipe & { match: number })[];
    const set = new Set(items.map((it) => normalizeIng(it.name)));
    return matchables
      .map((r) => ({ ...r, match: matchPercent(r, set) }))
      .filter((r) => r.match >= 60)
      .sort((a, b) => b.match - a.match);
  }, [matchables, items]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 120, paddingTop: 6 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.head}>
          <Pressable style={styles.iconBtn} onPress={() => router.back()}>
            <Text style={styles.iconBtnText}>←</Text>
          </Pressable>
        </View>

        <EditorialHeading size={30} emphasis="Fridge" emphasisColor="clay">
          {'Your\n'}
        </EditorialHeading>
        <Text style={styles.subtitle}>
          Add what you have on hand, then see what you can cook.
        </Text>

        {/* Add input */}
        <View style={styles.inputWrap}>
          <TextInput
            style={styles.input}
            placeholder="Add an ingredient"
            placeholderTextColor={colors.muted}
            value={text}
            onChangeText={setText}
            onSubmitEditing={() => add(text)}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
          />
          <Pressable
            style={[styles.addBtn, !text.trim() && styles.btnDisabled]}
            disabled={!text.trim()}
            onPress={() => add(text)}
          >
            <Text style={styles.addBtnText}>Add</Text>
          </Pressable>
        </View>

        {suggestions.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
            {suggestions.map((s) => (
              <Pressable key={s} style={styles.suggestion} onPress={() => add(s)}>
                <Text style={styles.suggestionText}>{s}</Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        {/* Items list */}
        {loading ? (
          <ActivityIndicator color={colors.sage} />
        ) : items.length === 0 ? (
          <Text style={styles.empty}>
            Add what's in your fridge to see what you can cook.
          </Text>
        ) : (
          <View style={{ marginTop: 8 }}>
            {items.map((it) => (
              <View key={it.name} style={styles.itemRow}>
                <Text style={styles.itemName}>{it.name}</Text>
                <Pressable style={styles.remove} onPress={() => remove(it.name)} hitSlop={6}>
                  <Text style={styles.removeText}>×</Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}

        {/* What can I make tonight CTA */}
        {items.length > 0 && (
          <Pressable
            style={styles.primaryBtn}
            onPress={() => setShowMatches(true)}
          >
            <Text style={styles.primaryBtnText}>What can I make tonight?</Text>
          </Pressable>
        )}

        {showMatches && (
          <View style={{ marginTop: 20 }}>
            <Text style={styles.sectionLabel}>matches</Text>
            {ranked.length === 0 ? (
              <Text style={styles.empty}>
                Nothing matches ≥60% yet — add a few more ingredients.
              </Text>
            ) : (
              ranked.map((r) => (
                <Pressable
                  key={r.id + r.source}
                  style={styles.matchRow}
                  onPress={() => router.push(`/recipe/${r.id}` as any)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.matchTitle} numberOfLines={1}>{r.title}</Text>
                    <Text style={styles.matchSource}>
                      {r.source === 'queue' ? 'from your queue' : 'from your recipes'}
                    </Text>
                  </View>
                  <View style={styles.matchPill}>
                    <Text style={styles.matchPillText}>{r.match}%</Text>
                  </View>
                </Pressable>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bone },
  head: { flexDirection: 'row', paddingTop: 4, paddingBottom: 10 },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.card,
    alignItems: 'center', justifyContent: 'center',
    ...shadow.cta,
  },
  iconBtnText: { fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.ink },
  subtitle: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: colors.muted,
    marginTop: 6,
    marginBottom: 16,
  },
  inputWrap: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: colors.ink,
  },
  addBtn: {
    backgroundColor: colors.clay,
    borderRadius: radius.pill,
    paddingHorizontal: 18,
    paddingVertical: 12,
    ...shadow.cta,
  },
  btnDisabled: { opacity: 0.5 },
  addBtnText: { fontFamily: 'Inter_700Bold', fontSize: 13, color: '#fff' },
  suggestion: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 6,
  },
  suggestionText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: colors.inkSoft,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
  },
  itemName: {
    flex: 1,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: colors.ink,
  },
  remove: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeText: { fontFamily: 'Inter_700Bold', fontSize: 18, color: colors.muted },
  empty: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: colors.muted,
    marginVertical: 12,
  },
  primaryBtn: {
    marginTop: 16,
    backgroundColor: colors.clay,
    paddingVertical: 16,
    borderRadius: radius.pill,
    alignItems: 'center',
    ...shadow.cta,
  },
  primaryBtnText: { fontFamily: 'Inter_800ExtraBold', fontSize: 15, color: '#fff' },
  sectionLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    color: colors.muted,
    letterSpacing: 1.0,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  matchTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    color: colors.ink,
  },
  matchSource: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },
  matchPill: {
    backgroundColor: colors.sageSoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  matchPillText: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 11,
    color: colors.sage,
    letterSpacing: 0.3,
  },
});
