import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { colors } from '@/lib/theme';

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
        <View style={{ flex: 1, backgroundColor: colors.bone, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Text style={{
            fontFamily: 'Inter_700Bold',
            fontSize: 22,
            color: colors.ink,
            marginBottom: 12,
          }}>
            Something went wrong
          </Text>
          <Text style={{
            fontFamily: 'Inter_500Medium',
            fontSize: 14,
            color: colors.muted,
            textAlign: 'center',
            lineHeight: 22,
            marginBottom: 24,
          }}>
            The app ran into an unexpected error. Try restarting.
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: colors.sage,
              paddingHorizontal: 32,
              paddingVertical: 14,
              borderRadius: 999,
            }}
            onPress={() => this.setState({ hasError: false, error: null })}
          >
            <Text style={{
              fontFamily: 'Inter_600SemiBold',
              fontSize: 13,
              color: '#fff',
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
