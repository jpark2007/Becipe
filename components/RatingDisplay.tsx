import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS } from '@/lib/theme';

interface Props {
  rating: number;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  tryCount?: number;
  count?: number;
}

const SIZE_MAP: Record<'sm' | 'md' | 'lg', { rating: number; suffix: number; count: number }> = {
  sm: { rating: 14, suffix: 11, count: 11 },
  md: { rating: 18, suffix: 13, count: 12 },
  lg: { rating: 28, suffix: 14, count: 12 },
};

export function RatingDisplay({ rating, size = 'md', showCount, tryCount, count }: Props) {
  const displayCount = tryCount ?? count;
  const sizes = SIZE_MAP[size];

  return (
    <View style={styles.row}>
      <Text style={[styles.ratingNumber, { fontSize: sizes.rating }]}>
        {rating.toFixed(1)}
      </Text>
      <Text style={[styles.suffix, { fontSize: sizes.suffix }]}>/10</Text>
      {showCount && displayCount !== undefined && (
        <Text style={[styles.countText, { fontSize: sizes.count }]}>
          {' '}({displayCount} {displayCount === 1 ? 'try' : 'tries'})
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  ratingNumber: {
    fontFamily: FONTS.monoMedium,
    color: COLORS.primaryContainer,
  },
  suffix: {
    fontFamily: FONTS.mono,
    color: COLORS.onSurfaceVariant,
    marginLeft: 1,
  },
  countText: {
    fontFamily: FONTS.mono,
    color: COLORS.onSurfaceVariant,
  },
});
