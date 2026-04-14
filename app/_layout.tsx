import '../global.css';
import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import {
  Newsreader_400Regular,
  Newsreader_400Regular_Italic,
  Newsreader_600SemiBold,
  Newsreader_700Bold,
} from '@expo-google-fonts/newsreader';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  DMMono_400Regular,
  DMMono_500Medium,
} from '@expo-google-fonts/dm-mono';
import { queryClient } from '@/lib/query-client';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function AuthGate() {
  const router = useRouter();
  const segments = useSegments();
  const { session, setSession, setProfile, isAuthReady, setAuthReady } = useAuthStore();
  const navigationState = useRootNavigationState();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthReady(); // Auth resolved — safe to render screens
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);

      // When auth state changes (login, token refresh, etc.), invalidate all
      // cached queries so screens refetch with the fresh token.
      queryClient.invalidateQueries();

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
    if (!isAuthReady || !navigationState?.key) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup) {
      router.replace('/(tabs)/feed');
    }
  }, [session, segments, navigationState?.key, isAuthReady]);

  return null;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Newsreader_400Regular,
    Newsreader_400Regular_Italic,
    Newsreader_600SemiBold,
    Newsreader_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    DMMono_400Regular,
    DMMono_500Medium,
  });

  const isAuthReady = useAuthStore((s) => s.isAuthReady);

  // Expo Router requires <Stack> to always be rendered (it defines the route tree).
  // We show a loading overlay on top until auth resolves, then AuthGate navigates.
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#fbf9f4' }}>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <AuthGate />
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: '#fbf9f4' },
            }}
          >
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="recipe/[id]" options={{ headerShown: false }} />
            <Stack.Screen
              name="try/[id]"
              options={{
                presentation: 'modal',
                headerShown: true,
                title: 'Log a Try',
                headerStyle: { backgroundColor: '#fbf9f4' },
                headerTintColor: '#1b1c19',
              }}
            />
            <Stack.Screen
              name="user/[id]"
              options={{
                headerShown: true,
                title: '',
                headerStyle: { backgroundColor: '#fbf9f4' },
                headerTintColor: '#1b1c19',
              }}
            />
          </Stack>
          {!isAuthReady && (
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#fbf9f4', alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator color="#b85c2a" />
            </View>
          )}
        </QueryClientProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}
