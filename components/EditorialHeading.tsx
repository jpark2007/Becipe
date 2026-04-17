// components/EditorialHeading.tsx
import React from 'react';
import { Text, TextStyle, StyleSheet } from 'react-native';
import { colors, type } from '@/lib/theme';

type Props = {
  /** Plain text. Wrap the emphasized word in {emph: 'word'} markers below. */
  children: React.ReactNode;
  /** Optional emphasis word — gets weight 900 and optional accent color */
  emphasis?: string;
  emphasisColor?: 'sage' | 'clay' | 'ochre' | 'ink';
  size?: number;           // default 32
  style?: TextStyle;
};

const ACCENT = {
  sage:  colors.sage,
  clay:  colors.clay,
  ochre: colors.ochre,
  ink:   colors.ink,
};

export function EditorialHeading({
  children, emphasis, emphasisColor = 'sage', size = 32, style,
}: Props) {
  return (
    <Text style={[styles.base, { fontSize: size, lineHeight: size * 1.05 }, style]}>
      {children}
      {emphasis ? (
        <>
          {' '}
          <Text style={[styles.emph, { color: ACCENT[emphasisColor] }]}>{emphasis}</Text>
        </>
      ) : null}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    fontFamily: 'Inter_500Medium',
    color: colors.ink,
    letterSpacing: -1.4,
  },
  emph: {
    fontFamily: 'Inter_900Black',
  },
});
