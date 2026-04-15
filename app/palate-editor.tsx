// app/palate-editor.tsx
// Tactile slider cards for editing the 5 palate axes. Root-level route
// (NOT under (onboarding)) so the auth gate's onboarding redirect does
// not bounce users to the feed on open.
import { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import { useRouter } from 'expo-router';
import { colors, radius, shadow } from '@/lib/theme';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';
import {
  PalateVector,
  PALATE_AXES,
  emptyPalate,
  parsePalate,
} from '@/lib/palate';

type AxisMeta = {
  key: keyof PalateVector;
  label: string;
  emoji: string;
  subtitle: string;
  min: string;
  max: string;
  trackColor: string;
};

const AXES: AxisMeta[] = [
  {
    key: 'sweet',
    label: 'SWEET',
    emoji: '🍬',
    subtitle: 'FROM SUBTLE TO SYRUPY',
    min: 'SUBTLE',
    max: 'DOMINANT',
    trackColor: colors.clay,
  },
  {
    key: 'spicy',
    label: 'SPICY',
    emoji: '🌶️',
    subtitle: 'FROM MILD TO FIERY',
    min: 'MILD',
    max: 'FIERY',
    trackColor: colors.clay,
  },
  {
    key: 'savory',
    label: 'SAVORY',
    emoji: '🍖',
    subtitle: 'FROM LIGHT TO DEEP UMAMI',
    min: 'LIGHT',
    max: 'DEEP',
    trackColor: colors.ochre,
  },
  {
    key: 'sour',
    label: 'SOUR',
    emoji: '🍋',
    subtitle: 'FROM BRIGHT TO PUCKERING',
    min: 'BRIGHT',
    max: 'PUCKER',
    trackColor: colors.ochre,
  },
  {
    key: 'bitter',
    label: 'BITTER',
    emoji: '🌿',
    subtitle: 'FROM GENTLE TO BOLD',
    min: 'GENTLE',
    max: 'BOLD',
    trackColor: colors.sage,
  },
];

function profileShape(v: PalateVector): string {
  const entries = PALATE_AXES.map(k => [k, v[k]] as const);
  const spread = Math.max(...entries.map(([, n]) => n)) - Math.min(...entries.map(([, n]) => n));
  if (spread < 20) return 'BALANCED PROFILE';
  const top = entries.reduce((a, b) => (b[1] > a[1] ? b : a));
  return `${top[0].toUpperCase()}-LEANING`;
}

export default function PalateEditorScreen() {
  const router = useRouter();
  const profile = useAuthStore(s => s.profile);
  const setProfile = useAuthStore(s => s.setProfile);
  const initial = parsePalate(profile?.palate_vector) ?? emptyPalate();
  const [vector, setVector] = useState<PalateVector>(initial);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!profile) return;
    setSaving(true);
    const { data, error } = await (supabase
      .from('profiles') as any)
      .update({ palate_vector: vector })
      .eq('id', profile.id)
      .select()
      .single();
    setSaving(false);
    if (error) {
      Alert.alert('Could not save', error.message);
      return;
    }
    setProfile(data);
    router.back();
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.head}>
        <Pressable
          style={styles.closeBtn}
          onPress={() => router.back()}
          hitSlop={10}
        >
          <Text style={styles.closeText}>×</Text>
        </Pressable>
        <Text style={styles.title}>The Ledger</Text>
        <View style={{ width: 36 }} />
      </View>

      <Text style={styles.helper}>
        Fine-tune your sensory signature. Shape the flavors you crave.
      </Text>

      <View style={styles.shapePill}>
        <Text style={styles.shapePillText}>{profileShape(vector)}</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 120, gap: 14 }}
        showsVerticalScrollIndicator={false}
      >
        {AXES.map(axis => (
          <View key={axis.key} style={styles.card}>
            <View style={styles.cardHead}>
              <View style={styles.emojiChip}>
                <Text style={styles.emoji}>{axis.emoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardLabel}>{axis.label}</Text>
                <Text style={styles.cardSub}>{axis.subtitle}</Text>
              </View>
              <Text style={[styles.value, { color: axis.trackColor }]}>
                {vector[axis.key]}%
              </Text>
            </View>

            <Slider
              style={{ marginTop: 6, marginHorizontal: -4 }}
              minimumValue={0}
              maximumValue={100}
              value={vector[axis.key]}
              minimumTrackTintColor={axis.trackColor}
              maximumTrackTintColor={colors.border}
              thumbTintColor={axis.trackColor}
              onValueChange={(v: number) =>
                setVector(prev => ({ ...prev, [axis.key]: Math.round(v) }))
              }
            />

            <View style={styles.endRow}>
              <Text style={styles.endLabel}>{axis.min}</Text>
              <Text style={styles.endLabel}>{axis.max}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={[styles.saveBtn, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveBtnText}>
            {saving ? 'saving…' : 'Save Flavor Profile ✓'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bone, paddingHorizontal: 22 },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    paddingBottom: 6,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
    color: colors.muted,
    lineHeight: 24,
  },
  title: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 20,
    color: colors.ink,
    letterSpacing: -0.4,
  },
  helper: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: colors.muted,
    lineHeight: 19,
    marginTop: 14,
  },
  shapePill: {
    alignSelf: 'flex-start',
    backgroundColor: colors.sageSoft,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radius.pill,
    marginTop: 14,
    marginBottom: 14,
  },
  shapePillText: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 10,
    color: colors.sage,
    letterSpacing: 1.1,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    ...shadow.card,
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  emojiChip: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.borderSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 22 },
  cardLabel: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 12,
    color: colors.ink,
    letterSpacing: 1.2,
  },
  cardSub: {
    fontFamily: 'Inter_500Medium',
    fontSize: 10,
    color: colors.muted,
    letterSpacing: 0.6,
    marginTop: 2,
  },
  value: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 28,
    letterSpacing: -0.8,
  },
  endRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  endLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: 9,
    color: colors.muted,
    letterSpacing: 0.8,
  },
  footer: {
    position: 'absolute',
    left: 22,
    right: 22,
    bottom: 22,
  },
  saveBtn: {
    backgroundColor: colors.clay,
    borderRadius: radius.lg,
    paddingVertical: 17,
    alignItems: 'center',
    ...shadow.cta,
  },
  saveBtnText: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 15,
    color: '#fff',
    letterSpacing: -0.2,
  },
});
