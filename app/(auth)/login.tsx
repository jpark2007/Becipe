import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { COLORS, FONTS } from '@/lib/theme';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  async function handleLogin() {
    if (!email || !password) return;
    setLoading(true);
    setErrorMsg('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setErrorMsg(error.message);
    } else {
      router.replace('/(tabs)/feed');
    }
    setLoading(false);
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: COLORS.surface }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={{ flex: 1, justifyContent: 'space-between', paddingHorizontal: 32, paddingTop: 96, paddingBottom: 52 }}>

        {/* Wordmark */}
        <View>
          <Text style={{ fontFamily: FONTS.headlineBold, fontSize: 72, color: COLORS.onSurface, lineHeight: 72 }}>
            Dishr
          </Text>
          <Text style={{ fontFamily: FONTS.mono, fontSize: 10, color: COLORS.onSurfaceVariant, letterSpacing: 4, marginTop: 10 }}>
            COOK · SHARE · DISCOVER
          </Text>
          <View style={{ height: 1, backgroundColor: COLORS.outlineVariant, marginTop: 28, width: '35%' }} />
        </View>

        {/* Form */}
        <View>
          <View style={{ borderBottomWidth: 1, borderBottomColor: COLORS.outlineVariant, marginBottom: 28, paddingBottom: 12 }}>
            <Text style={{ fontFamily: FONTS.mono, fontSize: 10, color: COLORS.onSurfaceVariant, letterSpacing: 2.5, marginBottom: 10 }}>
              EMAIL
            </Text>
            <TextInput
              style={{ fontFamily: FONTS.body, fontSize: 16, color: COLORS.onSurface }}
              placeholderTextColor={COLORS.outlineVariant}
              placeholder="your@email.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
          </View>

          <View style={{ borderBottomWidth: 1, borderBottomColor: COLORS.outlineVariant, marginBottom: 44, paddingBottom: 12 }}>
            <Text style={{ fontFamily: FONTS.mono, fontSize: 10, color: COLORS.onSurfaceVariant, letterSpacing: 2.5, marginBottom: 10 }}>
              PASSWORD
            </Text>
            <TextInput
              style={{ fontFamily: FONTS.body, fontSize: 16, color: COLORS.onSurface }}
              placeholderTextColor={COLORS.outlineVariant}
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
            />
          </View>

          {errorMsg ? (
            <Text style={{ fontFamily: FONTS.body, fontSize: 13, color: COLORS.error, marginBottom: 16, lineHeight: 20 }}>
              {errorMsg}
            </Text>
          ) : null}

          <TouchableOpacity
            style={{ backgroundColor: COLORS.primary, paddingVertical: 17, alignItems: 'center', borderRadius: 2 }}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color={COLORS.onPrimary} />
              : <Text style={{ fontFamily: FONTS.monoMedium, fontSize: 11, color: COLORS.onPrimary, letterSpacing: 3.5 }}>SIGN IN</Text>
            }
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
          <Text style={{ fontFamily: FONTS.mono, fontSize: 12, color: COLORS.onSurfaceVariant }}>No account? </Text>
          <Link href="/(auth)/signup">
            <Text style={{ fontFamily: FONTS.mono, fontSize: 12, color: COLORS.primary }}>Create one →</Text>
          </Link>
        </View>

      </View>
    </KeyboardAvoidingView>
  );
}
