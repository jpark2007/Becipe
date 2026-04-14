import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';
import { RecipeCard } from '@/components/RecipeCard';
import { COLORS, FONTS } from '@/lib/theme';

async function fetchProfile(userId: string) {
  const [profileRes, recipesRes, followersRes, followingRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).single(),
    supabase
      .from('recipes')
      .select('*, tries:recipe_tries(rating)')
      .eq('created_by', userId)
      .order('created_at', { ascending: false }),
    supabase.from('follows').select('id:follower_id').eq('following_id', userId),
    supabase.from('follows').select('id:following_id').eq('follower_id', userId),
  ]);

  const recipes = (recipesRes.data ?? []).map((r: any) => {
    const ratings = (r.tries ?? []).map((t: any) => t.rating).filter(Boolean);
    return {
      ...r,
      avg_rating: ratings.length ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length : null,
      try_count: ratings.length,
    };
  });

  return {
    profile: profileRes.data,
    recipes,
    followerCount: followersRes.data?.length ?? 0,
    followingCount: followingRes.data?.length ?? 0,
  };
}

export default function ProfileScreen() {
  const { user, setSession } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: () => fetchProfile(user!.id),
    enabled: !!user,
  });

  async function handleSignOut() {
    await supabase.auth.signOut();
    setSession(null);
  }

  if (isLoading || !data) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={COLORS.primaryContainer} />
      </View>
    );
  }

  const { profile, recipes, followerCount, followingCount } = data;

  return (
    <FlatList
      data={recipes as any[]}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View style={{ paddingHorizontal: 16 }}>
          <RecipeCard recipe={item} />
        </View>
      )}
      style={{ backgroundColor: COLORS.surface }}
      ListHeaderComponent={
        <View>
          {/* Header section */}
          <View style={{
            backgroundColor: COLORS.surfaceContainer,
            paddingHorizontal: 24,
            paddingTop: 40,
            paddingBottom: 24,
            borderBottomWidth: 1,
            borderBottomColor: COLORS.outlineVariant + '33',
          }}>
            {/* Avatar row */}
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
              <View style={{
                width: 100,
                height: 100,
                borderRadius: 50,
                borderWidth: 3,
                borderColor: COLORS.surfaceContainerLow,
                overflow: 'hidden',
                backgroundColor: COLORS.primaryContainer,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {profile?.avatar_url ? (
                  <Image
                    source={{ uri: profile.avatar_url }}
                    style={{ width: 100, height: 100 }}
                    resizeMode="cover"
                  />
                ) : (
                  <Text style={{
                    fontFamily: FONTS.headlineBold,
                    fontSize: 40,
                    color: COLORS.onPrimary,
                  }}>
                    {profile?.display_name?.[0]?.toUpperCase()}
                  </Text>
                )}
              </View>

              <TouchableOpacity
                onPress={() => Alert.alert('Sign out', 'Are you sure?', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Sign Out', style: 'destructive', onPress: handleSignOut },
                ])}
                style={{
                  borderWidth: 1,
                  borderColor: COLORS.outlineVariant,
                  paddingVertical: 10,
                  paddingHorizontal: 20,
                  borderRadius: 2,
                }}
              >
                <Text style={{
                  fontFamily: FONTS.mono,
                  fontSize: 11,
                  letterSpacing: 1,
                  color: COLORS.onSurfaceVariant,
                  textTransform: 'uppercase',
                }}>
                  Sign Out
                </Text>
              </TouchableOpacity>
            </View>

            {/* Name */}
            <Text style={{
              fontFamily: FONTS.headlineBold,
              fontSize: 36,
              color: COLORS.onSurface,
              lineHeight: 40,
              marginBottom: 4,
            }}>
              {profile?.display_name}
            </Text>

            {/* Username */}
            <Text style={{
              fontFamily: FONTS.mono,
              fontSize: 12,
              color: COLORS.primary,
              marginTop: 4,
              marginBottom: profile?.bio ? 12 : 20,
            }}>
              @{profile?.username}
            </Text>

            {profile?.bio && (
              <Text style={{
                fontFamily: FONTS.body,
                fontSize: 14,
                color: COLORS.onSurfaceVariant,
                lineHeight: 22,
                marginTop: 8,
                marginBottom: 20,
              }}>
                {profile.bio}
              </Text>
            )}

            {/* Stats */}
            <View style={{ flexDirection: 'row', gap: 32 }}>
              {[
                { value: recipes.length, label: 'Recipes' },
                { value: followerCount, label: 'Followers' },
                { value: followingCount, label: 'Following' },
              ].map(({ value, label }) => (
                <View key={label}>
                  <Text style={{
                    fontFamily: FONTS.mono,
                    fontSize: 18,
                    color: COLORS.onSurface,
                  }}>
                    {value}
                  </Text>
                  <Text style={{
                    fontFamily: FONTS.bodyBold,
                    fontSize: 9,
                    letterSpacing: 1.5,
                    textTransform: 'uppercase',
                    color: COLORS.onSurfaceVariant,
                    marginTop: 2,
                  }}>
                    {label}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Section label */}
          <View style={{
            paddingHorizontal: 16,
            paddingTop: 24,
            paddingBottom: 12,
            borderBottomWidth: 1,
            borderBottomColor: COLORS.outlineVariant + '33',
          }}>
            <Text style={{
              fontFamily: FONTS.bodyBold,
              fontSize: 13,
              color: COLORS.onSurface,
              borderBottomWidth: 2,
              borderBottomColor: COLORS.primaryContainer,
              paddingBottom: 8,
              alignSelf: 'flex-start',
            }}>
              Recipes
            </Text>
          </View>
        </View>
      }
      ListEmptyComponent={
        <View style={{ alignItems: 'center', paddingVertical: 48, paddingHorizontal: 32 }}>
          <Text style={{
            fontFamily: FONTS.headlineBold,
            fontSize: 22,
            color: COLORS.onSurface,
            marginBottom: 8,
          }}>
            No recipes yet
          </Text>
          <Text style={{
            fontFamily: FONTS.mono,
            fontSize: 11,
            color: COLORS.onSurfaceVariant,
            textAlign: 'center',
            letterSpacing: 0.5,
            lineHeight: 18,
          }}>
            Tap the + tab to add your first recipe
          </Text>
        </View>
      }
    />
  );
}
