import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, radius, shadow } from '@/lib/theme';
import { EditorialHeading } from '@/components/EditorialHeading';
import { supabase } from '@/lib/supabase';

export default function Welcome() {
  const router = useRouter();

  async function handleSwitchAccount() {
    await supabase.auth.signOut();
    router.replace('/(auth)/login');
  }
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.body}>
        <Text style={styles.mark}>◆ becipe</Text>
        <View style={styles.center}>
          <EditorialHeading size={42} emphasis="cook" emphasisColor="sage">
            What should we{'\n'}
          </EditorialHeading>
          <Text style={styles.sub}>
            Find recipes your friends actually love, matched to your taste.
            Three minutes to set up your palate.
          </Text>
        </View>
      </View>
      <Pressable style={styles.cta} onPress={() => router.push('/(onboarding)/palate-quiz')}>
        <Text style={styles.ctaText}>let's go →</Text>
      </Pressable>
      <Pressable style={styles.switch} onPress={handleSwitchAccount}>
        <Text style={styles.switchText}>
          already have an account? <Text style={styles.switchLink}>log in</Text>
        </Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bone, paddingHorizontal: 24 },
  body: { flex: 1, justifyContent: 'space-between' },
  mark: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 14, color: colors.ink, marginTop: 16,
  },
  center: { flex: 1, justifyContent: 'center' },
  sub: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15, lineHeight: 22, color: colors.muted,
    marginTop: 16, maxWidth: 320,
  },
  cta: {
    backgroundColor: colors.sage,
    borderRadius: radius.pill,
    paddingVertical: 17,
    alignItems: 'center',
    marginBottom: 0,
    ...shadow.cta,
  },
  ctaText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14, color: '#fff', letterSpacing: -0.1,
  },
  switch: { alignItems: 'center', paddingVertical: 16, marginBottom: 8 },
  switchText: { fontFamily: 'Inter_500Medium', fontSize: 13, color: colors.muted },
  switchLink: { color: colors.clay, fontFamily: 'Inter_700Bold' },
});
