import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';

const INK      = '#F8F4EE';
const CREAM    = '#1C1712';
const MUTED    = '#A09590';
const TERRA    = '#C4622D';
const BORDER   = '#D5CCC0';
const PH       = '#B5ACA4';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
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
      style={{ flex: 1, backgroundColor: INK }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={{ flex: 1, justifyContent: 'space-between', paddingHorizontal: 32, paddingTop: 96, paddingBottom: 52 }}>

        {/* ── Wordmark ── */}
        <View>
          <Text style={{ fontFamily: 'CormorantGaramond_600SemiBold', fontSize: 76, color: CREAM, lineHeight: 76 }}>
            Dishr
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

          {errorMsg ? (
            <Text style={{ fontFamily: 'Lora_400Regular', fontSize: 13, color: '#E05C3A', marginBottom: 16, lineHeight: 20 }}>
              {errorMsg}
            </Text>
          ) : null}

          <TouchableOpacity
            style={{ backgroundColor: TERRA, paddingVertical: 17, alignItems: 'center' }}
            onPress={handleLogin} disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#EDE8DC" />
              : <Text style={{ fontFamily: 'DMMono_500Medium', fontSize: 11, color: '#EDE8DC', letterSpacing: 3.5 }}>SIGN IN</Text>
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
