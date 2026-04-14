import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { COLORS, FONTS } from '@/lib/theme';

function Field({ label, ...props }: any) {
  return (
    <View style={{ borderBottomWidth: 1, borderBottomColor: COLORS.outlineVariant, marginBottom: 24, paddingBottom: 12 }}>
      <Text style={{ fontFamily: FONTS.mono, fontSize: 10, color: COLORS.onSurfaceVariant, letterSpacing: 2.5, marginBottom: 10 }}>
        {label}
      </Text>
      <TextInput
        style={{ fontFamily: FONTS.body, fontSize: 16, color: COLORS.onSurface }}
        placeholderTextColor={COLORS.outlineVariant}
        {...props}
      />
    </View>
  );
}

export default function SignupScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSignup() {
    if (!email || !password || !username || !displayName) {
      setErrorMsg('Please fill in all fields.'); return;
    }
    setLoading(true);
    setErrorMsg('');
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username.toLowerCase().trim(),
          display_name: displayName.trim(),
        },
      },
    });
    if (error) { setErrorMsg(error.message); setLoading(false); return; }

    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        username: username.toLowerCase().trim(),
        display_name: displayName.trim(),
      }, { onConflict: 'id' });

      if (data.session) {
        router.replace('/(tabs)/feed');
      } else {
        router.push({ pathname: '/(auth)/verify-email', params: { email } });
      }
    }
    setLoading(false);
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: COLORS.surface }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 32, paddingTop: 80, paddingBottom: 48 }}>

        {/* Header */}
        <View style={{ marginBottom: 48 }}>
          <Text style={{ fontFamily: FONTS.mono, fontSize: 10, color: COLORS.onSurfaceVariant, letterSpacing: 4, marginBottom: 8 }}>
            NEW ACCOUNT
          </Text>
          <Text style={{ fontFamily: FONTS.headlineBold, fontSize: 72, color: COLORS.onSurface, lineHeight: 72 }}>
            Dishr
          </Text>
          <View style={{ height: 1, backgroundColor: COLORS.outlineVariant, marginTop: 20, width: '25%' }} />
        </View>

        <Field label="YOUR NAME" placeholder="Julia Child" value={displayName} onChangeText={setDisplayName} />
        <Field label="USERNAME" placeholder="@juliachild" value={username} onChangeText={setUsername} autoCapitalize="none" />
        <Field label="EMAIL" placeholder="your@email.com" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        <Field label="PASSWORD" placeholder="••••••••" value={password} onChangeText={setPassword} secureTextEntry />

        {errorMsg ? (
          <Text style={{ fontFamily: FONTS.body, fontSize: 13, color: COLORS.error, marginBottom: 16, lineHeight: 20 }}>
            {errorMsg}
          </Text>
        ) : null}

        <TouchableOpacity
          style={{ backgroundColor: COLORS.primary, paddingVertical: 17, alignItems: 'center', marginTop: 20, borderRadius: 2 }}
          onPress={handleSignup}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color={COLORS.onPrimary} />
            : <Text style={{ fontFamily: FONTS.monoMedium, fontSize: 11, color: COLORS.onPrimary, letterSpacing: 3.5 }}>CREATE ACCOUNT</Text>
          }
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 32 }}>
          <Text style={{ fontFamily: FONTS.mono, fontSize: 12, color: COLORS.onSurfaceVariant }}>Have an account? </Text>
          <Link href="/(auth)/login">
            <Text style={{ fontFamily: FONTS.mono, fontSize: 12, color: COLORS.primary }}>Sign in →</Text>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
