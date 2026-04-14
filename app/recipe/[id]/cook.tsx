import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, runOnJS } from 'react-native-reanimated';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { COLORS, FONTS } from '@/lib/theme';
import type { Step, Ingredient, Tip } from '@/lib/database.types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

async function fetchRecipeForCook(id: string) {
  const { data, error } = await supabase
    .from('recipes')
    .select('title, steps, ingredients, tips')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export default function CookScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const [tipsOpen, setTipsOpen] = useState(false);
  const [ingredientsOpen, setIngredientsOpen] = useState(true);

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
      <View style={{ flex: 1, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={COLORS.primaryContainer} />
      </View>
    );
  }

  const currentStep = steps[stepIndex];
  const progress = (stepIndex + 1) / steps.length;
  const isDone = stepIndex === steps.length - 1;

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.surface }}>

      {/* Header */}
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 56,
        paddingBottom: 16,
        backgroundColor: COLORS.surface,
      }}>
        <View style={{ flex: 1 }}>
          <Text style={{
            fontFamily: FONTS.mono,
            fontSize: 11,
            letterSpacing: 2,
            color: COLORS.onSurfaceVariant,
            textTransform: 'uppercase',
            marginBottom: 10,
          }}>
            {recipe.title}
          </Text>
          {/* Progress bar */}
          <View style={{ height: 1, backgroundColor: COLORS.outlineVariant + '33' }}>
            <View style={{ height: 1, backgroundColor: COLORS.primaryContainer, width: `${progress * 100}%` }} />
          </View>
        </View>
        <TouchableOpacity
          style={{ marginLeft: 20, paddingVertical: 4, paddingHorizontal: 8 }}
          onPress={() => router.back()}
        >
          <Text style={{ fontFamily: FONTS.mono, fontSize: 20, color: COLORS.onSurfaceVariant }}>×</Text>
        </TouchableOpacity>
      </View>

      {/* Step counter */}
      <Text style={{
        fontFamily: FONTS.mono,
        fontSize: 11,
        letterSpacing: 2,
        color: COLORS.onSurfaceVariant,
        textTransform: 'uppercase',
        textAlign: 'center',
        marginBottom: 8,
      }}>
        {stepIndex + 1} — {steps.length}
      </Text>

      {/* Step instruction — swipeable */}
      <GestureDetector gesture={swipeGesture}>
        <Animated.View style={[animStyle, { flex: 1 }]}>
          <View style={{ flex: 1, paddingHorizontal: 28, justifyContent: 'center' }}>
            <Text style={{
              fontFamily: FONTS.headlineBold,
              fontSize: 32,
              color: COLORS.onSurface,
              lineHeight: 40,
              letterSpacing: -0.5,
              textAlign: 'center',
            }}>
              {currentStep?.instruction}
            </Text>
            <Text style={{
              fontFamily: FONTS.mono,
              fontSize: 9,
              color: COLORS.outlineVariant,
              textAlign: 'center',
              marginTop: 32,
              letterSpacing: 1.5,
            }}>
              SWIPE TO NAVIGATE
            </Text>
          </View>
        </Animated.View>
      </GestureDetector>

      {/* Prev / Next */}
      <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 20, paddingBottom: 16 }}>
        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            paddingHorizontal: 20,
            paddingVertical: 14,
            backgroundColor: COLORS.surfaceContainerLow,
            borderRadius: 100,
            opacity: stepIndex === 0 ? 0.3 : 1,
          }}
          onPress={() => goTo(stepIndex - 1)}
          disabled={stepIndex === 0}
        >
          <Text style={{ fontFamily: FONTS.bodyBold, fontSize: 12, letterSpacing: 1, color: COLORS.onSurface, textTransform: 'uppercase' }}>
            ← PREV
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            paddingHorizontal: 24,
            paddingVertical: 14,
            backgroundColor: isDone ? '#3A6A3A' : COLORS.primaryContainer,
            borderRadius: 100,
          }}
          onPress={() => isDone ? router.back() : goTo(stepIndex + 1)}
        >
          <Text style={{ fontFamily: FONTS.bodyBold, fontSize: 12, letterSpacing: 1, color: COLORS.onPrimaryContainer, textTransform: 'uppercase' }}>
            {isDone ? 'DONE' : 'NEXT →'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Ingredients collapsible */}
      <View style={{ borderTopWidth: 1, borderTopColor: COLORS.outlineVariant + '33' }}>
        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 }}
          onPress={() => setIngredientsOpen(o => !o)}
        >
          <Text style={{ fontFamily: FONTS.mono, fontSize: 9, color: COLORS.onSurfaceVariant, letterSpacing: 2.5 }}>
            INGREDIENTS ({ingredients.length})
          </Text>
          <Text style={{ fontFamily: FONTS.mono, fontSize: 10, color: COLORS.onSurfaceVariant }}>
            {ingredientsOpen ? '▲' : '▼'}
          </Text>
        </TouchableOpacity>
        {ingredientsOpen && (
          <ScrollView style={{ maxHeight: 140, paddingHorizontal: 20, paddingBottom: 12 }}>
            {ingredients.map((ing, i) => (
              <TouchableOpacity
                key={i}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 10 }}
                onPress={() => setChecked(prev => ({ ...prev, [i]: !prev[i] }))}
              >
                <View style={{
                  width: 20,
                  height: 20,
                  borderWidth: 2,
                  borderColor: checked[i] ? COLORS.primary : COLORS.outlineVariant,
                  borderRadius: 2,
                  backgroundColor: checked[i] ? COLORS.primary : 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {checked[i] && <Text style={{ fontFamily: FONTS.mono, fontSize: 10, color: COLORS.onPrimary }}>✓</Text>}
                </View>
                <Text style={{
                  fontFamily: FONTS.mono,
                  fontSize: 10,
                  color: COLORS.onSurfaceVariant,
                  textTransform: 'uppercase',
                  textDecorationLine: checked[i] ? 'line-through' : 'none',
                  opacity: checked[i] ? 0.5 : 1,
                }}>
                  {ing.amount}{ing.unit ? ` ${ing.unit}` : ''} {ing.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Tips collapsible */}
      {tips.length > 0 && (
        <View style={{ borderTopWidth: 1, borderTopColor: COLORS.outlineVariant + '33' }}>
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 10 }}
            onPress={() => setTipsOpen(o => !o)}
          >
            <Text style={{ fontFamily: FONTS.mono, fontSize: 9, color: COLORS.onSurfaceVariant, letterSpacing: 2.5 }}>TIPS</Text>
            <Text style={{ fontFamily: FONTS.mono, fontSize: 10, color: COLORS.onSurfaceVariant }}>{tipsOpen ? '▲' : '▼'}</Text>
          </TouchableOpacity>
          {tipsOpen && (
            <ScrollView style={{ maxHeight: 110, paddingHorizontal: 20, paddingBottom: 12 }}>
              {tips.map((tip, i) => (
                <Text key={i} style={{ fontFamily: FONTS.body, fontSize: 13, color: COLORS.onSurfaceVariant, marginBottom: 6, lineHeight: 20 }}>
                  {tip.text}
                </Text>
              ))}
            </ScrollView>
          )}
        </View>
      )}
    </View>
  );
}
