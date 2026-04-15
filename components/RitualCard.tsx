// components/RitualCard.tsx
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, radius, shadow } from '@/lib/theme';

type Props = {
  theme: string;
  emphasis?: string;
  prompt: string;
  ctaLabel?: string;
  onCta?: () => void;
};

export function RitualCard({ theme, emphasis, prompt, ctaLabel = 'log your cook →', onCta }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.pinned}>📌 PINNED · THIS WEEK'S RITUAL</Text>
      <Text style={styles.theme}>
        {theme}
        {emphasis ? <Text style={styles.emph}> {emphasis}</Text> : null}
      </Text>
      <Text style={styles.prompt}>{prompt}</Text>
      <Pressable style={styles.cta} onPress={onCta}>
        <Text style={styles.ctaText}>{ctaLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.claySoft,
    borderRadius: radius.xl,
    padding: 22,
    overflow: 'hidden',
  },
  pinned: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    color: colors.clay,
    letterSpacing: 1.0,
    marginBottom: 14,
  },
  theme: {
    fontFamily: 'Inter_500Medium',
    fontSize: 28,
    color: colors.ink,
    letterSpacing: -1.0,
    lineHeight: 30,
    marginBottom: 10,
  },
  emph: { fontFamily: 'Inter_900Black', color: colors.clay },
  prompt: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    lineHeight: 19,
    color: colors.inkSoft,
    marginBottom: 18,
  },
  cta: {
    alignSelf: 'flex-start',
    backgroundColor: colors.clay,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: radius.pill,
    ...shadow.cta,
  },
  ctaText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
    color: '#fff',
    letterSpacing: -0.1,
  },
});
