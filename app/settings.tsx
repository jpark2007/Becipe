// app/settings.tsx
// Settings — sign out, preferences, account.
import { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';
import { colors, radius } from '@/lib/theme';

function SettingsRow({ label, onPress, chevron = true }: { label: string; onPress?: () => void; chevron?: boolean }) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <Text style={styles.rowLabel}>{label}</Text>
      {chevron && <Text style={styles.chevron}>›</Text>}
    </Pressable>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { setSession } = useAuthStore();
  const [units, setUnits] = useState<'us' | 'metric'>('us');

  async function handleSignOut() {
    await supabase.auth.signOut();
    setSession(null);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Text style={styles.back}>←</Text>
        </Pressable>
        <Text style={styles.title}>Settings</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionLabel}>PREFERENCES</Text>
        <Pressable style={styles.row} onPress={() => setUnits(prev => prev === 'us' ? 'metric' : 'us')}>
          <Text style={styles.rowLabel}>Units</Text>
          <Text style={styles.rowValue}>{units === 'us' ? 'US Customary' : 'Metric'}</Text>
        </Pressable>
        <SettingsRow label="Notifications" onPress={() => Alert.alert('Coming soon', 'Push notifications will be available in a future update.')} />

        <Text style={[styles.sectionLabel, { marginTop: 28 }]}>ACCOUNT</Text>
        <SettingsRow label="Account" onPress={() => Alert.alert('Coming soon', 'Account management will be available in a future update.')} />
        <Pressable
          style={styles.signOutBtn}
          onPress={() =>
            Alert.alert('Sign out', 'Are you sure?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Sign Out', style: 'destructive', onPress: handleSignOut },
            ])
          }
        >
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bone,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
  },
  back: {
    fontSize: 22,
    color: colors.ink,
    lineHeight: 26,
  },
  title: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 20,
    color: colors.ink,
    letterSpacing: -0.5,
  },
  content: {
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 100,
  },
  sectionLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    color: colors.muted,
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 8,
  },
  rowLabel: {
    flex: 1,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: colors.ink,
    letterSpacing: -0.2,
  },
  rowValue: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: colors.sage,
  },
  chevron: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    color: colors.muted,
    lineHeight: 22,
  },
  signOutBtn: {
    marginTop: 30,
    backgroundColor: colors.bg,
    borderRadius: radius.pill,
    paddingVertical: 15,
    alignItems: 'center',
  },
  signOutText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
    color: colors.clay,
    letterSpacing: -0.1,
  },
});
