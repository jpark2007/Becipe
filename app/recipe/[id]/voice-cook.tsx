// app/recipe/[id]/voice-cook.tsx
import { View, Text, Pressable, StyleSheet, SafeAreaView, ImageBackground } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { colors } from '@/lib/theme';
import { EditorialHeading } from '@/components/EditorialHeading';

export default function VoiceCookScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { data: recipe } = useQuery({
    queryKey: ['recipe-voice', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recipes')
        .select('id, title, cover_image_url, steps')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const steps: string[] = (recipe?.steps as any[]) || [];
  // TODO: wire to actual cook state when voice mode goes live (Whisper + TTS).
  // Hardcoded for the v2 visual mockup.
  const stepIndex = 2;
  const stepText = steps[stepIndex] || 'Slice the cremini thinly — about a quarter inch, roughly the same size. Say next when you\'re done.';

  return (
    <View style={styles.root}>
      <ImageBackground
        source={{ uri: recipe?.cover_image_url ?? undefined }}
        style={styles.bg}
      >
        <View style={styles.dim} />
        <SafeAreaView style={styles.safe}>
          <View style={styles.head}>
            <Pressable style={styles.iconBtn} onPress={() => router.back()}>
              <Text style={styles.iconText}>←</Text>
            </Pressable>
            <Pressable style={styles.iconBtn}>
              <Text style={styles.iconText}>⋯</Text>
            </Pressable>
          </View>

          <View style={styles.askPill}>
            <Text style={styles.askText}>💬 ask julian anything</Text>
          </View>

          <View style={styles.center}>
            <Text style={styles.eyebrow}>STEP {String(stepIndex + 1).padStart(2, '0')} · HANDS-FREE</Text>
            <EditorialHeading size={42} emphasis="mushrooms" emphasisColor="ochre" style={{ color: '#fff', textAlign: 'center' }}>
              {'Cutting\n'}
            </EditorialHeading>
            <View style={styles.wave}>
              {[14, 24, 38, 30, 44, 22, 34, 48, 26, 40, 18, 32, 42, 20, 28].map((h, i) => (
                <View
                  key={i}
                  style={{
                    width: 4,
                    height: h,
                    backgroundColor: i % 3 === 2 ? '#E8B87C' : 'rgba(255,255,255,0.85)',
                    borderRadius: 999,
                  }}
                />
              ))}
            </View>
          </View>

          <View style={styles.caption}>
            <Text style={styles.capLabel}>● LISTENING</Text>
            <Text style={styles.capText}>"{stepText}"</Text>
          </View>

          <View style={styles.foot}>
            <Pressable style={styles.vBtn}><Text style={styles.vBtnText}>← back</Text></Pressable>
            <Pressable style={styles.mic}><Text style={{ fontSize: 22 }}>🎤</Text></Pressable>
            <Pressable style={styles.vBtn}><Text style={styles.vBtnText}>next →</Text></Pressable>
          </View>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#1A1512' },
  bg: { flex: 1 },
  // Heavier scrim instead of blurRadius — RN's blurRadius is slow / broken on Android.
  // expo-blur is the production answer if we ever ship this for real.
  dim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10,8,6,0.72)' },
  safe: { flex: 1, paddingHorizontal: 22, paddingBottom: 24, position: 'relative' },
  head: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 14 },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  iconText: { color: '#fff', fontSize: 16 },
  askPill: {
    position: 'absolute', top: 72, alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
  },
  askText: { color: 'rgba(255,255,255,0.92)', fontFamily: 'Inter_600SemiBold', fontSize: 11 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 18 },
  eyebrow: { color: 'rgba(255,255,255,0.6)', fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.5 },
  wave: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 48 },
  caption: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20, padding: 18,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)',
    marginBottom: 16,
  },
  capLabel: { color: '#E8B87C', fontFamily: 'Inter_700Bold', fontSize: 9, letterSpacing: 1.5, marginBottom: 6 },
  capText: { color: 'rgba(255,255,255,0.95)', fontFamily: 'Inter_500Medium', fontSize: 14, lineHeight: 20, fontStyle: 'italic' },
  foot: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  vBtn: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
    borderRadius: 999, paddingVertical: 13, alignItems: 'center',
  },
  vBtnText: { color: '#fff', fontFamily: 'Inter_700Bold', fontSize: 12 },
  mic: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#E8B87C', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#E8B87C', shadowOpacity: 0.6, shadowRadius: 12,
  },
});
