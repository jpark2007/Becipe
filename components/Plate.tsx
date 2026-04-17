// components/Plate.tsx
import React, { useState } from 'react';
import { Image, ImageStyle, View, Text, ViewStyle, StyleSheet } from 'react-native';
import { colors, shadow } from '@/lib/theme';

type Props = {
  uri?: string | null;
  size?: number;          // diameter in px (default 120)
  style?: ViewStyle;
  shape?: 'circle' | 'square';  // default circle
};

/**
 * Floating circular plate photo. Uses the two-View pattern so Android
 * gets both the drop shadow (outer View, no overflow) AND the rounded
 * clipping (inner View, overflow hidden). RN Android won't render a
 * shadow on a View with overflow:hidden — that's why this is split.
 */
export function Plate({ uri, size = 120, style, shape = 'circle' }: Props) {
  const [errored, setErrored] = useState(false);
  const dim = { width: size, height: size };
  const radius = shape === 'circle' ? size / 2 : 18;
  const showImage = uri && !errored;
  return (
    <View style={[dim, shadow.plate, style]}>
      <View style={[dim, { borderRadius: radius, overflow: 'hidden', backgroundColor: colors.card }]}>
        {showImage ? (
          <Image
            source={{ uri }}
            style={[dim] as ImageStyle}
            resizeMode="cover"
            onError={() => setErrored(true)}
          />
        ) : (
          <View style={[styles.fallback, dim]}>
            <Text style={styles.fallbackGlyph}>◆</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackGlyph: {
    color: colors.muted,
    fontSize: 22,
    opacity: 0.6,
  },
});
