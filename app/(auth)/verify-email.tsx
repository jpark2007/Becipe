import { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { colors } from '@/lib/theme';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) router.replace('/(tabs)/feed');
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleContinue() {
    setChecking(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      router.replace('/(tabs)/feed');
    } else {
      Alert.alert('Not verified yet', 'Please click the link in your email first, then tap Continue.');
    }
    setChecking(false);
  }

  async function handleResend() {
    if (!email) return;
    setResending(true);
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    setResending(false);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setResent(true);
      setTimeout(() => setResent(false), 5000);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bone, paddingHorizontal: 32, justifyContent: 'center' }}>

      {/* Icon */}
      <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 32, color: colors.sage, marginBottom: 40 }}>
        ✉
      </Text>

      {/* Heading */}
      <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 10, color: colors.muted, letterSpacing: 3, marginBottom: 12 }}>
        ALMOST THERE
      </Text>
      <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 36, color: colors.ink, lineHeight: 42, marginBottom: 16 }}>
        Check your email
      </Text>
      <View style={{ height: 1, backgroundColor: colors.border, width: '30%', marginBottom: 32 }} />

      {/* Body */}
      <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 16, color: colors.muted, lineHeight: 26, marginBottom: 8 }}>
        We sent a confirmation link to
      </Text>
      <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: colors.ink, marginBottom: 32 }}>
        {email}
      </Text>
      <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 15, color: colors.muted, lineHeight: 24, marginBottom: 48 }}>
        Click the link in that email, then come back here and tap Continue.
      </Text>

      {/* Continue CTA */}
      <TouchableOpacity
        style={{ backgroundColor: colors.sage, paddingVertical: 17, alignItems: 'center', marginBottom: 16, borderRadius: 999 }}
        onPress={handleContinue}
        disabled={checking}
      >
        {checking
          ? <ActivityIndicator color="#fff" />
          : <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: '#fff' }}>
              Continue to Becipe
            </Text>
        }
      </TouchableOpacity>

      {/* Resend */}
      <TouchableOpacity
        style={{ paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: colors.border, marginBottom: 32, borderRadius: 999 }}
        onPress={handleResend}
        disabled={resending}
      >
        {resending
          ? <ActivityIndicator color={colors.muted} size="small" />
          : <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: resent ? colors.sage : colors.muted }}>
              {resent ? 'Email sent' : 'Resend email'}
            </Text>
        }
      </TouchableOpacity>

      {/* Back to login */}
      <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
        <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 13, color: colors.muted, textAlign: 'center' }}>
          ← Back to sign in
        </Text>
      </TouchableOpacity>

    </View>
  );
}
