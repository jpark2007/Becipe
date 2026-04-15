// Placeholder kitchen tab — real contents land in a later commit.
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/lib/theme';

export default function KitchenScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.center}>
        <Text style={styles.title}>Your Kitchen</Text>
        <Text style={styles.sub}>Coming soon</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bone },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: 'Inter_800ExtraBold', fontSize: 22, color: colors.ink },
  sub: { fontFamily: 'Inter_500Medium', fontSize: 13, color: colors.muted, marginTop: 6 },
});
