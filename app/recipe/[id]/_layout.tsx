import { Stack } from 'expo-router';

export default function RecipeLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: true,
          title: '',
          headerStyle: { backgroundColor: '#F8F4EE' },
          headerTintColor: '#1C1712',
        }}
      />
      <Stack.Screen
        name="cook"
        options={{ presentation: 'fullScreenModal', headerShown: false }}
      />
    </Stack>
  );
}
