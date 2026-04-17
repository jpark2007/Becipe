// app/add-recipe.tsx
// Full add-recipe form. Lifted and simplified from the deleted
// app/(tabs)/add.tsx. Single surface: paste-link input at top, then
// manual fields, draft/publish toggle, save button.
import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';
import { queryClient } from '@/lib/query-client';
import type { Ingredient, Step, Tip } from '@/lib/database.types';
import { INGREDIENTS_SORTED } from '@/lib/ingredients';
import { CUISINES } from '@/lib/smart-sort';
import { colors, radius, shadow } from '@/lib/theme';
import { EditorialHeading } from '@/components/EditorialHeading';

type Difficulty = 'easy' | 'medium' | 'hard';

function isSocialUrl(url: string): boolean {
  return /tiktok\.com|instagram\.com|facebook\.com|fb\.watch|twitter\.com|x\.com|youtube\.com|youtu\.be/.test(url);
}

export default function AddRecipeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [importUrl, setImportUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState('');
  const [saving, setSaving] = useState(false);

  // Recipe fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [cuisine, setCuisine] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [prepTime, setPrepTime] = useState('');
  const [cookTime, setCookTime] = useState('');
  const [servings, setServings] = useState('');
  const [ingredients, setIngredients] = useState<Ingredient[]>([{ amount: '', unit: '', name: '' }]);
  const [steps, setSteps] = useState<Step[]>([{ order: 1, instruction: '' }]);
  const [tips, setTips] = useState<Tip[]>([]);
  const [sourceUrl, setSourceUrl] = useState('');
  const [sourceName, setSourceName] = useState('');
  const [sourceCredit, setSourceCredit] = useState('');
  const [sourceType, setSourceType] = useState<'manual' | 'url' | 'tiktok' | 'instagram' | 'facebook' | 'x' | 'youtube'>('manual');
  const [publish, setPublish] = useState(false);
  const [activeIngIdx, setActiveIngIdx] = useState<number | null>(null);

  function applyParsedData(data: any, targetUrl: string) {
    setTitle(data.title ?? '');
    setDescription(data.description ?? '');
    setCuisine(data.cuisine ?? '');
    setPrepTime(data.prep_time_min != null ? String(data.prep_time_min) : '');
    setCookTime(data.cook_time_min != null ? String(data.cook_time_min) : '');
    setServings(data.servings != null ? String(data.servings) : '');
    setIngredients(data.ingredients?.length ? data.ingredients : [{ amount: '', unit: '', name: '' }]);
    setSteps(data.steps?.length ? data.steps : [{ order: 1, instruction: '' }]);
    setTips(data.tips ?? []);
    setSourceUrl(data.source_url ?? targetUrl);
    setSourceName(data.source_name ?? '');
    setSourceCredit(data.source_credit ?? '');
    setSourceType(data.source_type ?? 'url');
  }

  async function handleImport() {
    const targetUrl = importUrl.trim();
    if (!targetUrl) return;

    setImporting(true);
    setImportError('');
    try {
      const fnName = isSocialUrl(targetUrl) ? 'parse-video' : 'parse-recipe';
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
      const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';
      const fnUrl = `${supabaseUrl}/functions/v1/${fnName}`;

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 30000);
      try {
        const res = await fetch(fnUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey,
          },
          body: JSON.stringify({ url: targetUrl }),
          signal: controller.signal,
        });
        clearTimeout(timer);
        if (!res.ok) {
          throw new Error(`Import failed (${res.status})`);
        }
        const data = await res.json();
        if (!data) throw new Error('Empty response');
        applyParsedData(data, targetUrl);
      } finally {
        clearTimeout(timer);
      }
    } catch (err: any) {
      const msg = err.message ?? '';
      if (msg.includes('abort') || msg.includes('Abort')) {
        setImportError('Import timed out — try again.');
      } else {
        setImportError("Couldn't import that link. You can fill in the recipe manually below.");
      }
    } finally {
      setImporting(false);
    }
  }

  function validate(): string | null {
    const cleanTitle = title.trim();
    if (!cleanTitle) return 'Please give your recipe a title.';
    if (publish) {
      const hasIngredient = ingredients.some((i) => i.name.trim().length > 0);
      const hasStep = steps.some((s) => s.instruction.trim().length > 0);
      if (!hasIngredient) return 'Add at least one ingredient to publish.';
      if (!hasStep) return 'Add at least one step to publish.';
    }
    return null;
  }

  async function handleSave() {
    const err = validate();
    if (err) {
      setImportError(err);
      return;
    }
    if (!user) return;
    setSaving(true);
    setImportError('');

    try {
      const payload: any = {
        created_by: user.id,
        title: title.trim().slice(0, 200),
        description: description.trim().slice(0, 2000) || null,
        cuisine: cuisine || null,
        difficulty,
        prep_time_min: prepTime ? parseInt(prepTime, 10) : null,
        cook_time_min: cookTime ? parseInt(cookTime, 10) : null,
        servings: servings ? parseInt(servings, 10) : null,
        ingredients: ingredients
          .filter((i) => i.name.trim())
          .map((i) => ({
            amount: i.amount.trim().slice(0, 50),
            unit: i.unit.trim().slice(0, 50),
            name: i.name.trim().slice(0, 500),
          })),
        steps: steps
          .filter((s) => s.instruction.trim())
          .map((s) => ({ order: s.order, instruction: s.instruction.trim().slice(0, 2000) })),
        tips: tips
          .filter((t) => t.text.trim())
          .map((t) => ({ text: t.text.trim().slice(0, 1000) })),
        source_url: sourceUrl || null,
        source_name: sourceName || null,
        source_credit: sourceCredit || null,
        source_type: sourceType,
        is_public: publish,
        tags: cuisine ? [cuisine.toLowerCase()] : [],
      };

      const { error } = await (supabase.from('recipes') as any).insert(payload);
      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['kitchen-my-recipes'] });
      queryClient.invalidateQueries({ queryKey: ['discover'] });
      queryClient.invalidateQueries({ queryKey: ['explore'] });
      router.replace('/(tabs)/kitchen' as any);
    } catch (e: any) {
      Alert.alert('Save failed', e.message ?? 'Unknown error');
    } finally {
      setSaving(false);
    }
  }

  const canPublish = publish
    ? title.trim().length > 0 &&
      ingredients.some((i) => i.name.trim().length > 0) &&
      steps.some((s) => s.instruction.trim().length > 0)
    : title.trim().length > 0;

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.headRow}>
            <Pressable style={styles.iconBtn} onPress={() => router.back()}>
              <Text style={styles.iconBtnText}>←</Text>
            </Pressable>
            <Pressable
              style={styles.iconBtn}
              onPress={() => router.push('/voice-dictate' as any)}
            >
              <MaterialCommunityIcons name="waveform" size={22} color={colors.ink} />
            </Pressable>
          </View>

          <EditorialHeading size={26} emphasis="recipe" emphasisColor="clay">
            {'Add a\n'}
          </EditorialHeading>
          <Text style={styles.subtitle}>paste a link or fill it in manually</Text>

          {/* Paste a link */}
          <View style={styles.fieldCard}>
            <Text style={styles.fieldLabel}>paste a link</Text>
            <TextInput
              style={styles.inputInline}
              placeholder="Paste a TikTok or recipe URL"
              placeholderTextColor={colors.muted}
              value={importUrl}
              onChangeText={setImportUrl}
              autoCapitalize="none"
              keyboardType="url"
            />
            {importUrl.trim().length > 0 && (
              <Pressable
                style={[styles.importBtn, importing && styles.btnDisabled]}
                onPress={handleImport}
                disabled={importing}
              >
                {importing ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.importBtnText}>Import →</Text>
                )}
              </Pressable>
            )}
          </View>

          {sourceCredit ? (
            <View style={styles.creditCard}>
              <Text style={styles.fieldLabel}>credit</Text>
              <Text style={styles.creditText}>
                {sourceCredit}
                {sourceName ? ` on ${sourceName}` : ''}
              </Text>
            </View>
          ) : null}

          {/* Title */}
          <View style={styles.fieldCard}>
            <Text style={styles.fieldLabel}>title</Text>
            <TextInput
              style={styles.titleInput}
              placeholder="recipe title"
              placeholderTextColor={colors.muted}
              value={title}
              onChangeText={setTitle}
            />
          </View>

          {/* Description */}
          <View style={styles.fieldCard}>
            <Text style={styles.fieldLabel}>description</Text>
            <TextInput
              style={styles.inputInline}
              placeholder="description (optional)"
              placeholderTextColor={colors.muted}
              value={description}
              onChangeText={setDescription}
              multiline
            />
          </View>

          {/* Meta row */}
          <View style={styles.metaRow}>
            <View style={[styles.fieldCard, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>prep</Text>
              <TextInput
                style={styles.inputInline}
                placeholder="—"
                placeholderTextColor={colors.muted}
                value={prepTime}
                onChangeText={setPrepTime}
                keyboardType="number-pad"
              />
            </View>
            <View style={[styles.fieldCard, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>cook</Text>
              <TextInput
                style={styles.inputInline}
                placeholder="—"
                placeholderTextColor={colors.muted}
                value={cookTime}
                onChangeText={setCookTime}
                keyboardType="number-pad"
              />
            </View>
            <View style={[styles.fieldCard, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>serves</Text>
              <TextInput
                style={styles.inputInline}
                placeholder="—"
                placeholderTextColor={colors.muted}
                value={servings}
                onChangeText={setServings}
                keyboardType="number-pad"
              />
            </View>
          </View>

          {/* Difficulty */}
          <Text style={styles.blockLabel}>difficulty</Text>
          <View style={styles.chipsRow}>
            {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => {
              const active = difficulty === d;
              return (
                <Pressable
                  key={d}
                  onPress={() => setDifficulty(d)}
                  style={[styles.chip, active ? styles.chipActive : styles.chipInactive]}
                >
                  <Text style={[styles.chipText, active ? styles.chipTextActive : styles.chipTextInactive]}>
                    {d}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Cuisine */}
          <Text style={styles.blockLabel}>cuisine</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
            {CUISINES.filter((c) => c !== 'All').map((c) => {
              const active = cuisine === c;
              return (
                <Pressable
                  key={c}
                  onPress={() => setCuisine(cuisine === c ? '' : c)}
                  style={[styles.chip, active ? styles.chipActive : styles.chipInactive]}
                >
                  <Text style={[styles.chipText, active ? styles.chipTextActive : styles.chipTextInactive]}>
                    {c}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Ingredients */}
          <Text style={styles.blockLabel}>ingredients</Text>
          {ingredients.map((ing, i) => {
            const suggestions =
              activeIngIdx === i && ing.name.trim().length > 0
                ? INGREDIENTS_SORTED.filter((s: string) =>
                    s.toLowerCase().includes(ing.name.toLowerCase())
                  ).slice(0, 6)
                : [];
            return (
              <View key={i}>
                <View style={styles.ingredientRow}>
                  <TextInput
                    style={[styles.smallInput, { width: 56 }]}
                    placeholder="amt"
                    placeholderTextColor={colors.muted}
                    value={ing.amount}
                    onChangeText={(v) => {
                      const next = [...ingredients];
                      next[i] = { ...next[i], amount: v };
                      setIngredients(next);
                    }}
                  />
                  <TextInput
                    style={[styles.smallInput, { width: 56 }]}
                    placeholder="unit"
                    placeholderTextColor={colors.muted}
                    value={ing.unit}
                    onChangeText={(v) => {
                      const next = [...ingredients];
                      next[i] = { ...next[i], unit: v };
                      setIngredients(next);
                    }}
                  />
                  <TextInput
                    style={[styles.smallInput, { flex: 1 }]}
                    placeholder="ingredient"
                    placeholderTextColor={colors.muted}
                    value={ing.name}
                    onFocus={() => setActiveIngIdx(i)}
                    onBlur={() => setActiveIngIdx(null)}
                    onChangeText={(v) => {
                      const next = [...ingredients];
                      next[i] = { ...next[i], name: v };
                      setIngredients(next);
                      setActiveIngIdx(i);
                    }}
                  />
                  {ingredients.length > 1 && (
                    <Pressable
                      style={styles.removeBtn}
                      onPress={() =>
                        setIngredients((prev) => prev.filter((_, idx) => idx !== i))
                      }
                    >
                      <Text style={styles.removeBtnText}>×</Text>
                    </Pressable>
                  )}
                </View>
                {suggestions.length > 0 && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 6 }}>
                    {suggestions.map((s: string) => (
                      <Pressable
                        key={s}
                        style={[styles.chip, styles.chipInactive, { marginRight: 6 }]}
                        onPress={() => {
                          const next = [...ingredients];
                          next[i] = { ...next[i], name: s };
                          setIngredients(next);
                          setActiveIngIdx(null);
                        }}
                      >
                        <Text style={[styles.chipText, styles.chipTextInactive]}>{s}</Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                )}
              </View>
            );
          })}
          <Pressable
            style={{ paddingVertical: 10, marginBottom: 20 }}
            onPress={() => setIngredients((prev) => [...prev, { amount: '', unit: '', name: '' }])}
          >
            <Text style={styles.linkText}>+ add ingredient</Text>
          </Pressable>

          {/* Steps */}
          <Text style={styles.blockLabel}>steps</Text>
          {steps.map((step, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={styles.stepNum}>
                <Text style={styles.stepNumText}>{i + 1}</Text>
              </View>
              <TextInput
                style={[styles.smallInput, { flex: 1 }]}
                placeholder={`step ${i + 1}…`}
                placeholderTextColor={colors.muted}
                value={step.instruction}
                onChangeText={(v) => {
                  const next = [...steps];
                  next[i] = { ...next[i], instruction: v };
                  setSteps(next);
                }}
                multiline
              />
              {steps.length > 1 && (
                <Pressable
                  style={styles.removeBtn}
                  onPress={() =>
                    setSteps((prev) =>
                      prev
                        .filter((_, idx) => idx !== i)
                        .map((s, idx) => ({ ...s, order: idx + 1 }))
                    )
                  }
                >
                  <Text style={styles.removeBtnText}>×</Text>
                </Pressable>
              )}
            </View>
          ))}
          <Pressable
            style={{ paddingVertical: 10, marginBottom: 20 }}
            onPress={() => setSteps((prev) => [...prev, { order: prev.length + 1, instruction: '' }])}
          >
            <Text style={styles.linkText}>+ add step</Text>
          </Pressable>

          {/* Tips */}
          <Text style={styles.blockLabel}>tips & notes (optional)</Text>
          {tips.map((tip, i) => (
            <View key={i} style={styles.ingredientRow}>
              <TextInput
                style={[styles.smallInput, { flex: 1 }]}
                placeholder="tip…"
                placeholderTextColor={colors.muted}
                value={tip.text}
                onChangeText={(v) => {
                  const next = [...tips];
                  next[i] = { text: v };
                  setTips(next);
                }}
                multiline
              />
              <Pressable
                style={styles.removeBtn}
                onPress={() => setTips((prev) => prev.filter((_, idx) => idx !== i))}
              >
                <Text style={styles.removeBtnText}>×</Text>
              </Pressable>
            </View>
          ))}
          <Pressable
            style={{ paddingVertical: 10, marginBottom: 16 }}
            onPress={() => setTips((prev) => [...prev, { text: '' }])}
          >
            <Text style={styles.linkText}>+ add tip</Text>
          </Pressable>

          {/* Publish toggle */}
          <Pressable
            style={styles.publishRow}
            onPress={() => setPublish((p) => !p)}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.publishLabel}>Publish</Text>
              <Text style={styles.publishSub}>
                {publish
                  ? 'Visible to everyone on Explore'
                  : 'Save privately as a draft'}
              </Text>
            </View>
            <View style={[styles.toggle, publish && styles.toggleOn]}>
              <View style={[styles.knob, publish && styles.knobOn]} />
            </View>
          </Pressable>

          {importError ? <Text style={styles.errorText}>{importError}</Text> : null}

          {/* Save button */}
          <Pressable
            style={[styles.primaryBtn, (!canPublish || saving) && styles.btnDisabled]}
            onPress={handleSave}
            disabled={!canPublish || saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryBtnText}>
                {publish ? 'Publish →' : 'Save as draft'}
              </Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bone },
  scroll: { paddingHorizontal: 22, paddingBottom: 140, paddingTop: 8 },
  subtitle: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: colors.muted,
    marginTop: 6,
    marginBottom: 18,
  },
  headRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.cta,
  },
  iconBtnText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: colors.ink,
  },
  waveText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    color: colors.ink,
    lineHeight: 22,
  },
  fieldCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 12,
  },
  fieldLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    color: colors.muted,
    letterSpacing: 1.0,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  inputInline: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: colors.ink,
    paddingVertical: 4,
  },
  titleInput: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 20,
    color: colors.ink,
    letterSpacing: -0.4,
    paddingVertical: 4,
  },
  importBtn: {
    backgroundColor: colors.clay,
    borderRadius: radius.pill,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  importBtnText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
    color: '#fff',
  },
  btnDisabled: { opacity: 0.5 },
  creditCard: {
    backgroundColor: colors.claySoft,
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },
  creditText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: colors.inkSoft,
  },
  metaRow: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  blockLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    color: colors.muted,
    letterSpacing: 1.0,
    textTransform: 'uppercase',
    marginTop: 12,
    marginBottom: 10,
  },
  chipsRow: { flexDirection: 'row', gap: 6, marginBottom: 16 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    marginRight: 6,
  },
  chipActive: { backgroundColor: colors.ink },
  chipInactive: { backgroundColor: colors.card, ...shadow.card },
  chipText: { fontFamily: 'Inter_700Bold', fontSize: 12, letterSpacing: -0.1, textTransform: 'capitalize' },
  chipTextActive: { color: '#fff' },
  chipTextInactive: { color: colors.inkSoft },
  ingredientRow: { flexDirection: 'row', gap: 8, marginBottom: 10, alignItems: 'center' },
  smallInput: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: colors.ink,
  },
  removeBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  removeBtnText: { fontFamily: 'Inter_700Bold', fontSize: 18, color: colors.muted },
  stepRow: { flexDirection: 'row', gap: 10, marginBottom: 12, alignItems: 'flex-start' },
  stepNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.clay,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  stepNumText: { fontFamily: 'Inter_700Bold', fontSize: 12, color: '#fff' },
  linkText: { color: colors.clay, fontFamily: 'Inter_700Bold', fontSize: 12 },
  errorText: {
    color: colors.clay,
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    marginTop: 4,
    marginBottom: 12,
  },
  publishRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  publishLabel: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 14,
    color: colors.ink,
  },
  publishSub: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  toggle: {
    width: 44,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.border,
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  toggleOn: { backgroundColor: colors.sage },
  knob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  knobOn: { alignSelf: 'flex-end' },
  primaryBtn: {
    backgroundColor: colors.clay,
    borderRadius: radius.pill,
    paddingVertical: 17,
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 32,
    ...shadow.cta,
  },
  primaryBtnText: { fontFamily: 'Inter_700Bold', fontSize: 14, color: '#fff' },
});
