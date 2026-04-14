import { Stack } from 'expo-router';
import { COLORS } from '@/lib/theme';

export default function RecipeLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: true,
          title: '',
          headerStyle: { backgroundColor: COLORS.surface },
          headerTintColor: COLORS.onSurface,
        }}
      />
      <Stack.Screen
        name="cook"
        options={{ presentation: 'fullScreenModal', headerShown: false }}
      />
    </Stack>
  );
}
