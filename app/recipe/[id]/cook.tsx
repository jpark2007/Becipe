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
      <View style={{ flex: 1, backgroundColor: '#F8F4EE', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#C4622D" />
      </View>
    );
  }

  const currentStep = steps[stepIndex];
  const progress = (stepIndex + 1) / steps.length;
  const isDone = stepIndex === steps.length - 1;

  return (
    <View style={{ flex: 1, backgroundColor: '#F8F4EE' }}>

      {/* ── Header ── */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: 'DMMono_400Regular', fontSize: 10, color: '#B5ADA8', letterSpacing: 1.5, marginBottom: 10 }}>
            {recipe.title.toUpperCase()}
          </Text>
          {/* Thin progress bar */}
          <View style={{ height: 1, backgroundColor: '#D5CCC0' }}>
            <View style={{ height: 1, backgroundColor: '#C4622D', width: `${progress * 100}%` }} />
          </View>
        </View>
        <TouchableOpacity
          style={{ marginLeft: 20, paddingVertical: 4, paddingHorizontal: 8 }}
          onPress={() => router.back()}
        >
          <Text style={{ fontFamily: 'DMMono_400Regular', fontSize: 18, color: '#A09590' }}>×</Text>
        </TouchableOpacity>
      </View>

      {/* Step counter */}
      <Text style={{ fontFamily: 'DMMono_400Regular', fontSize: 10, color: '#B5ADA8', letterSpacing: 2, textAlign: 'center', marginBottom: 8 }}>
        {stepIndex + 1} — {steps.length}
      </Text>

      {/* ── Step instruction — swipeable ── */}
      <GestureDetector gesture={swipeGesture}>
        <Animated.View style={[animStyle, { flex: 1 }]}>
          <View style={{ flex: 1, paddingHorizontal: 28, justifyContent: 'center' }}>
            <Text style={{
              fontFamily: 'CormorantGaramond_400Regular',
              fontSize: 32,
              color: '#1C1712',
              lineHeight: 44,
              textAlign: 'center',
            }}>
              {currentStep?.instruction}
            </Text>
            {/* Swipe hint */}
            <Text style={{ fontFamily: 'DMMono_400Regular', fontSize: 9, color: '#C8BFB8', textAlign: 'center', marginTop: 32, letterSpacing: 1.5 }}>
              SWIPE TO NAVIGATE
            </Text>
          </View>
        </Animated.View>
      </GestureDetector>

      {/* ── Prev / Next ── */}
      <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 20, paddingBottom: 16 }}>
        <TouchableOpacity
          style={{
            flex: 1, paddingVertical: 14, alignItems: 'center',
            borderWidth: 1, borderColor: stepIndex === 0 ? '#D8D0C8' : '#D5CCC0',
            opacity: stepIndex === 0 ? 0.3 : 1,
          }}
          onPress={() => goTo(stepIndex - 1)}
          disabled={stepIndex === 0}
        >
          <Text style={{ fontFamily: 'DMMono_400Regular', fontSize: 11, color: '#A09590', letterSpacing: 2 }}>← PREV</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            flex: 1, paddingVertical: 14, alignItems: 'center',
            backgroundColor: isDone ? '#3A6A3A' : '#C4622D',
          }}
          onPress={() => isDone ? router.back() : goTo(stepIndex + 1)}
        >
          <Text style={{ fontFamily: 'DMMono_500Medium', fontSize: 11, color: '#EDE8DC', letterSpacing: 2 }}>
            {isDone ? 'DONE' : 'NEXT →'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Ingredients collapsible ── */}
      <View style={{ borderTopWidth: 1, borderTopColor: '#D8D2CB' }}>
        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 }}
          onPress={() => setIngredientsOpen(o => !o)}
        >
          <Text style={{ fontFamily: 'DMMono_400Regular', fontSize: 9, color: '#A09590', letterSpacing: 2.5 }}>
            INGREDIENTS ({ingredients.length})
          </Text>
          <Text style={{ fontFamily: 'DMMono_400Regular', fontSize: 10, color: '#B5ADA8' }}>
            {ingredientsOpen ? '▲' : '▼'}
          </Text>
        </TouchableOpacity>
        {ingredientsOpen && (
          <ScrollView style={{ maxHeight: 140, paddingHorizontal: 20, paddingBottom: 12 }}>
            {ingredients.map((ing, i) => (
              <TouchableOpacity
                key={i}
                style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 6 }}
                onPress={() => setChecked(prev => ({ ...prev, [i]: !prev[i] }))}
              >
                <View style={{
                  width: 14, height: 14, borderWidth: 1,
                  borderColor: checked[i] ? '#C4622D' : '#C8BFB8',
                  backgroundColor: checked[i] ? '#C4622D' : 'transparent',
                  marginRight: 12, alignItems: 'center', justifyContent: 'center',
                }}>
                  {checked[i] && <Text style={{ fontFamily: 'DMMono_400Regular', fontSize: 8, color: '#EDE8DC' }}>✓</Text>}
                </View>
                <Text style={{
                  fontFamily: 'DMMono_400Regular', fontSize: 12,
                  color: checked[i] ? '#B5ACA4' : '#A09590',
                  textDecorationLine: checked[i] ? 'line-through' : 'none',
                }}>
                  {ing.amount}{ing.unit ? ` ${ing.unit}` : ''} {ing.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {/* ── Tips collapsible ── */}
      {tips.length > 0 && (
        <View style={{ borderTopWidth: 1, borderTopColor: '#DDD5CD' }}>
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 10 }}
            onPress={() => setTipsOpen(o => !o)}
          >
            <Text style={{ fontFamily: 'DMMono_400Regular', fontSize: 9, color: '#B5ADA8', letterSpacing: 2.5 }}>TIPS</Text>
            <Text style={{ fontFamily: 'DMMono_400Regular', fontSize: 10, color: '#C8BFB8' }}>{tipsOpen ? '▲' : '▼'}</Text>
          </TouchableOpacity>
          {tipsOpen && (
            <ScrollView style={{ maxHeight: 110, paddingHorizontal: 20, paddingBottom: 12 }}>
              {tips.map((tip, i) => (
                <Text key={i} style={{ fontFamily: 'Lora_400Regular', fontSize: 12, color: '#B5ADA8', marginBottom: 6, lineHeight: 18 }}>
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
