// components/MatchPill.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius } from '@/lib/theme';

export function MatchPill({ score }: { score: number | null }) {
  if (score == null) return null;
  return (
    <View style={styles.pill}>
      <Text style={styles.diamond}>◆</Text>
      <Text style={styles.text}>{score}% match</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: colors.sageSoft,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  diamond: { color: colors.sage, fontSize: 10 },
  text: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    color: colors.sage,
    letterSpacing: -0.1,
  },
});
