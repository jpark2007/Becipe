// components/CircleCard.tsx
// Typographic circle card. Two variants: horizontal "card" for Home row,
// full-width "bar" for You > Your Circles list. Never renders a photo.
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, radius } from '@/lib/theme';
import { colorForCircleId } from '@/lib/avatar';

type CircleShape = {
  id: string;
  name: string;
  ritual: {
    name: string;
    posted: number;
    total: number;
  } | null;
};

type Props = {
  circle: CircleShape;
  variant?: 'card' | 'bar';
  onPress: () => void;
};

export function CircleCard({ circle, variant = 'card', onPress }: Props) {
  const accent = colorForCircleId(circle.id);

  if (variant === 'bar') {
    return (
      <Pressable style={[styles.bar, { borderLeftColor: accent }]} onPress={onPress}>
        <View style={{ flex: 1 }}>
          <Text style={styles.barName} numberOfLines={1}>
            {circle.name}
          </Text>
          <Text style={styles.barRitual} numberOfLines={1}>
            {circle.ritual ? circle.ritual.name : 'No active ritual'}
          </Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </Pressable>
    );
  }

  return (
    <Pressable style={[styles.card, { borderLeftColor: accent }]} onPress={onPress}>
      <Text style={styles.cardName} numberOfLines={2}>
        {circle.name}
      </Text>
      {circle.ritual ? (
        <>
          <Text style={[styles.cardRitual, { color: accent }]} numberOfLines={1}>
            {circle.ritual.name}
          </Text>
          <View style={[styles.progressPill, { backgroundColor: accent }]}>
            <Text style={styles.progressText}>
              {circle.ritual.posted}/{circle.ritual.total}
            </Text>
          </View>
        </>
      ) : (
        <Text style={styles.cardRitualMuted} numberOfLines={1}>
          No active ritual
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 160,
    height: 100,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 4,
    padding: 12,
    marginRight: 10,
    justifyContent: 'space-between',
  },
  cardName: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    color: colors.ink,
    letterSpacing: -0.3,
  },
  cardRitual: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    letterSpacing: -0.1,
  },
  cardRitualMuted: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: colors.muted,
  },
  progressPill: {
    alignSelf: 'flex-end',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  progressText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    color: '#fff',
    letterSpacing: 0.2,
  },

  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 4,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 8,
    height: 64,
  },
  barName: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    color: colors.ink,
    letterSpacing: -0.3,
  },
  barRitual: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  chevron: {
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
    color: colors.muted,
    marginLeft: 8,
  },
});
