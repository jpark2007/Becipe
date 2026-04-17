// app/voice-dictate.tsx
// Voice dictation stub — UI only, backend deferred.
import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, shadow } from '@/lib/theme';
import { EditorialHeading } from '@/components/EditorialHeading';

type DictState = 'idle' | 'listening' | 'thinking' | 'done';

const STATE_LABELS: Record<DictState, string> = {
  idle: 'TAP TO START',
  listening: '● LISTENING…',
  thinking: '◌ THINKING…',
  done: '✓ GOT IT',
};

const STATE_COLORS: Record<DictState, string> = {
  idle: colors.muted,
  listening: colors.clay,
  thinking: colors.ochre,
  done: colors.sage,
};

const FAKE_SUMMARY =
  '"Miso Salmon with Glazed Cucumbers"\n' +
  '· salmon fillet, white miso, mirin, soy sauce\n' +
  '· cucumber, rice vinegar, sesame oil, sesame seed\n' +
  '· honey, garlic\n\n' +
  '1. Whisk miso, mirin, soy, honey into a glaze.\n' +
  '2. Marinate salmon 20 min; broil 8 min.\n' +
  '3. Toss cucumbers in vinegar, sesame oil, seeds.';

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export default function VoiceDictateScreen() {
  const router = useRouter();
  const [dictState, setDictState] = useState<DictState>('idle');
  const [isRunning, setIsRunning] = useState(false);

  async function simulateDictation() {
    if (isRunning) return;
    setIsRunning(true);
    setDictState('listening');
    await sleep(2000);
    setDictState('thinking');
    await sleep(1500);
    setDictState('done');
    setIsRunning(false);
  }

  function getCaptionText(): string {
    switch (dictState) {
      case 'idle': return 'tap the mic below to begin';
      case 'listening': return '…';
      case 'thinking': return '"miso salmon with glazed cucumbers…"';
      case 'done': return FAKE_SUMMARY;
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Top row */}
      <View style={styles.topRow}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>←</Text>
        </Pressable>
        <Text style={styles.topTitle}>VOICE DICTATE</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Heading */}
      <View style={styles.headingArea}>
        <EditorialHeading size={32} emphasis="recipe" emphasisColor="clay">
          {'Tell me a\n'}
        </EditorialHeading>
        <Text style={styles.helper}>
          tap the mic and say: &ldquo;miso salmon with glazed cucumbers…&rdquo; — we&apos;ll fill in the details
        </Text>
      </View>

      {/* State label */}
      <Text style={[styles.stateLabel, { color: STATE_COLORS[dictState] }]}>
        {STATE_LABELS[dictState]}
      </Text>

      {/* Mic button */}
      <Pressable
        style={[styles.micBtn, dictState === 'idle' ? styles.micBtnIdle : styles.micBtnActive]}
        onPress={simulateDictation}
        disabled={isRunning && dictState !== 'done'}
      >
        <Text style={styles.micGlyph}>🎤</Text>
      </Pressable>

      {/* Caption card */}
      <View style={styles.captionCard}>
        <Text style={styles.captionLabel}>WHAT WE HEARD</Text>
        <Text style={styles.captionText}>{getCaptionText()}</Text>
      </View>

      {/* Action buttons (done state only) */}
      {dictState === 'done' && (
        <View style={styles.actionRow}>
          <Pressable style={styles.cancelBtn} onPress={() => router.back()}>
            <Text style={styles.cancelBtnText}>cancel</Text>
          </Pressable>
          <Pressable
            style={styles.useBtn}
            onPress={() => {
              Alert.alert('Coming Soon', 'Voice dictation is almost ready — check back soon!');
              router.back();
            }}
          >
            <Text style={styles.useBtnText}>use this →</Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bone, paddingHorizontal: 22 },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 14,
    marginBottom: 20,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.card,
    alignItems: 'center', justifyContent: 'center',
    ...shadow.cta,
  },
  backBtnText: { fontFamily: 'Inter_700Bold', fontSize: 16, color: colors.ink },
  topTitle: {
    fontFamily: 'Inter_700Bold', fontSize: 11,
    color: colors.muted, letterSpacing: 1.5, textTransform: 'uppercase',
  },
  headingArea: { marginBottom: 10 },
  helper: {
    fontFamily: 'Inter_500Medium', fontSize: 13,
    color: colors.muted, lineHeight: 20, marginTop: 6,
  },
  stateLabel: {
    fontFamily: 'Inter_700Bold', fontSize: 11,
    letterSpacing: 2, textTransform: 'uppercase',
    textAlign: 'center', marginBottom: 18,
  },
  micBtn: {
    width: 96, height: 96, borderRadius: 48,
    alignSelf: 'center',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 24,
    ...shadow.cta,
  },
  micBtnIdle: { backgroundColor: colors.card, borderWidth: 2, borderColor: colors.border },
  micBtnActive: { backgroundColor: colors.clay },
  micGlyph: { fontSize: 36 },
  captionCard: {
    backgroundColor: colors.card,
    borderRadius: 16, padding: 18,
    borderWidth: 1, borderColor: colors.border,
    marginBottom: 20,
    minHeight: 80,
  },
  captionLabel: {
    fontFamily: 'Inter_700Bold', fontSize: 10,
    color: colors.muted, letterSpacing: 1.2,
    textTransform: 'uppercase', marginBottom: 8,
  },
  captionText: {
    fontFamily: 'Inter_500Medium', fontSize: 14,
    color: colors.ink, lineHeight: 22,
  },
  actionRow: {
    flexDirection: 'row', gap: 12,
  },
  cancelBtn: {
    flex: 1, paddingVertical: 16,
    borderRadius: 999, borderWidth: 1.5, borderColor: colors.border,
    alignItems: 'center',
  },
  cancelBtnText: { fontFamily: 'Inter_700Bold', fontSize: 13, color: colors.inkSoft },
  useBtn: {
    flex: 2, paddingVertical: 16,
    borderRadius: 999, backgroundColor: colors.clay,
    alignItems: 'center',
    ...shadow.cta,
  },
  useBtnText: { fontFamily: 'Inter_700Bold', fontSize: 13, color: '#fff' },
});
