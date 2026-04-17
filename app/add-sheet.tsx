// app/add-sheet.tsx
// Modal sheet with two actions: Add a Recipe / Log a Try.
// Presented as a formSheet from the root stack (see app/_layout.tsx).
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, radius, shadow } from '@/lib/theme';

export default function AddSheetScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.head}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>What would you like to do?</Text>
        </View>
        <Pressable
          style={styles.closeBtn}
          onPress={() => router.back()}
          hitSlop={10}
        >
          <Text style={styles.closeText}>×</Text>
        </Pressable>
      </View>

      <View style={{ gap: 14, marginTop: 18 }}>
        <Pressable
          style={styles.primary}
          onPress={() => {
            router.back();
            setTimeout(() => router.push('/add-recipe' as any), 80);
          }}
        >
          <Text style={styles.primaryText}>Add a Recipe</Text>
          <Text style={styles.primarySub}>Start a new recipe — paste a link or fill it in</Text>
        </Pressable>

        <Pressable
          style={styles.secondary}
          onPress={() => {
            router.back();
            setTimeout(() => router.push('/try-picker' as any), 80);
          }}
        >
          <Text style={styles.secondaryText}>Log a Try</Text>
          <Text style={styles.secondarySub}>Rate and post a cook you just made</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bone,
    paddingHorizontal: 22,
    paddingTop: 8,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 4,
  },
  title: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 20,
    color: colors.ink,
    letterSpacing: -0.4,
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
  primary: {
    backgroundColor: colors.clay,
    borderRadius: radius.lg,
    paddingVertical: 18,
    paddingHorizontal: 22,
    minHeight: 72,
    justifyContent: 'center',
    ...shadow.cta,
  },
  primaryText: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 18,
    color: '#fff',
    letterSpacing: -0.4,
  },
  primarySub: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: '#FBE7DF',
    marginTop: 4,
  },
  secondary: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 18,
    paddingHorizontal: 22,
    minHeight: 72,
    justifyContent: 'center',
  },
  secondaryText: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 18,
    color: colors.ink,
    letterSpacing: -0.4,
  },
  secondarySub: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: colors.muted,
    marginTop: 4,
  },
});
