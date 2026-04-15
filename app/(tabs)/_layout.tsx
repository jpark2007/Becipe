import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { colors } from '@/lib/theme';

const TAB_ORDER = ['feed', 'explore', 'add', 'circles', 'profile'] as const;
const TAB_LABELS: Record<string, string> = {
  feed: 'Home',
  explore: 'Explore',
  circles: 'Circles',
  profile: 'You',
};
const TAB_ICONS: Record<string, string> = {
  feed: '⊟',
  explore: '◎',
  circles: '◯',
  profile: '◈',
};

function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const router = useRouter();

  return (
    <View style={styles.tabBar}>
      {TAB_ORDER.map((routeName) => {
        const route = state.routes.find((r) => r.name === routeName);
        const isFocused = route ? state.index === state.routes.indexOf(route) : false;

        if (routeName === 'add') {
          return (
            <Pressable
              key="add"
              style={styles.addBtn}
              onPress={() => router.push('/(tabs)/add')}
            >
              <Text style={styles.addBtnText}>+</Text>
            </Pressable>
          );
        }

        return (
          <Pressable
            key={routeName}
            style={styles.tabItem}
            onPress={() => {
              if (route) navigation.navigate(routeName);
            }}
          >
            <Text style={[styles.tabIcon, { color: isFocused ? colors.ink : colors.muted }]}>
              {TAB_ICONS[routeName]}
            </Text>
            <Text style={[styles.tabLabel, { color: isFocused ? colors.ink : colors.muted }]}>
              {TAB_LABELS[routeName]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="feed" options={{ title: 'Home' }} />
      <Tabs.Screen name="explore" options={{ title: 'Explore' }} />
      <Tabs.Screen name="add" options={{ title: 'Add' }} />
      <Tabs.Screen name="circles" options={{ title: 'Circles' }} />
      <Tabs.Screen name="profile" options={{ title: 'You' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: colors.bone,
    paddingBottom: 22,
    paddingTop: 12,
    borderTopColor: 'transparent',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  tabIcon: {
    fontSize: 17,
    fontFamily: 'Inter_500Medium',
  },
  tabLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
  },
  addBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.clay,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -18,
    shadowColor: colors.clay,
    shadowOpacity: 0.45,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  addBtnText: {
    color: '#fff',
    fontSize: 24,
    fontFamily: 'Inter_800ExtraBold',
    lineHeight: 28,
  },
});
