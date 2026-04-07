import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useShareIntent } from 'expo-share-intent';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';
import { queryClient } from '@/lib/query-client';
import type { Ingredient, Step, Tip } from '@/lib/database.types';
import { CUISINES } from '@/lib/smart-sort';

type Mode = 'choose' | 'manual' | 'import' | 'social-import';
type Difficulty = 'easy' | 'medium' | 'hard';

function isSocialUrl(url: string): boolean {
  return /tiktok\.com|instagram\.com|facebook\.com|fb\.watch|twitter\.com|x\.com|youtube\.com|youtu\.be/.test(url);
}

export default function AddScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntent();

  const [mode, setMode] = useState<Mode>('choose');
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
        setMode(isSocialUrl(url) ? 'social-import' : 'import');
        // Pass shared text as caption — this is how we get captions from social apps
        handleImport(url, sharedText || undefined);
      } else if (sharedText) {
        // User shared text only (no URL) — treat as pasted caption
        setMode('social-import');
        setPastedCaption(sharedText);
      }
      resetShareIntent();
    }
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

    const isSocial = isSocialUrl(targetUrl) || mode === 'social-import';

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
        // Show paste-caption UI
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
      console.log('[save] user id:', user!.id);

      // Use direct fetch to bypass Supabase client issues
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
      const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';
      const session = useAuthStore.getState().session;
      const token = session?.access_token;

      if (!token) {
        setSaving(false);
        Alert.alert('Save failed', 'Please sign in again.');
        return;
      }

      console.log('[save] token prefix:', token.slice(0, 10));
      console.log('[save] inserting recipe...');

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
        console.error('[save] recipe insert failed:', err);
        Alert.alert('Save failed', err.message ?? `Error ${res.status}`);
      } else {
        console.log('[save] recipe saved!');
        queryClient.invalidateQueries({ queryKey: ['profile'] });
        queryClient.invalidateQueries({ queryKey: ['discover'] });
        router.replace('/(tabs)/profile');
      }
    } catch (e: any) {
      console.error('[save] unexpected error:', e);
      setSaving(false);
      Alert.alert('Save failed', e.message ?? 'Unknown error');
    }
  }

  if (mode === 'choose') {
    return (
      <View style={{ flex: 1, backgroundColor: '#F8F4EE', paddingHorizontal: 24, justifyContent: 'center' }}>
        <Text style={{
          fontFamily: 'CormorantGaramond_600SemiBold',
          fontSize: 34,
          color: '#1C1712',
          marginBottom: 6,
        }}>
          Add a Recipe
        </Text>
        <Text style={{
          fontFamily: 'DMMono_400Regular',
          fontSize: 11,
          color: '#A09590',
          letterSpacing: 0.5,
          marginBottom: 40,
        }}>
          Create from scratch or import from the web
        </Text>

        {/* Create Manually */}
        <TouchableOpacity
          style={{
            backgroundColor: '#EEE8DF',
            borderLeftWidth: 4,
            borderLeftColor: '#C4622D',
            padding: 20,
            marginBottom: 2,
          }}
          onPress={() => { setSourceType('manual'); setMode('manual'); }}
        >
          <Text style={{
            fontFamily: 'DMMono_400Regular',
            fontSize: 10,
            letterSpacing: 2,
            textTransform: 'uppercase',
            color: '#C4622D',
            marginBottom: 6,
          }}>
            Create Manually
          </Text>
          <Text style={{
            fontFamily: 'CormorantGaramond_400Regular',
            fontSize: 18,
            color: '#A09590',
          }}>
            Write your own recipe from scratch
          </Text>
        </TouchableOpacity>

        {/* Import from URL */}
        <TouchableOpacity
          style={{
            backgroundColor: '#EEE8DF',
            borderLeftWidth: 4,
            borderLeftColor: '#C4622D',
            padding: 20,
            marginBottom: 2,
          }}
          onPress={() => setMode('import')}
        >
          <Text style={{
            fontFamily: 'DMMono_400Regular',
            fontSize: 10,
            letterSpacing: 2,
            textTransform: 'uppercase',
            color: '#C4622D',
            marginBottom: 6,
          }}>
            Import from URL
          </Text>
          <Text style={{
            fontFamily: 'CormorantGaramond_400Regular',
            fontSize: 18,
            color: '#A09590',
          }}>
            Paste a link from any recipe website
          </Text>
        </TouchableOpacity>

        {/* Import from Social */}
        <TouchableOpacity
          style={{
            backgroundColor: '#EEE8DF',
            borderLeftWidth: 4,
            borderLeftColor: '#C4622D',
            padding: 20,
          }}
          onPress={() => setMode('social-import')}
        >
          <Text style={{
            fontFamily: 'DMMono_400Regular',
            fontSize: 10,
            letterSpacing: 2,
            textTransform: 'uppercase',
            color: '#C4622D',
            marginBottom: 6,
          }}>
            Import from Social
          </Text>
          <Text style={{
            fontFamily: 'CormorantGaramond_400Regular',
            fontSize: 18,
            color: '#A09590',
          }}>
            Share directly from TikTok, Instagram, and more
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (mode === 'import' && !title) {
    return (
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: '#F8F4EE' }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={{ flex: 1, paddingHorizontal: 24, justifyContent: 'center' }}>
          <TouchableOpacity onPress={() => setMode('choose')} style={{ marginBottom: 32 }}>
            <Text style={{
              fontFamily: 'DMMono_400Regular',
              fontSize: 12,
              color: '#C4622D',
              letterSpacing: 0.5,
            }}>
              Back
            </Text>
          </TouchableOpacity>

          <Text style={{
            fontFamily: 'CormorantGaramond_600SemiBold',
            fontSize: 34,
            color: '#1C1712',
            marginBottom: 6,
          }}>
            Import Recipe
          </Text>
          <Text style={{
            fontFamily: 'DMMono_400Regular',
            fontSize: 11,
            color: '#A09590',
            letterSpacing: 0.5,
            marginBottom: 32,
          }}>
            Paste a link from any recipe website
          </Text>

          <TextInput
            style={{
              borderBottomWidth: 1,
              borderBottomColor: '#D5CCC0',
              paddingVertical: 12,
              color: '#1C1712',
              fontFamily: 'Lora_400Regular',
              fontSize: 15,
              backgroundColor: 'transparent',
              marginBottom: 24,
            }}
            placeholder="https://..."
            placeholderTextColor="#A09590"
            value={importUrl}
            onChangeText={setImportUrl}
            autoCapitalize="none"
            keyboardType="url"
          />

          {importError ? (
            <Text style={{ fontFamily: 'Lora_400Regular', fontSize: 13, color: '#E05C3A', marginBottom: 16, lineHeight: 20 }}>
              {importError}
            </Text>
          ) : null}

          <TouchableOpacity
            style={{
              backgroundColor: importing || !importUrl.trim() ? 'transparent' : '#C4622D',
              borderWidth: 1,
              borderColor: importing || !importUrl.trim() ? '#BEB0A8' : '#C4622D',
              paddingVertical: 16,
              alignItems: 'center',
            }}
            onPress={() => handleImport()}
            disabled={importing || !importUrl.trim()}
          >
            {importing ? (
              <ActivityIndicator color="#A09590" />
            ) : (
              <Text style={{
                fontFamily: 'DMMono_400Regular',
                fontSize: 12,
                letterSpacing: 2,
                textTransform: 'uppercase',
                color: importUrl.trim() ? '#EDE8DC' : '#A09590',
              }}>
                Import
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  if (mode === 'social-import' && !title) {
    return (
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: '#F8F4EE' }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, justifyContent: 'center' }}>
          <TouchableOpacity onPress={() => { setMode('choose'); setImportError(''); setImportUrl(''); setNeedsCaption(false); setPastedCaption(''); }} style={{ marginBottom: 32 }}>
            <Text style={{
              fontFamily: 'DMMono_400Regular',
              fontSize: 12,
              color: '#C4622D',
              letterSpacing: 0.5,
            }}>
              Back
            </Text>
          </TouchableOpacity>

          <Text style={{
            fontFamily: 'CormorantGaramond_600SemiBold',
            fontSize: 34,
            color: '#1C1712',
            marginBottom: 6,
          }}>
            Import from Social
          </Text>
          <Text style={{
            fontFamily: 'DMMono_400Regular',
            fontSize: 11,
            color: '#A09590',
            letterSpacing: 0.5,
            marginBottom: 28,
          }}>
            Share a recipe post directly to Dishr
          </Text>

          {/* Share intent instructions */}
          <View style={{
            backgroundColor: '#EEE8DF',
            borderWidth: 1,
            borderColor: '#D5CCC0',
            padding: 16,
            marginBottom: 24,
          }}>
            <Text style={{
              fontFamily: 'DMMono_400Regular',
              fontSize: 10,
              letterSpacing: 2,
              textTransform: 'uppercase',
              color: '#C4622D',
              marginBottom: 12,
            }}>
              How to import
            </Text>
            <Text style={{
              fontFamily: 'Lora_400Regular',
              fontSize: 14,
              color: '#1C1712',
              lineHeight: 22,
            }}>
              1. Open the recipe post in TikTok, Instagram, Facebook, or X{'\n'}
              2. Tap the Share button{'\n'}
              3. Choose "Dishr" from the share menu{'\n\n'}
              The recipe will be extracted automatically.
            </Text>
          </View>

          {importing && !needsCaption ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, marginBottom: 16 }}>
              <ActivityIndicator color="#C4622D" />
              <Text style={{ fontFamily: 'DMMono_400Regular', fontSize: 11, color: '#A09590', letterSpacing: 1 }}>
                Extracting recipe...
              </Text>
            </View>
          ) : null}

          {importError ? (
            <Text style={{ fontFamily: 'Lora_400Regular', fontSize: 13, color: '#E05C3A', marginBottom: 16, lineHeight: 20 }}>
              {importError}
            </Text>
          ) : null}

          {/* Paste caption fallback */}
          {needsCaption ? (
            <>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: '#D5CCC0',
                  padding: 12,
                  color: '#1C1712',
                  fontFamily: 'Lora_400Regular',
                  fontSize: 14,
                  backgroundColor: '#EEE8DF',
                  marginBottom: 16,
                  minHeight: 100,
                  textAlignVertical: 'top',
                }}
                placeholder="Paste the recipe caption or ingredients here..."
                placeholderTextColor="#A09590"
                value={pastedCaption}
                onChangeText={setPastedCaption}
                multiline
              />
              <TouchableOpacity
                style={{
                  backgroundColor: importing || !pastedCaption.trim() ? 'transparent' : '#C4622D',
                  borderWidth: 1,
                  borderColor: importing || !pastedCaption.trim() ? '#BEB0A8' : '#C4622D',
                  paddingVertical: 16,
                  alignItems: 'center',
                  marginBottom: 12,
                }}
                onPress={() => handleImport(undefined, pastedCaption)}
                disabled={importing || !pastedCaption.trim()}
              >
                {importing ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <ActivityIndicator color="#A09590" />
                    <Text style={{ fontFamily: 'DMMono_400Regular', fontSize: 11, color: '#A09590', letterSpacing: 1 }}>
                      Extracting recipe...
                    </Text>
                  </View>
                ) : (
                  <Text style={{
                    fontFamily: 'DMMono_400Regular',
                    fontSize: 12,
                    letterSpacing: 2,
                    textTransform: 'uppercase',
                    color: pastedCaption.trim() ? '#EDE8DC' : '#A09590',
                  }}>
                    Extract Recipe
                  </Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={{ paddingVertical: 10, alignItems: 'center' }}
                onPress={() => { setMode('manual'); }}
              >
                <Text style={{ fontFamily: 'DMMono_400Regular', fontSize: 11, color: '#C4622D', letterSpacing: 1 }}>
                  Skip — fill in manually
                </Text>
              </TouchableOpacity>
            </>
          ) : null}

          {/* Divider */}
          {!needsCaption ? (
            <>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20, marginTop: 4 }}>
                <View style={{ flex: 1, height: 1, backgroundColor: '#D5CCC0' }} />
                <Text style={{ fontFamily: 'DMMono_400Regular', fontSize: 10, color: '#A09590', marginHorizontal: 12, letterSpacing: 1 }}>
                  OR PASTE A LINK
                </Text>
                <View style={{ flex: 1, height: 1, backgroundColor: '#D5CCC0' }} />
              </View>

              <TextInput
                style={{
                  borderBottomWidth: 1,
                  borderBottomColor: '#D5CCC0',
                  paddingVertical: 12,
                  color: '#1C1712',
                  fontFamily: 'Lora_400Regular',
                  fontSize: 15,
                  backgroundColor: 'transparent',
                  marginBottom: 16,
                }}
                placeholder="https://www.tiktok.com/..."
                placeholderTextColor="#A09590"
                value={importUrl}
                onChangeText={setImportUrl}
                autoCapitalize="none"
                keyboardType="url"
              />

              <TouchableOpacity
                style={{
                  backgroundColor: importing || !importUrl.trim() ? 'transparent' : '#C4622D',
                  borderWidth: 1,
                  borderColor: importing || !importUrl.trim() ? '#BEB0A8' : '#C4622D',
                  paddingVertical: 16,
                  alignItems: 'center',
                  marginBottom: 24,
                }}
                onPress={() => handleImport()}
                disabled={importing || !importUrl.trim()}
              >
                <Text style={{
                  fontFamily: 'DMMono_400Regular',
                  fontSize: 12,
                  letterSpacing: 2,
                  textTransform: 'uppercase',
                  color: importUrl.trim() ? '#EDE8DC' : '#A09590',
                }}>
                  Import
                </Text>
              </TouchableOpacity>
            </>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // Recipe form (manual or post-import)
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#F8F4EE' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Top nav */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <TouchableOpacity onPress={() => { setMode('choose'); setTitle(''); }}>
            <Text style={{
              fontFamily: 'DMMono_400Regular',
              fontSize: 12,
              color: '#C4622D',
              letterSpacing: 0.5,
            }}>
              Back
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              backgroundColor: '#C4622D',
              paddingHorizontal: 24,
              paddingVertical: 10,
            }}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#EDE8DC" size="small" />
            ) : (
              <Text style={{
                fontFamily: 'DMMono_400Regular',
                fontSize: 11,
                letterSpacing: 2,
                textTransform: 'uppercase',
                color: '#EDE8DC',
              }}>
                Save
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {sourceCredit && (
          <View style={{
            backgroundColor: '#EEE8DF',
            borderWidth: 1,
            borderColor: '#D5CCC0',
            padding: 12,
            marginBottom: 16,
          }}>
            <Text style={{
              fontFamily: 'DMMono_400Regular',
              fontSize: 10,
              color: '#A09590',
              letterSpacing: 0.5,
            }}>
              Credit: {sourceCredit} {sourceName ? `on ${sourceName}` : ''}
            </Text>
          </View>
        )}

        {/* Title */}
        <TextInput
          style={{
            borderBottomWidth: 1,
            borderBottomColor: '#D5CCC0',
            paddingVertical: 10,
            color: '#1C1712',
            fontFamily: 'CormorantGaramond_600SemiBold',
            fontSize: 26,
            backgroundColor: 'transparent',
            marginBottom: 16,
          }}
          placeholder="Recipe Title"
          placeholderTextColor="#A09590"
          value={title}
          onChangeText={setTitle}
        />

        {/* Description */}
        <TextInput
          style={{
            borderBottomWidth: 1,
            borderBottomColor: '#D5CCC0',
            paddingVertical: 10,
            color: '#1C1712',
            fontFamily: 'Lora_400Regular',
            fontSize: 14,
            backgroundColor: 'transparent',
            marginBottom: 24,
          }}
          placeholder="Description (optional)"
          placeholderTextColor="#A09590"
          value={description}
          onChangeText={setDescription}
          multiline
        />

        {/* Meta row */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
          <TextInput
            style={{
              flex: 1,
              borderBottomWidth: 1,
              borderBottomColor: '#D5CCC0',
              paddingVertical: 8,
              color: '#1C1712',
              fontFamily: 'DMMono_400Regular',
              fontSize: 13,
              backgroundColor: 'transparent',
              textAlign: 'center',
            }}
            placeholder="Prep min"
            placeholderTextColor="#A09590"
            value={prepTime}
            onChangeText={setPrepTime}
            keyboardType="number-pad"
          />
          <TextInput
            style={{
              flex: 1,
              borderBottomWidth: 1,
              borderBottomColor: '#D5CCC0',
              paddingVertical: 8,
              color: '#1C1712',
              fontFamily: 'DMMono_400Regular',
              fontSize: 13,
              backgroundColor: 'transparent',
              textAlign: 'center',
            }}
            placeholder="Cook min"
            placeholderTextColor="#A09590"
            value={cookTime}
            onChangeText={setCookTime}
            keyboardType="number-pad"
          />
          <TextInput
            style={{
              flex: 1,
              borderBottomWidth: 1,
              borderBottomColor: '#D5CCC0',
              paddingVertical: 8,
              color: '#1C1712',
              fontFamily: 'DMMono_400Regular',
              fontSize: 13,
              backgroundColor: 'transparent',
              textAlign: 'center',
            }}
            placeholder="Serves"
            placeholderTextColor="#A09590"
            value={servings}
            onChangeText={setServings}
            keyboardType="number-pad"
          />
        </View>

        {/* Difficulty */}
        <Text style={{
          fontFamily: 'DMMono_400Regular',
          fontSize: 10,
          letterSpacing: 2,
          textTransform: 'uppercase',
          color: '#A09590',
          marginBottom: 12,
        }}>
          Difficulty
        </Text>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 24 }}>
          {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
            <TouchableOpacity
              key={d}
              onPress={() => setDifficulty(d)}
              style={{
                flex: 1,
                paddingVertical: 10,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: difficulty === d ? '#C4622D' : '#BEB0A8',
              }}
            >
              <Text style={{
                fontFamily: 'DMMono_400Regular',
                fontSize: 11,
                letterSpacing: 1,
                textTransform: 'capitalize',
                color: difficulty === d ? '#C4622D' : '#A09590',
              }}>
                {d}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Cuisine */}
        <Text style={{
          fontFamily: 'DMMono_400Regular',
          fontSize: 10,
          letterSpacing: 2,
          textTransform: 'uppercase',
          color: '#A09590',
          marginBottom: 12,
        }}>
          Cuisine
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 24 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {CUISINES.filter(c => c !== 'All').map((c) => (
              <TouchableOpacity
                key={c}
                onPress={() => setCuisine(cuisine === c ? '' : c)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderWidth: 1,
                  borderColor: cuisine === c ? '#C4622D' : '#BEB0A8',
                }}
              >
                <Text style={{
                  fontFamily: 'DMMono_400Regular',
                  fontSize: 10,
                  letterSpacing: 1,
                  color: cuisine === c ? '#C4622D' : '#A09590',
                }}>
                  {c}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Ingredients */}
        <Text style={{
          fontFamily: 'DMMono_400Regular',
          fontSize: 10,
          letterSpacing: 2,
          textTransform: 'uppercase',
          color: '#A09590',
          marginBottom: 12,
        }}>
          Ingredients
        </Text>
        {ingredients.map((ing, i) => (
          <View key={i} style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
            <TextInput
              style={{
                width: 56,
                borderBottomWidth: 1,
                borderBottomColor: '#D5CCC0',
                paddingVertical: 8,
                color: '#C4622D',
                fontFamily: 'DMMono_500Medium',
                fontSize: 13,
                backgroundColor: 'transparent',
                textAlign: 'center',
              }}
              placeholder="Amt"
              placeholderTextColor="#A09590"
              value={ing.amount}
              onChangeText={(v) => {
                const next = [...ingredients];
                next[i] = { ...next[i], amount: v };
                setIngredients(next);
              }}
            />
            <TextInput
              style={{
                width: 56,
                borderBottomWidth: 1,
                borderBottomColor: '#D5CCC0',
                paddingVertical: 8,
                color: '#C4622D',
                fontFamily: 'DMMono_500Medium',
                fontSize: 13,
                backgroundColor: 'transparent',
                textAlign: 'center',
              }}
              placeholder="Unit"
              placeholderTextColor="#A09590"
              value={ing.unit}
              onChangeText={(v) => {
                const next = [...ingredients];
                next[i] = { ...next[i], unit: v };
                setIngredients(next);
              }}
            />
            <TextInput
              style={{
                flex: 1,
                borderBottomWidth: 1,
                borderBottomColor: '#D5CCC0',
                paddingVertical: 8,
                color: '#1C1712',
                fontFamily: 'Lora_400Regular',
                fontSize: 14,
                backgroundColor: 'transparent',
              }}
              placeholder="Ingredient"
              placeholderTextColor="#A09590"
              value={ing.name}
              onChangeText={(v) => {
                const next = [...ingredients];
                next[i] = { ...next[i], name: v };
                setIngredients(next);
              }}
            />
            {ingredients.length > 1 && (
              <TouchableOpacity
                style={{ width: 32, alignItems: 'center', justifyContent: 'center' }}
                onPress={() => setIngredients(prev => prev.filter((_, idx) => idx !== i))}
              >
                <Text style={{ fontFamily: 'DMMono_400Regular', fontSize: 16, color: '#A09590' }}>×</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
        <TouchableOpacity
          style={{ paddingVertical: 10, marginBottom: 24 }}
          onPress={() => setIngredients(prev => [...prev, { amount: '', unit: '', name: '' }])}
        >
          <Text style={{
            fontFamily: 'DMMono_400Regular',
            fontSize: 11,
            letterSpacing: 1,
            color: '#C4622D',
          }}>
            + Add ingredient
          </Text>
        </TouchableOpacity>

        {/* Steps */}
        <Text style={{
          fontFamily: 'DMMono_400Regular',
          fontSize: 10,
          letterSpacing: 2,
          textTransform: 'uppercase',
          color: '#A09590',
          marginBottom: 12,
        }}>
          Steps
        </Text>
        {steps.map((step, i) => (
          <View key={i} style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
            <View style={{
              width: 26,
              height: 26,
              backgroundColor: 'transparent',
              borderWidth: 1,
              borderColor: '#C4622D',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 8,
              flexShrink: 0,
            }}>
              <Text style={{
                fontFamily: 'DMMono_500Medium',
                fontSize: 11,
                color: '#C4622D',
              }}>
                {i + 1}
              </Text>
            </View>
            <TextInput
              style={{
                flex: 1,
                borderBottomWidth: 1,
                borderBottomColor: '#D5CCC0',
                paddingVertical: 8,
                color: '#1C1712',
                fontFamily: 'Lora_400Regular',
                fontSize: 14,
                backgroundColor: 'transparent',
              }}
              placeholder={`Step ${i + 1}...`}
              placeholderTextColor="#A09590"
              value={step.instruction}
              onChangeText={(v) => {
                const next = [...steps];
                next[i] = { ...next[i], instruction: v };
                setSteps(next);
              }}
              multiline
            />
            {steps.length > 1 && (
              <TouchableOpacity
                style={{ width: 32, alignItems: 'center', justifyContent: 'center' }}
                onPress={() => setSteps(prev => prev.filter((_, idx) => idx !== i).map((s, idx) => ({ ...s, order: idx + 1 })))}
              >
                <Text style={{ fontFamily: 'DMMono_400Regular', fontSize: 16, color: '#A09590' }}>×</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
        <TouchableOpacity
          style={{ paddingVertical: 10, marginBottom: 24 }}
          onPress={() => setSteps(prev => [...prev, { order: prev.length + 1, instruction: '' }])}
        >
          <Text style={{
            fontFamily: 'DMMono_400Regular',
            fontSize: 11,
            letterSpacing: 1,
            color: '#C4622D',
          }}>
            + Add step
          </Text>
        </TouchableOpacity>

        {/* Tips */}
        <Text style={{
          fontFamily: 'DMMono_400Regular',
          fontSize: 10,
          letterSpacing: 2,
          textTransform: 'uppercase',
          color: '#A09590',
          marginBottom: 12,
        }}>
          Tips & Notes (optional)
        </Text>
        {tips.map((tip, i) => (
          <View key={i} style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
            <TextInput
              style={{
                flex: 1,
                borderBottomWidth: 1,
                borderBottomColor: '#D5CCC0',
                paddingVertical: 8,
                color: '#1C1712',
                fontFamily: 'Lora_400Regular',
                fontSize: 14,
                backgroundColor: 'transparent',
              }}
              placeholder="Tip..."
              placeholderTextColor="#A09590"
              value={tip.text}
              onChangeText={(v) => {
                const next = [...tips];
                next[i] = { text: v };
                setTips(next);
              }}
              multiline
            />
            <TouchableOpacity
              style={{ width: 32, alignItems: 'center', justifyContent: 'center' }}
              onPress={() => setTips(prev => prev.filter((_, idx) => idx !== i))}
            >
              <Text style={{ fontFamily: 'DMMono_400Regular', fontSize: 16, color: '#A09590' }}>×</Text>
            </TouchableOpacity>
          </View>
        ))}
        <TouchableOpacity
          style={{ paddingVertical: 10, marginBottom: 16 }}
          onPress={() => setTips(prev => [...prev, { text: '' }])}
        >
          <Text style={{
            fontFamily: 'DMMono_400Regular',
            fontSize: 11,
            letterSpacing: 1,
            color: '#C4622D',
          }}>
            + Add tip
          </Text>
        </TouchableOpacity>

        {/* Save button */}
        <TouchableOpacity
          style={{
            backgroundColor: '#C4622D',
            paddingVertical: 18,
            alignItems: 'center',
            marginBottom: 32,
          }}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#EDE8DC" />
          ) : (
            <Text style={{
              fontFamily: 'DMMono_400Regular',
              fontSize: 12,
              letterSpacing: 2.5,
              textTransform: 'uppercase',
              color: '#EDE8DC',
            }}>
              Save Recipe
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
