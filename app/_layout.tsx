import '../global.css';
import { useEffect } from 'react';
import { Stack, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import {
  CormorantGaramond_400Regular,
  CormorantGaramond_600SemiBold,
} from '@expo-google-fonts/cormorant-garamond';
import {
  DMMono_400Regular,
  DMMono_500Medium,
} from '@expo-google-fonts/dm-mono';
import {
  Lora_400Regular,
} from '@expo-google-fonts/lora';
import { queryClient } from '@/lib/query-client';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';

function AuthGate() {
  const router = useRouter();
  const segments = useSegments();
  const { session, setSession, setProfile } = useAuthStore();
  const navigationState = useRootNavigationState();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session?.user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        setProfile(data);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!navigationState?.key) return; // wait until navigator is ready
    const inAuthGroup = segments[0] === '(auth)';
    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup) {
      router.replace('/(tabs)/feed');
    }
  }, [session, segments, navigationState?.key]);

  return null;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    CormorantGaramond_400Regular,
    CormorantGaramond_600SemiBold,
    DMMono_400Regular,
    DMMono_500Medium,
    Lora_400Regular,
  });

  // Fonts enhance the UI progressively — don't block render on web

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#F8F4EE' }}>
      <QueryClientProvider client={queryClient}>
        <AuthGate />
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#F8F4EE' },
          }}
        >
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="recipe/[id]"
            options={{
              headerShown: true,
              title: '',
              headerStyle: { backgroundColor: '#F8F4EE' },
              headerTintColor: '#1C1712',
            }}
          />
          <Stack.Screen
            name="recipe/[id]/cook"
            options={{ presentation: 'fullScreenModal', headerShown: false }}
          />
          <Stack.Screen
            name="try/[id]"
            options={{
              presentation: 'modal',
              headerShown: true,
              title: 'Log a Try',
              headerStyle: { backgroundColor: '#F8F4EE' },
              headerTintColor: '#1C1712',
            }}
          />
          <Stack.Screen
            name="user/[id]"
            options={{
              headerShown: true,
              title: '',
              headerStyle: { backgroundColor: '#F8F4EE' },
              headerTintColor: '#1C1712',
            }}
          />
        </Stack>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
