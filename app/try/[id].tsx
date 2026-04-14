import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';
import { RatingSlider } from '@/components/RatingSlider';
import { COLORS, FONTS } from '@/lib/theme';

export default function TryScreen() {
  const { id: recipeId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [rating, setRating] = useState(7.5);
  const [note, setNote] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function pickPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      aspect: [4, 3],
      allowsEditing: true,
    });
    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
    }
  }

  const mutation = useMutation({
    mutationFn: async () => {
      let photoUrl: string | null = null;

      if (photoUri) {
        setUploading(true);
        const ext = photoUri.split('.').pop() ?? 'jpg';
        const path = `tries/${user!.id}/${Date.now()}.${ext}`;
        const response = await fetch(photoUri);
        const blob = await response.blob();
        if (blob.size > 5 * 1024 * 1024) {
          throw new Error('Photo must be under 5MB');
        }
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
        const mimeType = blob.type || `image/${ext}`;
        if (!allowedTypes.includes(mimeType)) {
          throw new Error('Only JPEG, PNG, WebP, or HEIC photos are allowed');
        }
        const { error: uploadError } = await supabase.storage
          .from('recipe-photos')
          .upload(path, blob, { contentType: mimeType });
        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('recipe-photos').getPublicUrl(path);
        photoUrl = data.publicUrl;
        setUploading(false);
      }

      const { error } = await supabase.from('recipe_tries').insert({
        user_id: user!.id,
        recipe_id: recipeId,
        rating,
        note: note.trim() || null,
        photo_url: photoUrl,
        tried_at: new Date().toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipe', recipeId] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      router.back();
    },
    onError: (e: any) => Alert.alert('Error', e.message),
  });

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: COLORS.surface }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {/* Intro text */}
        <Text style={{
          fontFamily: FONTS.body,
          fontSize: 15,
          color: COLORS.onSurfaceVariant,
          lineHeight: 23,
          marginBottom: 24,
        }}>
          How did it turn out? This will appear on your friends' feeds.
        </Text>

        {/* Rating card */}
        <View style={{
          backgroundColor: COLORS.surfaceContainer,
          borderRadius: 4,
          padding: 16,
          marginBottom: 16,
        }}>
          <RatingSlider value={rating} onChange={setRating} />
        </View>

        {/* Note input */}
        <TextInput
          style={{
            fontFamily: FONTS.body,
            fontSize: 15,
            color: COLORS.onSurface,
            borderBottomWidth: 1,
            borderBottomColor: COLORS.outlineVariant,
            paddingBottom: 10,
            marginBottom: 32,
            minHeight: 80,
            lineHeight: 23,
            textAlignVertical: 'top',
          }}
          placeholder="Add a note... (optional)"
          placeholderTextColor={COLORS.outlineVariant}
          value={note}
          onChangeText={setNote}
          multiline
          numberOfLines={4}
        />

        {/* Photo picker */}
        <TouchableOpacity
          style={{
            width: '100%',
            height: 220,
            backgroundColor: COLORS.surfaceContainerLow,
            borderRadius: 4,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 24,
            overflow: 'hidden',
          }}
          onPress={pickPhoto}
        >
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          ) : (
            <View style={{ alignItems: 'center' }}>
              <Text style={{
                fontFamily: FONTS.mono,
                fontSize: 10,
                letterSpacing: 2,
                color: COLORS.onSurfaceVariant,
                textTransform: 'uppercase',
                marginTop: 8,
              }}>
                Add Photo
              </Text>
              <Text style={{
                fontFamily: FONTS.mono,
                fontSize: 10,
                color: COLORS.onSurfaceVariant,
                letterSpacing: 0.5,
                opacity: 0.6,
                marginTop: 4,
              }}>
                optional
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Submit button */}
        <TouchableOpacity
          style={{
            backgroundColor: COLORS.primary,
            paddingVertical: 16,
            alignItems: 'center',
            borderRadius: 2,
          }}
          onPress={() => mutation.mutate()}
          disabled={mutation.isPending || uploading}
        >
          {(mutation.isPending || uploading) ? (
            <ActivityIndicator color={COLORS.onPrimary} />
          ) : (
            <Text style={{
              fontFamily: FONTS.bodyBold,
              fontSize: 11,
              letterSpacing: 2,
              textTransform: 'uppercase',
              color: COLORS.onPrimary,
            }}>
              Post to Feed
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
