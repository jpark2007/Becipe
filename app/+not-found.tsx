import { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { colors } from '@/lib/theme';

export default function NotFoundScreen() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname.includes('dataUrl=') || pathname.includes('becipeShareKey')) {
      router.replace('/(tabs)/feed');
    }
  }, [pathname]);

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
