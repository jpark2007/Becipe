import { View, Text, Pressable, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, radius, shadow } from '@/lib/theme';
import { EditorialHeading } from '@/components/EditorialHeading';

export default function Welcome() {
  const router = useRouter();
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
    marginBottom: 32,
    ...shadow.cta,
  },
  ctaText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14, color: '#fff', letterSpacing: -0.1,
  },
});
