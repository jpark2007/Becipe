import { useState } from 'react';
import {
  View, Text, TextInput, Pressable,
  KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { colors, shadow } from '@/lib/theme';
import { EditorialHeading } from '@/components/EditorialHeading';

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
      // Upsert profile in case trigger hasn't run yet or email confirm delayed it
      await (supabase.from('profiles') as any).upsert({
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
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Wordmark */}
          <View style={styles.wordmarkRow}>
            <Text style={styles.diamond}>◆</Text>
            <Text style={styles.wordmark}>becipe</Text>
          </View>

          <View style={{ height: 48 }} />

          <EditorialHeading size={36} emphasis="cooking" emphasisColor="sage">
            {'Start\n'}
          </EditorialHeading>
          <Text style={styles.subtitle}>make something worth sharing</Text>

          <TextInput
            style={styles.input}
            placeholder="username"
            placeholderTextColor={colors.muted}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="display name"
            placeholderTextColor={colors.muted}
            value={displayName}
            onChangeText={setDisplayName}
          />
          <TextInput
            style={styles.input}
            placeholder="email"
            placeholderTextColor={colors.muted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            style={styles.input}
            placeholder="password"
            placeholderTextColor={colors.muted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

          <Pressable style={styles.cta} onPress={handleSignup} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.ctaText}>create account →</Text>}
          </Pressable>

          <View style={styles.footer}>
            <Text style={styles.footerText}>have an account? </Text>
            <Link href="/(auth)/login">
              <Text style={styles.footerLink}>log in</Text>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bone },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 },
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
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 32, marginBottom: 16 },
  footerText: { fontFamily: 'Inter_500Medium', fontSize: 13, color: colors.muted },
  footerLink: { color: colors.clay, fontFamily: 'Inter_700Bold', fontSize: 13 },
});
