import '../global.css';
import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import * as Linking from 'expo-linking';
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
import {
  Lora_400Regular,
} from '@expo-google-fonts/lora';
import {
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  Inter_900Black,
} from '@expo-google-fonts/inter';
import { queryClient } from '@/lib/query-client';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function AuthGate() {
  const router = useRouter();
  const segments = useSegments();
  const { session, setSession, setProfile, isAuthReady, setAuthReady, profile } = useAuthStore();
  const navigationState = useRootNavigationState();

  useEffect(() => {
    function handleDeepLink(url: string) {
      // Supabase sends access_token + refresh_token in the URL hash on implicit flow
      const hash = url.split('#')[1];
      if (!hash) return;
      const params = new URLSearchParams(hash);
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      if (accessToken && refreshToken) {
        supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
      }
    }

    Linking.getInitialURL().then((url) => { if (url) handleDeepLink(url); });
    const linkSub = Linking.addEventListener('url', ({ url }) => handleDeepLink(url));

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        setProfile(data);
      }
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

    return () => {
      subscription.unsubscribe();
      linkSub.remove();
    };
  }, []);

  const hasPalate = profile?.palate_vector != null;

  useEffect(() => {
    if (!isAuthReady || !navigationState?.key) return;
    const inAuthGroup = segments[0] === '(auth)';
    const inOnboarding = segments[0] === '(onboarding)';
    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (session && !hasPalate && !inOnboarding) {
      router.replace('/(onboarding)/welcome');
    } else if (session && hasPalate && (inAuthGroup || inOnboarding)) {
      router.replace('/(tabs)/feed');
    }
  }, [session, segments, navigationState?.key, isAuthReady, hasPalate]);

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
    Lora_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    Inter_900Black,
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
            <Stack.Screen name="(onboarding)" />
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
            <Stack.Screen name="circle/[id]" options={{ headerShown: false }} />
            <Stack.Screen
              name="add-sheet"
              options={{ presentation: 'formSheet', headerShown: false }}
            />
            <Stack.Screen name="add-recipe" options={{ headerShown: false }} />
            <Stack.Screen name="try-picker" options={{ headerShown: false }} />
            <Stack.Screen name="fridge" options={{ headerShown: false }} />
            <Stack.Screen
              name="palate-editor"
              options={{ presentation: 'modal', headerShown: false }}
            />
            <Stack.Screen name="friends" options={{ headerShown: false }} />
            <Stack.Screen
              name="people-search"
              options={{ presentation: 'formSheet', headerShown: false }}
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
