import { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';
import { FeedCard } from '@/components/FeedCard';

async function fetchFeed(userId: string) {
  const { data, error } = await supabase
    .from('feed_items')
    .select(`
      id, verb, created_at,
      actor:profiles!actor_id(id, display_name, username, avatar_url),
      recipe:recipes!recipe_id(id, title, cover_image_url, cuisine),
      try:recipe_tries!try_id(rating, note, photo_url)
    `)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw error;
  return data ?? [];
}

export default function FeedScreen() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['feed', user?.id],
    queryFn: () => fetchFeed(user!.id),
    enabled: !!user,
  });

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('feed-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'feed_items' }, () => {
        queryClient.invalidateQueries({ queryKey: ['feed', user?.id] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F8F4EE', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#C4622D" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#F8F4EE' }}>
      <FlatList
        data={data as any[]}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <FeedCard item={item} />}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#C4622D" />}
        ListHeaderComponent={
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontFamily: 'CormorantGaramond_600SemiBold', fontSize: 38, color: '#1C1712' }}>
              Your Feed
            </Text>
            <View style={{ height: 1, backgroundColor: '#D5CCC0', marginTop: 12 }} />
          </View>
        }
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingVertical: 64 }}>
            <Text style={{ fontFamily: 'CormorantGaramond_400Regular', fontSize: 32, color: '#B5ADA8', marginBottom: 12 }}>
              Nothing yet
            </Text>
            <Text style={{ fontFamily: 'Lora_400Regular', fontSize: 14, color: '#A09590', textAlign: 'center', paddingHorizontal: 40, lineHeight: 22 }}>
              Follow friends or try a recipe to see activity here
            </Text>
          </View>
        }
      />
    </View>
  );
}
