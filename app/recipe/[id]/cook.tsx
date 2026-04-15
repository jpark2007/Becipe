import { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, runOnJS } from 'react-native-reanimated';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { supabase } from '@/lib/supabase';
import type { Step, Ingredient, Tip } from '@/lib/database.types';
import { colors, radius, shadow } from '@/lib/theme';
import { Plate } from '@/components/Plate';
import { EditorialHeading } from '@/components/EditorialHeading';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

async function fetchRecipeForCook(id: string) {
  const { data, error } = await supabase
    .from('recipes')
    .select('title, cover_image_url, steps, ingredients, tips')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

// Pull a word to emphasize from a step instruction: take the last alphabetic
// word longer than 3 chars, else nothing.
function pickEmphasis(instruction: string): { base: string; emph?: string } {
  if (!instruction) return { base: '' };
  const match = instruction.match(/^(.*?)([\s,.]+)([A-Za-z]{4,})[.!?]?\s*$/);
  if (!match) return { base: instruction };
  return { base: match[1] + match[2], emph: match[3] };
}

export default function CookScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const [tipsOpen, setTipsOpen] = useState(false);
  const [ingredientsOpen, setIngredientsOpen] = useState(false);
  const [showLogPrompt, setShowLogPrompt] = useState(false);

  const translateX = useSharedValue(0);

  const { data: recipe, isLoading } = useQuery({
    queryKey: ['recipe-cook', id],
    queryFn: () => fetchRecipeForCook(id),
  });

  useEffect(() => {
    let activated = false;
    activateKeepAwakeAsync('cook-mode').then(() => { activated = true; });
    return () => { if (activated) deactivateKeepAwake('cook-mode'); };
  }, []);

  const steps = (recipe?.steps ?? []) as Step[];
  const ingredients = (recipe?.ingredients ?? []) as Ingredient[];
  const tips = (recipe?.tips ?? []) as Tip[];

  const goTo = useCallback((idx: number) => {
    setStepIndex(Math.max(0, Math.min(idx, steps.length - 1)));
  }, [steps.length]);

  const swipeGesture = Gesture.Pan()
    .onUpdate((e) => { translateX.value = e.translationX; })
    .onEnd((e) => {
      const threshold = SCREEN_WIDTH * 0.3;
      if (e.translationX < -threshold && stepIndex < steps.length - 1) {
        runOnJS(goTo)(stepIndex + 1);
      } else if (e.translationX > threshold && stepIndex > 0) {
        runOnJS(goTo)(stepIndex - 1);
      }
      translateX.value = withTiming(0, { duration: 200 });
    });

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value * 0.1 }],
  }));

  if (isLoading || !recipe) {
    return (
      <View style={[styles.root, styles.loading]}>
        <ActivityIndicator color={colors.sage} />
      </View>
    );
  }

  const currentStep = steps[stepIndex];
  const isDone = stepIndex === steps.length - 1;
  const { base, emph } = pickEmphasis(currentStep?.instruction ?? '');

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe}>
        {/* Header: close + timer pill */}
        <View style={styles.header}>
          <Pressable style={styles.iconBtn} onPress={() => router.back()}>
            <Text style={styles.iconBtnText}>×</Text>
          </Pressable>
          <View style={styles.timerPill}>
            <Text style={styles.timerPillText}>⏱ 12:45</Text>
          </View>
          <View style={styles.iconBtn} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <GestureDetector gesture={swipeGesture}>
            <Animated.View style={animStyle}>
              {/* Hero plate */}
              <View style={styles.heroWrap}>
                <Plate uri={recipe.cover_image_url} size={220} />
              </View>

              {/* Step eyebrow */}
              <Text style={styles.eyebrow}>
                STEP {String(stepIndex + 1).padStart(2, '0')} OF {String(steps.length).padStart(2, '0')}
              </Text>

              {/* Step title */}
              <View style={styles.titleWrap}>
                <EditorialHeading
                  size={32}
                  emphasis={emph}
                  emphasisColor="sage"
                  style={{ textAlign: 'center' }}
                >
                  {base}
                </EditorialHeading>
              </View>

              {/* Step body text */}
              {currentStep?.instruction ? (
                <Text style={styles.stepBody}>{currentStep.instruction}</Text>
              ) : null}

              {/* Step dots */}
              <View style={styles.dots}>
                {steps.map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.dot,
                      i <= stepIndex ? styles.dotActive : styles.dotIdle,
                    ]}
                  />
                ))}
              </View>
            </Animated.View>
          </GestureDetector>

          {/* Ingredients card */}
          <View style={styles.card}>
            <Pressable
              style={styles.cardHead}
              onPress={() => setIngredientsOpen((o) => !o)}
            >
              <Text style={styles.cardHeadLabel}>
                INGREDIENTS ({ingredients.length})
              </Text>
              <Text style={styles.cardHeadChevron}>
                {ingredientsOpen ? '▲' : '▼'}
              </Text>
            </Pressable>
            {ingredientsOpen && (
              <View style={styles.cardBody}>
                {ingredients.map((ing, i) => (
                  <Pressable
                    key={i}
                    style={styles.ingRow}
                    onPress={() => setChecked((prev) => ({ ...prev, [i]: !prev[i] }))}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        checked[i] ? styles.checkboxOn : styles.checkboxOff,
                      ]}
                    >
                      {checked[i] ? <Text style={styles.checkboxTick}>✓</Text> : null}
                    </View>
                    <Text
                      style={[
                        styles.ingText,
                        checked[i] ? styles.ingTextDone : null,
                      ]}
                    >
                      {ing.amount}{ing.unit ? ` ${ing.unit}` : ''} {ing.name}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          {/* Tips card */}
          {tips.length > 0 ? (
            <View style={styles.card}>
              <Pressable
                style={styles.cardHead}
                onPress={() => setTipsOpen((o) => !o)}
              >
                <Text style={styles.cardHeadLabel}>TIPS ({tips.length})</Text>
                <Text style={styles.cardHeadChevron}>
                  {tipsOpen ? '▲' : '▼'}
                </Text>
              </Pressable>
              {tipsOpen && (
                <View style={styles.cardBody}>
                  {tips.map((tip, i) => (
                    <Text key={i} style={styles.tipText}>
                      {tip.text}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          ) : null}
        </ScrollView>

        {/* Footer: prev / next / mic */}
        <View style={styles.footer}>
          <Pressable
            style={[styles.prevBtn, stepIndex === 0 ? styles.btnDisabled : null]}
            onPress={() => goTo(stepIndex - 1)}
            disabled={stepIndex === 0}
          >
            <Text style={styles.prevBtnText}>←</Text>
          </Pressable>
          <Pressable
            style={styles.nextBtn}
            onPress={() => (isDone ? setShowLogPrompt(true) : goTo(stepIndex + 1))}
          >
            <Text style={styles.nextBtnText}>
              {isDone ? 'finish' : 'next step →'}
            </Text>
          </Pressable>
          <Pressable
            style={styles.micBtn}
            onPress={() => router.push(`/recipe/${id}/voice-cook`)}
          >
            <MaterialCommunityIcons name="waveform" size={22} color={colors.ink} />
          </Pressable>
        </View>

        {showLogPrompt && (
          <View style={styles.promptOverlay}>
            <View style={styles.promptCard}>
              <Text style={styles.promptTitle}>Log your try?</Text>
              <Text style={styles.promptBody}>
                How did it turn out? Share a rating so others can see.
              </Text>
              <Pressable
                style={styles.promptPrimary}
                onPress={() => {
                  setShowLogPrompt(false);
                  router.replace(`/try/${id}` as any);
                }}
              >
                <Text style={styles.promptPrimaryText}>Log a try</Text>
              </Pressable>
              <Pressable
                style={styles.promptSecondary}
                onPress={() => {
                  setShowLogPrompt(false);
                  router.back();
                }}
              >
                <Text style={styles.promptSecondaryText}>Not now</Text>
              </Pressable>
            </View>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bone },
  safe: { flex: 1 },
  loading: { alignItems: 'center', justifyContent: 'center' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 20,
    color: colors.inkSoft,
    lineHeight: 22,
  },
  timerPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.sage,
  },
  timerPillText: {
    color: '#FFFFFF',
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
    letterSpacing: 0.2,
  },

  scrollContent: {
    paddingHorizontal: 22,
    paddingBottom: 20,
  },

  heroWrap: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 22,
  },

  eyebrow: {
    textAlign: 'center',
    color: colors.sage,
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    letterSpacing: 1.6,
    marginBottom: 10,
  },
  titleWrap: {
    alignItems: 'center',
    marginBottom: 14,
  },
  stepBody: {
    textAlign: 'center',
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    lineHeight: 23,
    color: colors.inkSoft,
    marginBottom: 18,
  },

  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 22,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: { backgroundColor: colors.sage },
  dotIdle: { backgroundColor: colors.border },

  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 12,
    overflow: 'hidden',
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  cardHeadLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    color: colors.muted,
    letterSpacing: 1.6,
  },
  cardHeadChevron: {
    fontFamily: 'Inter_500Medium',
    fontSize: 10,
    color: colors.muted,
  },
  cardBody: {
    paddingHorizontal: 18,
    paddingBottom: 14,
  },
  ingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOff: {
    borderColor: colors.border,
    backgroundColor: 'transparent',
  },
  checkboxOn: {
    borderColor: colors.sage,
    backgroundColor: colors.sage,
  },
  checkboxTick: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
  },
  ingText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: colors.inkSoft,
    flex: 1,
  },
  ingTextDone: {
    color: colors.muted,
    textDecorationLine: 'line-through',
  },
  tipText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    lineHeight: 20,
    color: colors.inkSoft,
    marginBottom: 8,
  },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bone,
  },
  prevBtn: {
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prevBtnText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: colors.inkSoft,
  },
  btnDisabled: { opacity: 0.35 },
  nextBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: radius.pill,
    backgroundColor: colors.sage,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.cta,
  },
  nextBtnText: {
    color: '#FFFFFF',
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    letterSpacing: 0.3,
  },
  micBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.claySoft,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.cta,
  },
  micBtnText: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    color: colors.ink,
  },

  promptOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(12, 10, 8, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  promptCard: {
    width: '100%',
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: 22,
    ...shadow.card,
  },
  promptTitle: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 20,
    color: colors.ink,
    letterSpacing: -0.4,
    marginBottom: 8,
  },
  promptBody: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: colors.inkSoft,
    lineHeight: 20,
    marginBottom: 18,
  },
  promptPrimary: {
    backgroundColor: colors.clay,
    borderRadius: radius.pill,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
    ...shadow.cta,
  },
  promptPrimaryText: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 14,
    color: '#fff',
  },
  promptSecondary: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  promptSecondaryText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
    color: colors.muted,
  },
});
