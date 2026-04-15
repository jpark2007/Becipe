import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { colors } from '@/lib/theme';

// 'add' stays in TAB_ORDER as a sentinel for the "+" visual slot — it is
// NOT a real tab route anymore. Pressing it opens the add-sheet modal.
const TAB_ORDER = ['feed', 'explore', 'add', 'kitchen', 'profile'] as const;
const TAB_LABELS: Record<string, string> = {
  feed: 'Home',
  explore: 'Explore',
  kitchen: 'Kitchen',
  profile: 'You',
};
const TAB_ICONS: Record<string, string> = {
  feed: '⊟',
  explore: '◎',
  kitchen: '◧',
  profile: '◈',
};

function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.tabBar, { paddingBottom: insets.bottom + 6 }]}>
      {TAB_ORDER.map((routeName) => {
        const route = state.routes.find((r) => r.name === routeName);
        const isFocused = route ? state.index === state.routes.indexOf(route) : false;

        if (routeName === 'add') {
          return (
            <Pressable
              key="add"
              style={styles.addBtn}
              onPress={() => router.push('/add-sheet' as any)}
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
      <Tabs.Screen name="kitchen" options={{ title: 'Kitchen' }} />
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
