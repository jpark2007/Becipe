import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

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
        <View style={{ flex: 1, backgroundColor: '#F8F4EE', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Text style={{
            fontFamily: 'CormorantGaramond_600SemiBold',
            fontSize: 28,
            color: '#1C1712',
            marginBottom: 12,
          }}>
            Something went wrong
          </Text>
          <Text style={{
            fontFamily: 'Lora_400Regular',
            fontSize: 14,
            color: '#A09590',
            textAlign: 'center',
            lineHeight: 22,
            marginBottom: 24,
          }}>
            The app ran into an unexpected error. Try restarting.
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: '#C4622D',
              paddingHorizontal: 32,
              paddingVertical: 14,
            }}
            onPress={() => this.setState({ hasError: false, error: null })}
          >
            <Text style={{
              fontFamily: 'DMMono_400Regular',
              fontSize: 12,
              letterSpacing: 2,
              textTransform: 'uppercase',
              color: '#EDE8DC',
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
