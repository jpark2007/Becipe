import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, FONTS } from '@/lib/theme';

interface Props {
  value: number;
  onChange: (val: number) => void;
}

// 20 steps: 0.5, 1.0, 1.5 … 10.0
const STEPS = Array.from({ length: 20 }, (_, i) => (i + 1) * 0.5);

export function RatingSlider({ value, onChange }: Props) {
  return (
    <View style={styles.container}>
      {/* Label + Score */}
      <View style={styles.headerRow}>
        <Text style={styles.label}>RATING</Text>
        <View style={styles.scoreRow}>
          <Text style={styles.scoreNumber}>{value.toFixed(1)}</Text>
          <Text style={styles.scoreSuffix}> / 10</Text>
        </View>
      </View>

      {/* 20-bar track */}
      <View style={styles.barsRow}>
        {STEPS.map((step) => {
          const filled = step <= value;
          return (
            <TouchableOpacity
              key={step}
              onPress={() => onChange(step)}
              activeOpacity={0.7}
              style={[styles.bar, filled ? styles.barFilled : styles.barEmpty]}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  label: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.onSurfaceVariant,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  scoreNumber: {
    fontFamily: FONTS.headlineBold,
    fontSize: 52,
    color: COLORS.primary,
    lineHeight: 56,
  },
  scoreSuffix: {
    fontFamily: FONTS.mono,
    fontSize: 16,
    color: COLORS.onSurfaceVariant,
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
  },
  bar: {
    flex: 1,
    height: 28,
  },
  barFilled: {
    backgroundColor: COLORS.primaryContainer,
  },
  barEmpty: {
    backgroundColor: COLORS.outlineVariant,
  },
});
