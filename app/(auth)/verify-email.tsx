import { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { COLORS, FONTS } from '@/lib/theme';

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
    <View style={{ flex: 1, backgroundColor: COLORS.surface, paddingHorizontal: 32, justifyContent: 'center' }}>

      {/* Icon */}
      <Text style={{ fontFamily: FONTS.mono, fontSize: 32, color: COLORS.primary, marginBottom: 40 }}>
        ✉
      </Text>

      {/* Heading */}
      <Text style={{ fontFamily: FONTS.mono, fontSize: 10, color: COLORS.onSurfaceVariant, letterSpacing: 3, marginBottom: 12 }}>
        ALMOST THERE
      </Text>
      <Text style={{ fontFamily: FONTS.headlineBold, fontSize: 42, color: COLORS.onSurface, lineHeight: 46, marginBottom: 16 }}>
        Check your email
      </Text>
      <View style={{ height: 1, backgroundColor: COLORS.outlineVariant, width: '30%', marginBottom: 32 }} />

      {/* Body */}
      <Text style={{ fontFamily: FONTS.body, fontSize: 16, color: COLORS.onSurfaceVariant, lineHeight: 26, marginBottom: 8 }}>
        We sent a confirmation link to
      </Text>
      <Text style={{ fontFamily: FONTS.monoMedium, fontSize: 14, color: COLORS.onSurface, marginBottom: 32 }}>
        {email}
      </Text>
      <Text style={{ fontFamily: FONTS.body, fontSize: 15, color: COLORS.onSurfaceVariant, lineHeight: 24, marginBottom: 48 }}>
        Click the link in that email, then come back here and tap Continue.
      </Text>

      {/* Continue CTA */}
      <TouchableOpacity
        style={{ backgroundColor: COLORS.primary, paddingVertical: 17, alignItems: 'center', marginBottom: 16, borderRadius: 2 }}
        onPress={handleContinue}
        disabled={checking}
      >
        {checking
          ? <ActivityIndicator color={COLORS.onPrimary} />
          : <Text style={{ fontFamily: FONTS.monoMedium, fontSize: 11, color: COLORS.onPrimary, letterSpacing: 3.5 }}>
              CONTINUE TO DISHR
            </Text>
        }
      </TouchableOpacity>

      {/* Resend */}
      <TouchableOpacity
        style={{ paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: COLORS.outlineVariant, marginBottom: 32, borderRadius: 2 }}
        onPress={handleResend}
        disabled={resending}
      >
        {resending
          ? <ActivityIndicator color={COLORS.onSurfaceVariant} size="small" />
          : <Text style={{ fontFamily: FONTS.mono, fontSize: 11, color: resent ? COLORS.primary : COLORS.onSurfaceVariant, letterSpacing: 2 }}>
              {resent ? 'EMAIL SENT' : 'RESEND EMAIL'}
            </Text>
        }
      </TouchableOpacity>

      {/* Back to login */}
      <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
        <Text style={{ fontFamily: FONTS.mono, fontSize: 12, color: COLORS.onSurfaceVariant, textAlign: 'center' }}>
          ← Back to sign in
        </Text>
      </TouchableOpacity>

    </View>
  );
}
