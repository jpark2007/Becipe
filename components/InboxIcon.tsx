import { View, Pressable, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';
import { colors, shadow } from '@/lib/theme';

function useUnreadCount() {
  const userId = useAuthStore((s) => s.session?.user?.id);
  return useQuery({
    queryKey: ['inbox-unread', userId],
    queryFn: async () => {
      if (!userId) return 0;
      const { count, error } = await supabase
        .from('recipe_shares')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', userId)
        .is('read_at', null);
      if (error) return 0;
      return count ?? 0;
    },
    enabled: !!userId,
    refetchInterval: 30000,
  });
}

export function InboxIcon() {
  const router = useRouter();
  const { data: unread = 0 } = useUnreadCount();

  return (
    <Pressable style={styles.btn} onPress={() => router.push('/inbox' as any)}>
      <Text style={styles.icon}>✉</Text>
      {unread > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{unread > 9 ? '9+' : unread}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.card,
  },
  icon: {
    fontSize: 16,
    color: colors.ink,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: colors.clay,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 9,
    color: '#fff',
  },
});
