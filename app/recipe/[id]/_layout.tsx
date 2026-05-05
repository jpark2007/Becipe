import { Stack } from 'expo-router';
import { colors } from '@/lib/theme';

export default function RecipeLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
          title: '',
          headerStyle: { backgroundColor: colors.bone },
          headerTintColor: colors.ink,
        }}
      />
      <Stack.Screen
        name="cook"
        options={{ presentation: 'fullScreenModal', headerShown: false }}
      />
    </Stack>
  );
}
