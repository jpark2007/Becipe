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
      <View style={{ flex: 1, backgroundColor: '#0C0A08', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#C4622D" />
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
      style={{ backgroundColor: '#0C0A08' }}
      ListHeaderComponent={
        <View>
          {/* Header section */}
          <View style={{
            backgroundColor: '#161210',
            paddingHorizontal: 24,
            paddingTop: 40,
            paddingBottom: 24,
            borderBottomWidth: 1,
            borderBottomColor: '#272018',
          }}>
            {/* Avatar row */}
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
              <View style={{
                width: 60,
                height: 60,
                backgroundColor: '#C4622D',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {profile?.avatar_url ? (
                  <Image
                    source={{ uri: profile.avatar_url }}
                    style={{ width: 60, height: 60 }}
                    resizeMode="cover"
                  />
                ) : (
                  <Text style={{
                    fontFamily: 'CormorantGaramond_600SemiBold',
                    fontSize: 28,
                    color: '#EDE8DC',
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
              >
                <Text style={{
                  fontFamily: 'DMMono_400Regular',
                  fontSize: 12,
                  letterSpacing: 1,
                  color: '#C4622D',
                }}>
                  Sign Out
                </Text>
              </TouchableOpacity>
            </View>

            {/* Name */}
            <Text style={{
              fontFamily: 'CormorantGaramond_600SemiBold',
              fontSize: 32,
              color: '#EDE8DC',
              marginBottom: 4,
            }}>
              {profile?.display_name}
            </Text>

            {/* Username */}
            <Text style={{
              fontFamily: 'DMMono_400Regular',
              fontSize: 11,
              color: '#7A6E64',
              marginBottom: profile?.bio ? 12 : 20,
            }}>
              @{profile?.username}
            </Text>

            {profile?.bio && (
              <Text style={{
                fontFamily: 'Lora_400Regular',
                fontSize: 14,
                color: '#EDE8DC',
                lineHeight: 22,
                marginBottom: 20,
              }}>
                {profile.bio}
              </Text>
            )}

            {/* Stats */}
            <View style={{ flexDirection: 'row', gap: 32 }}>
              <View>
                <Text style={{
                  fontFamily: 'DMMono_500Medium',
                  fontSize: 20,
                  color: '#EDE8DC',
                }}>
                  {recipes.length}
                </Text>
                <Text style={{
                  fontFamily: 'DMMono_400Regular',
                  fontSize: 9,
                  color: '#7A6E64',
                  letterSpacing: 1.2,
                  textTransform: 'uppercase',
                  marginTop: 2,
                }}>
                  Recipes
                </Text>
              </View>
              <View>
                <Text style={{
                  fontFamily: 'DMMono_500Medium',
                  fontSize: 20,
                  color: '#EDE8DC',
                }}>
                  {followerCount}
                </Text>
                <Text style={{
                  fontFamily: 'DMMono_400Regular',
                  fontSize: 9,
                  color: '#7A6E64',
                  letterSpacing: 1.2,
                  textTransform: 'uppercase',
                  marginTop: 2,
                }}>
                  Followers
                </Text>
              </View>
              <View>
                <Text style={{
                  fontFamily: 'DMMono_500Medium',
                  fontSize: 20,
                  color: '#EDE8DC',
                }}>
                  {followingCount}
                </Text>
                <Text style={{
                  fontFamily: 'DMMono_400Regular',
                  fontSize: 9,
                  color: '#7A6E64',
                  letterSpacing: 1.2,
                  textTransform: 'uppercase',
                  marginTop: 2,
                }}>
                  Following
                </Text>
              </View>
            </View>
          </View>

          {/* Section label */}
          <View style={{
            paddingHorizontal: 16,
            paddingTop: 24,
            paddingBottom: 12,
            borderBottomWidth: 1,
            borderBottomColor: '#272018',
          }}>
            <Text style={{
              fontFamily: 'DMMono_400Regular',
              fontSize: 10,
              color: '#7A6E64',
              letterSpacing: 2,
              textTransform: 'uppercase',
            }}>
              Recipes
            </Text>
          </View>
        </View>
      }
      ListEmptyComponent={
        <View style={{ alignItems: 'center', paddingVertical: 48, paddingHorizontal: 32 }}>
          <Text style={{
            fontFamily: 'CormorantGaramond_600SemiBold',
            fontSize: 22,
            color: '#EDE8DC',
            marginBottom: 8,
          }}>
            No recipes yet
          </Text>
          <Text style={{
            fontFamily: 'DMMono_400Regular',
            fontSize: 11,
            color: '#7A6E64',
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
