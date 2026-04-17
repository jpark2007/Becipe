import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import { useRouter } from 'expo-router';
import { colors, radius, shadow } from '@/lib/theme';
import { EditorialHeading } from '@/components/EditorialHeading';
import { PalateVector, PALATE_AXES, emptyPalate } from '@/lib/palate';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';

const LABELS: Record<keyof PalateVector, string> = {
  sweet: 'Sweet', spicy: 'Spicy', savory: 'Savory', sour: 'Sour', bitter: 'Bitter',
};

export default function PalateQuiz() {
  const router = useRouter();
  const profile = useAuthStore(s => s.profile);
  const setProfile = useAuthStore(s => s.setProfile);
  const [vector, setVector] = useState<PalateVector>(emptyPalate());
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
    router.replace('/(tabs)/feed');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.head}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>←</Text>
        </Pressable>
        <Text style={styles.step}>step 1 of 1</Text>
        <Text style={styles.skip}> </Text>
      </View>

      <View style={styles.progBar}>
        <View style={[styles.progFill, { width: '100%' }]} />
      </View>

      <Text style={styles.eyebrow}>YOUR PALATE</Text>
      <EditorialHeading size={36} emphasis="food?" emphasisColor="sage">
        How do you like{'\n'}your
      </EditorialHeading>
      <Text style={styles.sub}>
        Drag each slider. We'll match you to cooks whose food you'll actually love.
      </Text>

      <View style={styles.sliders}>
        {PALATE_AXES.map(axis => (
          <View key={axis} style={styles.row}>
            <Text style={styles.label}>{LABELS[axis]}</Text>
            <Slider
              style={{ flex: 1, marginHorizontal: 10 }}
              minimumValue={0}
              maximumValue={100}
              value={vector[axis]}
              minimumTrackTintColor={colors.sage}
              maximumTrackTintColor={colors.border}
              thumbTintColor={colors.sage}
              onValueChange={(v: number) => setVector(prev => ({ ...prev, [axis]: Math.round(v) }))}
            />
            <Text style={styles.val}>{vector[axis]}</Text>
          </View>
        ))}
      </View>

      <Pressable
        style={[styles.cta, saving && { opacity: 0.6 }]}
        onPress={handleSave}
        disabled={saving}
      >
        <Text style={styles.ctaText}>{saving ? 'saving…' : 'continue →'}</Text>
      </Pressable>
      <Text style={styles.hint}>you can tune this anytime</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bone, paddingHorizontal: 24 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 14, paddingBottom: 18 },
  back: { fontSize: 22, color: colors.ink },
  step: { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: colors.muted },
  skip: { width: 22 },
  progBar: { height: 5, backgroundColor: colors.border, borderRadius: 999, overflow: 'hidden', marginBottom: 26 },
  progFill: { height: '100%', backgroundColor: colors.sage, borderRadius: 999 },
  eyebrow: { fontFamily: 'Inter_700Bold', fontSize: 11, color: colors.sage, letterSpacing: 1.2, marginBottom: 8 },
  sub: { fontFamily: 'Inter_500Medium', fontSize: 14, color: colors.muted, lineHeight: 21, marginTop: 14, marginBottom: 26 },
  sliders: { gap: 18 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { fontFamily: 'Inter_700Bold', fontSize: 13, color: colors.ink, width: 60 },
  val: { fontFamily: 'Inter_700Bold', fontSize: 12, color: colors.ink, width: 28, textAlign: 'right' },
  cta: { backgroundColor: colors.sage, borderRadius: 999, paddingVertical: 17, alignItems: 'center', marginTop: 28, ...shadow.cta },
  ctaText: { fontFamily: 'Inter_700Bold', fontSize: 14, color: '#fff', letterSpacing: -0.1 },
  hint: { fontFamily: 'Inter_500Medium', fontSize: 11, color: colors.muted, textAlign: 'center', marginTop: 12 },
});
