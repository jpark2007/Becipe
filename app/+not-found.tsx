import { useEffect, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { colors } from '@/lib/theme';

export default function NotFoundScreen() {
  const router = useRouter();
  const pathname = usePathname();
  const isShareIntent = pathname.includes('dataUrl=') || pathname.includes('becipeShareKey');
  const [waited, setWaited] = useState(false);

  useEffect(() => {
    if (!isShareIntent) return;
    const timer = setTimeout(() => setWaited(true), 3000);
    return () => clearTimeout(timer);
  }, [isShareIntent]);

  if (isShareIntent && !waited) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color={colors.sage} size="large" />
        <Text style={styles.loadingText}>Loading shared content...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Page not found</Text>
      <Pressable style={styles.btn} onPress={() => router.replace('/(tabs)/feed')}>
        <Text style={styles.btnText}>Go home</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bone,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loadingText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: colors.muted,
    marginTop: 16,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    color: colors.ink,
    marginBottom: 16,
  },
  btn: {
    backgroundColor: colors.sage,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 999,
  },
  btnText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    color: '#fff',
  },
});
