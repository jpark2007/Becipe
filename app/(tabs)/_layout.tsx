import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { colors } from '@/lib/theme';

function TabIcon({ char, focused }: { char: string; focused: boolean }) {
  return (
    <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 17, color: focused ? colors.ink : colors.muted }}>
      {char}
    </Text>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.bone,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 88,
          paddingBottom: 22,
          paddingTop: 12,
        },
        tabBarLabelStyle: {
          fontFamily: 'Inter_600SemiBold',
          fontSize: 10,
          letterSpacing: 0,
        },
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.muted,
      }}
    >
      <Tabs.Screen
        name="feed"
        options={{
          title: 'Discover',
          tabBarIcon: ({ focused }) => <TabIcon char="⊟" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ focused }) => <TabIcon char="◎" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="circles"
        options={{
          title: 'Circles',
          tabBarIcon: ({ focused }) => <TabIcon char="◯" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: 'Add',
          tabBarIcon: ({ focused }) => <TabIcon char="⊕" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'You',
          tabBarIcon: ({ focused }) => <TabIcon char="◈" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
