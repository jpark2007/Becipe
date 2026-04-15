import { useState } from 'react';
import {
  View, Text, TextInput, Pressable,
  KeyboardAvoidingView, Platform, ActivityIndicator, SafeAreaView, StyleSheet,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { colors, shadow } from '@/lib/theme';
import { EditorialHeading } from '@/components/EditorialHeading';

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
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.wrap}>
          {/* Wordmark */}
          <View style={styles.wordmarkRow}>
            <Text style={styles.diamond}>◆</Text>
            <Text style={styles.wordmark}>becipe</Text>
          </View>

          <View style={{ flex: 1 }} />

          {/* Heading */}
          <EditorialHeading size={36} emphasis="back" emphasisColor="sage">
            {'Welcome\n'}
          </EditorialHeading>
          <Text style={styles.subtitle}>good to see you</Text>

          {/* Form */}
          <TextInput
            style={styles.input}
            placeholder="email"
            placeholderTextColor={colors.muted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />
          <TextInput
            style={styles.input}
            placeholder="password"
            placeholderTextColor={colors.muted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
          />

          {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

          <Pressable style={styles.cta} onPress={handleLogin} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.ctaText}>log in →</Text>}
          </Pressable>

          <View style={{ flex: 1 }} />

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>no account? </Text>
            <Link href="/(auth)/signup">
              <Text style={styles.footerLink}>sign up</Text>
            </Link>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bone },
  wrap: { flex: 1, paddingHorizontal: 24 },
  wordmarkRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16, gap: 6 },
  diamond: { fontFamily: 'Inter_800ExtraBold', fontSize: 14, color: colors.sage },
  wordmark: { fontFamily: 'Inter_800ExtraBold', fontSize: 14, color: colors.ink, letterSpacing: -0.2 },
  subtitle: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: colors.muted,
    marginTop: 12,
    marginBottom: 28,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: colors.ink,
    marginBottom: 12,
  },
  errorText: {
    color: colors.clay,
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    marginTop: 4,
    marginBottom: 12,
  },
  cta: {
    backgroundColor: colors.sage,
    borderRadius: 999,
    paddingVertical: 17,
    alignItems: 'center',
    marginTop: 12,
    ...shadow.cta,
  },
  ctaText: { fontFamily: 'Inter_700Bold', fontSize: 14, color: '#fff' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 32 },
  footerText: { fontFamily: 'Inter_500Medium', fontSize: 13, color: colors.muted },
  footerLink: { color: colors.clay, fontFamily: 'Inter_700Bold', fontSize: 13 },
});
