import { Tabs } from 'expo-router';
import { Text } from 'react-native';

const TERRA = '#C4622D';
const MUTED = '#9A8E84';
const INK   = '#F8F4EE';

function TabIcon({ char, focused }: { char: string; focused: boolean }) {
  return (
    <Text style={{ fontFamily: 'DMMono_400Regular', fontSize: 17, color: focused ? TERRA : MUTED }}>
      {char}
    </Text>
  );
}

function TabLabel({ label, focused }: { label: string; focused: boolean }) {
  return (
    <Text style={{ fontFamily: 'DMMono_400Regular', fontSize: 9, color: focused ? TERRA : MUTED, letterSpacing: 1.5, marginTop: 2 }}>
      {label}
    </Text>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: INK,
          borderTopWidth: 1,
          borderTopColor: '#D8D0C8',
          height: 70,
          paddingBottom: 12,
          paddingTop: 8,
        },
        headerStyle: { backgroundColor: INK, borderBottomWidth: 1, borderBottomColor: '#D8D0C8' } as any,
        headerTintColor: '#1C1712',
        headerTitleStyle: { fontFamily: 'DMMono_400Regular', fontSize: 11, letterSpacing: 2.5 },
      }}
    >
      <Tabs.Screen
        name="feed"
        options={{
          title: 'FEED',
          tabBarIcon: ({ focused }) => <TabIcon char="⊟" focused={focused} />,
          tabBarLabel: ({ focused }) => <TabLabel label="FEED" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'EXPLORE',
          tabBarIcon: ({ focused }) => <TabIcon char="◎" focused={focused} />,
          tabBarLabel: ({ focused }) => <TabLabel label="EXPLORE" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: 'ADD',
          tabBarIcon: ({ focused }) => <TabIcon char="⊕" focused={focused} />,
          tabBarLabel: ({ focused }) => <TabLabel label="ADD" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'PROFILE',
          tabBarIcon: ({ focused }) => <TabIcon char="◯" focused={focused} />,
          tabBarLabel: ({ focused }) => <TabLabel label="PROFILE" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
