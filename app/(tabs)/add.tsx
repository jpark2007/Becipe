import { useState, useEffect } from 'react';
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
  SafeAreaView,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useShareIntent } from 'expo-share-intent';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';
import { queryClient } from '@/lib/query-client';
import type { Ingredient, Step, Tip } from '@/lib/database.types';
import { CUISINES } from '@/lib/smart-sort';
import { colors, shadow } from '@/lib/theme';
import { EditorialHeading } from '@/components/EditorialHeading';

type Mode = 'manual' | 'import' | 'social' | 'share';
type Difficulty = 'easy' | 'medium' | 'hard';

function isSocialUrl(url: string): boolean {
  return /tiktok\.com|instagram\.com|facebook\.com|fb\.watch|twitter\.com|x\.com|youtube\.com|youtu\.be/.test(url);
}

const MODE_TABS: { key: Mode; label: string }[] = [
  { key: 'manual', label: 'manual' },
  { key: 'import', label: 'url' },
  { key: 'social', label: 'social' },
  { key: 'share', label: 'share' },
];

export default function AddScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntent();

  const [mode, setMode] = useState<Mode>('manual');
  const [inForm, setInForm] = useState(false);
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
  const [needsCaption, setNeedsCaption] = useState(false);
  const [pastedCaption, setPastedCaption] = useState('');

  // Auto-trigger import when share intent arrives
  useEffect(() => {
    if (hasShareIntent && shareIntent) {
      const url = shareIntent.webUrl ?? '';
      const sharedText = shareIntent.text ?? '';
      if (url) {
        setImportUrl(url);
        setMode(isSocialUrl(url) ? 'social' : 'import');
        handleImport(url, sharedText || undefined);
      } else if (sharedText) {
        setMode('social');
        setPastedCaption(sharedText);
      }
      resetShareIntent();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasShareIntent]);

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
    setMode('manual');
    setInForm(true);
  }

  async function tryEdgeFunction(targetUrl: string, caption?: string) {
    const fnName = isSocialUrl(targetUrl) ? 'parse-video' : 'parse-recipe';
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
    const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

    const fnUrl = `${supabaseUrl}/functions/v1/${fnName}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30000);
    try {
      const body: Record<string, string> = { url: targetUrl };
      if (caption) body.caption = caption;

      const res = await fetch(fnUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (!res.ok) {
        const responseBody = await res.json().catch(() => ({}));
        if (responseBody.error === 'caption_needed') {
          throw Object.assign(new Error('caption_needed'), { partial: responseBody.partial });
        }
        throw new Error(`Import failed (${res.status}): ${responseBody.error || responseBody.message || ''}`);
      }
      const data = await res.json();
      if (!data) throw new Error('No data');

      const hasIngredients = data.ingredients?.length > 0 && data.ingredients[0].name;
      const hasSteps = data.steps?.length > 0 && !data.steps[0].instruction.includes('could not be parsed');
      if (!hasIngredients && !hasSteps) throw new Error('Empty parse — site may block automated access');
      return data;
    } catch (e) {
      clearTimeout(timer);
      throw e;
    }
  }

  async function handleImport(url?: string, caption?: string) {
    const targetUrl = (url ?? importUrl).trim();
    if (!targetUrl) return;

    const isSocial = isSocialUrl(targetUrl) || mode === 'social';

    setImporting(true);
    setImportError('');
    setNeedsCaption(false);
    try {
      const data = await tryEdgeFunction(targetUrl, caption);
      applyParsedData(data, targetUrl);
    } catch (err: any) {
      const msg = err.message ?? '';
      let userMessage: string;
      if (msg === 'caption_needed') {
        setNeedsCaption(true);
        if (err.partial) {
          setSourceUrl(err.partial.source_url ?? targetUrl);
          setSourceType(err.partial.source_type ?? 'tiktok');
          setSourceName(err.partial.source_name ?? '');
          setSourceCredit(err.partial.source_credit ?? '');
        }
        userMessage = 'We couldn\'t read the recipe from the caption. Paste the recipe text or caption below.';
      } else if (msg.includes('No auth session')) {
        userMessage = 'Please sign in again to import recipes.';
      } else if (msg.includes('AbortError') || msg.includes('abort')) {
        userMessage = 'Import timed out — try again.';
      } else if (isSocial) {
        userMessage = 'Could not extract the recipe — the post may be private. You can fill it in manually below.';
        setSourceUrl(targetUrl);
        setSourceType(targetUrl.includes('tiktok.com') ? 'tiktok' : 'instagram');
        const platformNames: Record<string, string> = { 'tiktok.com': 'TikTok', 'instagram.com': 'Instagram', 'facebook.com': 'Facebook', 'fb.watch': 'Facebook', 'twitter.com': 'X', 'x.com': 'X', 'youtube.com': 'YouTube', 'youtu.be': 'YouTube' };
        setSourceName(Object.entries(platformNames).find(([k]) => targetUrl.includes(k))?.[1] ?? '');
        setMode('manual');
        setInForm(true);
      } else if (msg.includes('Empty parse')) {
        userMessage = 'That site blocks automated imports. Try BBC Good Food, Serious Eats, Food Network, or Simply Recipes.';
      } else {
        userMessage = 'Could not import that recipe. Try a URL from BBC Good Food, Serious Eats, or Food Network.';
      }
      setImportError(userMessage);
    } finally {
      setImporting(false);
    }
  }

  async function handleSave() {
    const cleanTitle = title.trim().slice(0, 200);
    const cleanDescription = description.trim().slice(0, 2000);

    if (!cleanTitle) {
      setImportError('Please give your recipe a title.');
      return;
    }
    setSaving(true);

    try {
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
      const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';
      const session = useAuthStore.getState().session;
      const token = session?.access_token;

      if (!token) {
        setSaving(false);
        Alert.alert('Save failed', 'Please sign in again.');
        return;
      }

      const res = await fetch(`${supabaseUrl}/rest/v1/recipes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'apikey': supabaseKey,
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({
          created_by: user!.id,
          title: cleanTitle,
          description: cleanDescription || null,
          cuisine: cuisine || null,
          difficulty,
          prep_time_min: prepTime ? parseInt(prepTime) : null,
          cook_time_min: cookTime ? parseInt(cookTime) : null,
          servings: servings ? parseInt(servings) : null,
          ingredients: ingredients.filter(i => i.name.trim()).map(i => ({
            amount: i.amount.trim().slice(0, 50),
            unit: i.unit.trim().slice(0, 50),
            name: i.name.trim().slice(0, 500),
          })),
          steps: steps.filter(s => s.instruction.trim()).map(s => ({
            order: s.order,
            instruction: s.instruction.trim().slice(0, 2000),
          })),
          tips: tips.filter(t => t.text.trim()).map(t => ({
            text: t.text.trim().slice(0, 1000),
          })),
          source_url: sourceUrl || null,
          source_name: sourceName || null,
          source_credit: sourceCredit || null,
          source_type: sourceType,
          is_public: true,
          tags: cuisine ? [cuisine.toLowerCase()] : [],
        }),
      });

      setSaving(false);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: `HTTP ${res.status}` }));
        Alert.alert('Save failed', err.message ?? `Error ${res.status}`);
      } else {
        queryClient.invalidateQueries({ queryKey: ['profile'] });
        queryClient.invalidateQueries({ queryKey: ['discover'] });
        router.replace('/(tabs)/profile');
      }
    } catch (e: any) {
      setSaving(false);
      Alert.alert('Save failed', e.message ?? 'Unknown error');
    }
  }

  function resetToChoose() {
    setInForm(false);
    setTitle('');
    setDescription('');
    setImportUrl('');
    setImportError('');
    setNeedsCaption(false);
    setPastedCaption('');
  }

  const ModeTabs = (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.modeRow}>
      {MODE_TABS.map((t) => {
        const active = mode === t.key && !inForm;
        // 'share' is an alias for social on tap
        return (
          <Pressable
            key={t.key}
            onPress={() => {
              setMode(t.key === 'share' ? 'social' : t.key);
              if (t.key === 'manual') { setInForm(true); setSourceType('manual'); }
              else setInForm(false);
            }}
            style={[styles.modePill, active ? styles.modePillActive : styles.modePillInactive]}
          >
            <Text style={[styles.modePillText, active ? styles.modePillTextActive : styles.modePillTextInactive]}>
              {t.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );

  // ---------- Choose / Mode-selector landing ----------
  if (!inForm && (mode === 'import' || mode === 'social' || mode === 'manual')) {
    if (mode === 'manual') {
      // Manual starts the form immediately
      // (fall through — renders form below on next tick)
    }
  }

  // ---------- Import URL landing ----------
  if (!inForm && mode === 'import' && !title) {
    return (
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <EditorialHeading size={26} emphasis="recipe" emphasisColor="clay">
              {'Add a\n'}
            </EditorialHeading>
            <Text style={styles.subtitle}>paste a link from any recipe website</Text>

            {ModeTabs}

            <View style={styles.fieldCard}>
              <Text style={styles.fieldLabel}>recipe url</Text>
              <TextInput
                style={styles.inputInline}
                placeholder="https://..."
                placeholderTextColor={colors.muted}
                value={importUrl}
                onChangeText={setImportUrl}
                autoCapitalize="none"
                keyboardType="url"
              />
            </View>

            {importError ? <Text style={styles.errorText}>{importError}</Text> : null}

            <Pressable
              style={[styles.primaryBtn, (importing || !importUrl.trim()) && styles.primaryBtnDisabled]}
              onPress={() => handleImport()}
              disabled={importing || !importUrl.trim()}
            >
              {importing ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>import →</Text>}
            </Pressable>

            <Pressable
              style={{ paddingVertical: 14, alignItems: 'center' }}
              onPress={() => { setMode('manual'); setInForm(true); setSourceType('manual'); }}
            >
              <Text style={styles.linkText}>or fill in manually</Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ---------- Social import landing ----------
  if (!inForm && mode === 'social' && !title) {
    return (
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <EditorialHeading size={26} emphasis="recipe" emphasisColor="clay">
              {'Add a\n'}
            </EditorialHeading>
            <Text style={styles.subtitle}>share a recipe post directly to dishr</Text>

            {ModeTabs}

            <View style={styles.infoCard}>
              <Text style={styles.fieldLabel}>how to import</Text>
              <Text style={styles.infoBody}>
                1. Open the recipe post in TikTok, Instagram, Facebook, or X{'\n'}
                2. Tap the Share button{'\n'}
                3. Choose "Dishr" from the share menu{'\n\n'}
                The recipe will be extracted automatically.
              </Text>
            </View>

            {importing && !needsCaption ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color={colors.clay} />
                <Text style={styles.loadingText}>extracting recipe…</Text>
              </View>
            ) : null}

            {importError ? <Text style={styles.errorText}>{importError}</Text> : null}

            {needsCaption ? (
              <>
                <View style={styles.fieldCard}>
                  <Text style={styles.fieldLabel}>paste caption</Text>
                  <TextInput
                    style={[styles.inputInline, { minHeight: 120, textAlignVertical: 'top' }]}
                    placeholder="paste recipe caption or ingredients here…"
                    placeholderTextColor={colors.muted}
                    value={pastedCaption}
                    onChangeText={setPastedCaption}
                    multiline
                  />
                </View>
                <Pressable
                  style={[styles.primaryBtn, (importing || !pastedCaption.trim()) && styles.primaryBtnDisabled]}
                  onPress={() => handleImport(undefined, pastedCaption)}
                  disabled={importing || !pastedCaption.trim()}
                >
                  {importing ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>extract recipe →</Text>}
                </Pressable>
                <Pressable style={{ paddingVertical: 14, alignItems: 'center' }} onPress={() => { setMode('manual'); setInForm(true); }}>
                  <Text style={styles.linkText}>skip — fill in manually</Text>
                </Pressable>
              </>
            ) : (
              <>
                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>OR PASTE A LINK</Text>
                  <View style={styles.dividerLine} />
                </View>

                <View style={styles.fieldCard}>
                  <Text style={styles.fieldLabel}>social url</Text>
                  <TextInput
                    style={styles.inputInline}
                    placeholder="https://www.tiktok.com/…"
                    placeholderTextColor={colors.muted}
                    value={importUrl}
                    onChangeText={setImportUrl}
                    autoCapitalize="none"
                    keyboardType="url"
                  />
                </View>

                <Pressable
                  style={[styles.primaryBtn, (importing || !importUrl.trim()) && styles.primaryBtnDisabled]}
                  onPress={() => handleImport()}
                  disabled={importing || !importUrl.trim()}
                >
                  {importing ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>import →</Text>}
                </Pressable>
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ---------- Manual form ----------
  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Header row */}
          <View style={styles.headRow}>
            <Pressable style={styles.iconBtn} onPress={resetToChoose}>
              <Text style={styles.iconBtnText}>←</Text>
            </Pressable>
            <Pressable
              style={[styles.saveBtn, saving && styles.primaryBtnDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveBtnText}>save →</Text>}
            </Pressable>
          </View>

          <EditorialHeading size={26} emphasis="recipe" emphasisColor="clay">
            {'Add a\n'}
          </EditorialHeading>
          <Text style={styles.subtitle}>fill in the details</Text>

          {sourceCredit ? (
            <View style={styles.creditCard}>
              <Text style={styles.fieldLabel}>credit</Text>
              <Text style={styles.creditText}>
                {sourceCredit} {sourceName ? `on ${sourceName}` : ''}
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
              <Text style={styles.fieldLabel}>prep (min)</Text>
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
              <Text style={styles.fieldLabel}>cook (min)</Text>
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
            {CUISINES.filter(c => c !== 'All').map((c) => {
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
          {ingredients.map((ing, i) => (
            <View key={i} style={styles.ingredientRow}>
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
                onChangeText={(v) => {
                  const next = [...ingredients];
                  next[i] = { ...next[i], name: v };
                  setIngredients(next);
                }}
              />
              {ingredients.length > 1 && (
                <Pressable
                  style={styles.removeBtn}
                  onPress={() => setIngredients(prev => prev.filter((_, idx) => idx !== i))}
                >
                  <Text style={styles.removeBtnText}>×</Text>
                </Pressable>
              )}
            </View>
          ))}
          <Pressable
            style={{ paddingVertical: 10, marginBottom: 20 }}
            onPress={() => setIngredients(prev => [...prev, { amount: '', unit: '', name: '' }])}
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
                  onPress={() => setSteps(prev => prev.filter((_, idx) => idx !== i).map((s, idx) => ({ ...s, order: idx + 1 })))}
                >
                  <Text style={styles.removeBtnText}>×</Text>
                </Pressable>
              )}
            </View>
          ))}
          <Pressable
            style={{ paddingVertical: 10, marginBottom: 20 }}
            onPress={() => setSteps(prev => [...prev, { order: prev.length + 1, instruction: '' }])}
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
                onPress={() => setTips(prev => prev.filter((_, idx) => idx !== i))}
              >
                <Text style={styles.removeBtnText}>×</Text>
              </Pressable>
            </View>
          ))}
          <Pressable
            style={{ paddingVertical: 10, marginBottom: 16 }}
            onPress={() => setTips(prev => [...prev, { text: '' }])}
          >
            <Text style={styles.linkText}>+ add tip</Text>
          </Pressable>

          {importError ? <Text style={styles.errorText}>{importError}</Text> : null}

          {/* Save button */}
          <Pressable
            style={[styles.primaryBtn, { marginBottom: 32 }, saving && styles.primaryBtnDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>save recipe →</Text>}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bone },
  scroll: { paddingHorizontal: 22, paddingBottom: 48, paddingTop: 12 },
  subtitle: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: colors.muted,
    marginTop: 6,
    marginBottom: 18,
  },

  modeRow: { marginBottom: 18 },
  modePill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    marginRight: 6,
  },
  modePillActive: { backgroundColor: colors.ink },
  modePillInactive: { backgroundColor: colors.card, ...shadow.card },
  modePillText: { fontFamily: 'Inter_700Bold', fontSize: 12, letterSpacing: -0.1 },
  modePillTextActive: { color: '#fff' },
  modePillTextInactive: { color: colors.inkSoft },

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

  errorText: {
    color: colors.clay,
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    marginTop: 4,
    marginBottom: 12,
  },
  linkText: {
    color: colors.clay,
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
  },

  primaryBtn: {
    backgroundColor: colors.clay,
    borderRadius: 999,
    paddingVertical: 17,
    alignItems: 'center',
    marginTop: 6,
    ...shadow.cta,
  },
  primaryBtnDisabled: { opacity: 0.5 },
  primaryBtnText: { fontFamily: 'Inter_700Bold', fontSize: 14, color: '#fff' },

  infoCard: {
    backgroundColor: colors.claySoft,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  infoBody: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: colors.ink,
    lineHeight: 20,
    marginTop: 4,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    marginBottom: 8,
  },
  loadingText: { fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.muted },

  dividerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, marginTop: 8 },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    color: colors.muted,
    marginHorizontal: 12,
    letterSpacing: 1.0,
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
  saveBtn: {
    backgroundColor: colors.clay,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999,
    ...shadow.cta,
  },
  saveBtnText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
    color: '#fff',
  },

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
    borderRadius: 999,
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
});
