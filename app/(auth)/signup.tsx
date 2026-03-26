import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { Link } from 'expo-router';
import { supabase } from '@/lib/supabase';

const INK = '#F8F4EE'; const CREAM = '#1C1712'; const MUTED = '#A09590';
const TERRA = '#C4622D'; const BORDER = '#D5CCC0'; const PH = '#B5ACA4';

function Field({ label, ...props }: any) {
  return (
    <View style={{ borderBottomWidth: 1, borderBottomColor: BORDER, marginBottom: 24, paddingBottom: 12 }}>
      <Text style={{ fontFamily: 'DMMono_400Regular', fontSize: 10, color: MUTED, letterSpacing: 2.5, marginBottom: 10 }}>
        {label}
      </Text>
      <TextInput
        style={{ fontFamily: 'Lora_400Regular', fontSize: 16, color: CREAM }}
        placeholderTextColor={PH}
        {...props}
      />
    </View>
  );
}

export default function SignupScreen() {
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [username, setUsername]       = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading]         = useState(false);

  async function handleSignup() {
    if (!email || !password || !username || !displayName) {
      Alert.alert('Missing fields', 'Please fill in all fields.'); return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) { Alert.alert('Signup failed', error.message); setLoading(false); return; }
    if (data.user) {
      const { error: pe } = await supabase.from('profiles').insert({
        id: data.user.id,
        username: username.toLowerCase().trim(),
        display_name: displayName.trim(),
      });
      if (pe) Alert.alert('Profile error', pe.message);
    }
    setLoading(false);
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: INK }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 32, paddingTop: 80, paddingBottom: 48 }}>

        {/* Header */}
        <View style={{ marginBottom: 48 }}>
          <Text style={{ fontFamily: 'CormorantGaramond_400Regular', fontSize: 13, color: MUTED, letterSpacing: 2, marginBottom: 8 }}>
            NEW ACCOUNT
          </Text>
          <Text style={{ fontFamily: 'CormorantGaramond_600SemiBold', fontSize: 48, color: CREAM, lineHeight: 48 }}>
            Join Becipe
          </Text>
          <View style={{ height: 1, backgroundColor: BORDER, marginTop: 20, width: '25%' }} />
        </View>

        <Field label="YOUR NAME" placeholder="Julia Child" value={displayName} onChangeText={setDisplayName} />
        <Field label="USERNAME"  placeholder="@juliachild" value={username}     onChangeText={setUsername} autoCapitalize="none" />
        <Field label="EMAIL"     placeholder="your@email.com" value={email}     onChangeText={setEmail}    autoCapitalize="none" keyboardType="email-address" />
        <Field label="PASSWORD"  placeholder="••••••••"       value={password}  onChangeText={setPassword} secureTextEntry />

        <TouchableOpacity
          style={{ backgroundColor: TERRA, paddingVertical: 17, alignItems: 'center', marginTop: 20 }}
          onPress={handleSignup} disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#EDE8DC" />
            : <Text style={{ fontFamily: 'DMMono_500Medium', fontSize: 11, color: '#EDE8DC', letterSpacing: 3.5 }}>CREATE ACCOUNT</Text>
          }
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 32 }}>
          <Text style={{ fontFamily: 'DMMono_400Regular', fontSize: 12, color: MUTED }}>Have an account? </Text>
          <Link href="/(auth)/login">
            <Text style={{ fontFamily: 'DMMono_400Regular', fontSize: 12, color: TERRA }}>Sign in →</Text>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
