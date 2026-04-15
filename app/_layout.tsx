import '../global.css';
import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
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
    CormorantGaramond_400Regular,
    CormorantGaramond_600SemiBold,
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
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#F8F4EE' }}>
      <ErrorBoundary>
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
            <Stack.Screen name="(onboarding)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="recipe/[id]" options={{ headerShown: false }} />
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
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#F8F4EE', alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator color="#C4622D" />
            </View>
          )}
        </QueryClientProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}
