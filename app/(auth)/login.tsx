import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { Link } from 'expo-router';
import { supabase } from '@/lib/supabase';

const INK      = '#0C0A08';
const CREAM    = '#EDE8DC';
const MUTED    = '#7A6E64';
const TERRA    = '#C4622D';
const BORDER   = '#272018';
const PH       = '#3A342C';

export default function LoginScreen() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);

  async function handleLogin() {
    if (!email || !password) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) Alert.alert('Login failed', error.message);
    setLoading(false);
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: INK }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={{ flex: 1, justifyContent: 'space-between', paddingHorizontal: 32, paddingTop: 96, paddingBottom: 52 }}>

        {/* ── Wordmark ── */}
        <View>
          <Text style={{ fontFamily: 'CormorantGaramond_600SemiBold', fontSize: 76, color: CREAM, lineHeight: 76 }}>
            Becipe
          </Text>
          <Text style={{ fontFamily: 'DMMono_400Regular', fontSize: 10, color: MUTED, letterSpacing: 4, marginTop: 10 }}>
            COOK · SHARE · DISCOVER
          </Text>
          <View style={{ height: 1, backgroundColor: BORDER, marginTop: 28, width: '35%' }} />
        </View>

        {/* ── Form ── */}
        <View>
          <View style={{ borderBottomWidth: 1, borderBottomColor: BORDER, marginBottom: 28, paddingBottom: 12 }}>
            <Text style={{ fontFamily: 'DMMono_400Regular', fontSize: 10, color: MUTED, letterSpacing: 2.5, marginBottom: 10 }}>
              EMAIL
            </Text>
            <TextInput
              style={{ fontFamily: 'Lora_400Regular', fontSize: 16, color: CREAM }}
              placeholderTextColor={PH} placeholder="your@email.com"
              value={email} onChangeText={setEmail}
              autoCapitalize="none" keyboardType="email-address" autoComplete="email"
            />
          </View>

          <View style={{ borderBottomWidth: 1, borderBottomColor: BORDER, marginBottom: 44, paddingBottom: 12 }}>
            <Text style={{ fontFamily: 'DMMono_400Regular', fontSize: 10, color: MUTED, letterSpacing: 2.5, marginBottom: 10 }}>
              PASSWORD
            </Text>
            <TextInput
              style={{ fontFamily: 'Lora_400Regular', fontSize: 16, color: CREAM }}
              placeholderTextColor={PH} placeholder="••••••••"
              value={password} onChangeText={setPassword} secureTextEntry autoComplete="password"
            />
          </View>

          <TouchableOpacity
            style={{ backgroundColor: TERRA, paddingVertical: 17, alignItems: 'center' }}
            onPress={handleLogin} disabled={loading}
          >
            {loading
              ? <ActivityIndicator color={CREAM} />
              : <Text style={{ fontFamily: 'DMMono_500Medium', fontSize: 11, color: CREAM, letterSpacing: 3.5 }}>SIGN IN</Text>
            }
          </TouchableOpacity>
        </View>

        {/* ── Footer ── */}
        <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
          <Text style={{ fontFamily: 'DMMono_400Regular', fontSize: 12, color: MUTED }}>No account? </Text>
          <Link href="/(auth)/signup">
            <Text style={{ fontFamily: 'DMMono_400Regular', fontSize: 12, color: TERRA }}>Create one →</Text>
          </Link>
        </View>

      </View>
    </KeyboardAvoidingView>
  );
}
