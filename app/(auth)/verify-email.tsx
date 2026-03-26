import { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';

const INK   = '#0C0A08';
const CREAM = '#EDE8DC';
const MUTED = '#7A6E64';
const TERRA = '#C4622D';
const BORDER = '#272018';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  // When Supabase redirects back after email confirmation,
  // onAuthStateChange fires and AuthGate handles navigation.
  // This manual check covers the case where the user confirms
  // in another tab/device and then returns here.
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
    <View style={{ flex: 1, backgroundColor: INK, paddingHorizontal: 32, justifyContent: 'center' }}>

      {/* Icon / symbol */}
      <Text style={{ fontFamily: 'DMMono_400Regular', fontSize: 32, color: TERRA, marginBottom: 40 }}>
        ✉
      </Text>

      {/* Heading */}
      <Text style={{ fontFamily: 'DMMono_400Regular', fontSize: 10, color: MUTED, letterSpacing: 3, marginBottom: 12 }}>
        ALMOST THERE
      </Text>
      <Text style={{ fontFamily: 'CormorantGaramond_600SemiBold', fontSize: 42, color: CREAM, lineHeight: 46, marginBottom: 16 }}>
        Check your email
      </Text>
      <View style={{ height: 1, backgroundColor: BORDER, width: '30%', marginBottom: 32 }} />

      {/* Body */}
      <Text style={{ fontFamily: 'Lora_400Regular', fontSize: 16, color: MUTED, lineHeight: 26, marginBottom: 8 }}>
        We sent a confirmation link to
      </Text>
      <Text style={{ fontFamily: 'DMMono_500Medium', fontSize: 14, color: CREAM, marginBottom: 32 }}>
        {email}
      </Text>
      <Text style={{ fontFamily: 'Lora_400Regular', fontSize: 15, color: MUTED, lineHeight: 24, marginBottom: 48 }}>
        Click the link in that email, then come back here and tap Continue.
      </Text>

      {/* Continue CTA */}
      <TouchableOpacity
        style={{ backgroundColor: TERRA, paddingVertical: 17, alignItems: 'center', marginBottom: 16 }}
        onPress={handleContinue}
        disabled={checking}
      >
        {checking
          ? <ActivityIndicator color={CREAM} />
          : <Text style={{ fontFamily: 'DMMono_500Medium', fontSize: 11, color: CREAM, letterSpacing: 3.5 }}>
              CONTINUE TO BECIPE
            </Text>
        }
      </TouchableOpacity>

      {/* Resend */}
      <TouchableOpacity
        style={{ paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: BORDER, marginBottom: 32 }}
        onPress={handleResend}
        disabled={resending}
      >
        {resending
          ? <ActivityIndicator color={MUTED} size="small" />
          : <Text style={{ fontFamily: 'DMMono_400Regular', fontSize: 11, color: resent ? TERRA : MUTED, letterSpacing: 2 }}>
              {resent ? 'EMAIL SENT' : 'RESEND EMAIL'}
            </Text>
        }
      </TouchableOpacity>

      {/* Back to login */}
      <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
        <Text style={{ fontFamily: 'DMMono_400Regular', fontSize: 12, color: MUTED, textAlign: 'center' }}>
          ← Back to sign in
        </Text>
      </TouchableOpacity>

    </View>
  );
}
