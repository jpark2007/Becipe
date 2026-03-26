import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface Props {
  value: number;
  onChange: (val: number) => void;
}

// 20 steps: 0.5, 1.0, 1.5 … 10.0
const STEPS = Array.from({ length: 20 }, (_, i) => (i + 1) * 0.5);

export function RatingSlider({ value, onChange }: Props) {
  return (
    <View style={styles.container}>
      {/* ── Label + Score ── */}
      <View style={styles.headerRow}>
        <Text style={styles.label}>RATING</Text>
        <View style={styles.scoreRow}>
          <Text style={styles.scoreNumber}>{value.toFixed(1)}</Text>
          <Text style={styles.scoreSuffix}> / 10</Text>
        </View>
      </View>

      {/* ── 20-bar track ── */}
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
    fontFamily: 'DMMono_400Regular',
    fontSize: 9,
    color: '#A09590',
    letterSpacing: 1.6,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  scoreNumber: {
    fontFamily: 'DMMono_500Medium',
    fontSize: 36,
    color: '#C4622D',
    lineHeight: 40,
  },
  scoreSuffix: {
    fontFamily: 'DMMono_400Regular',
    fontSize: 16,
    color: '#A09590',
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
  },
  bar: {
    // Each bar takes ~4.5% of width; gap: 2 handles spacing
    flex: 1,
    height: 28,
  },
  barFilled: {
    backgroundColor: '#C4622D',
  },
  barEmpty: {
    backgroundColor: '#D5CCC0',
  },
});
