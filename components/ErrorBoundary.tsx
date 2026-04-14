import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { COLORS, FONTS } from '@/lib/theme';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Text style={{
            fontFamily: FONTS.headlineBold,
            fontSize: 28,
            color: COLORS.onSurface,
            marginBottom: 12,
          }}>
            Something went wrong
          </Text>
          <Text style={{
            fontFamily: FONTS.body,
            fontSize: 14,
            color: COLORS.onSurfaceVariant,
            textAlign: 'center',
            lineHeight: 22,
            marginBottom: 24,
          }}>
            The app ran into an unexpected error. Try restarting.
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: COLORS.primary,
              paddingHorizontal: 32,
              paddingVertical: 14,
              borderRadius: 2,
            }}
            onPress={() => this.setState({ hasError: false, error: null })}
          >
            <Text style={{
              fontFamily: FONTS.mono,
              fontSize: 12,
              letterSpacing: 2,
              textTransform: 'uppercase',
              color: COLORS.onPrimary,
            }}>
              Try Again
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}
