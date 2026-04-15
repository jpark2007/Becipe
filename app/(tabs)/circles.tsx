import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/lib/theme';

export default function CirclesScreen() {
  return (
    <View style={styles.wrap}>
      <Text style={styles.placeholder}>circles coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bone, alignItems: 'center', justifyContent: 'center' },
  placeholder: { fontFamily: 'Inter_500Medium', color: colors.muted },
});
