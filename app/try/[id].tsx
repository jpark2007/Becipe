import { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  Pressable,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';
import { RatingSlider } from '@/components/RatingSlider';
import { Plate } from '@/components/Plate';
import { EditorialHeading } from '@/components/EditorialHeading';
import { colors, shadow } from '@/lib/theme';

const TAG_OPTIONS = ['make again', 'crushed it', 'tweaked', 'weeknight'];

export default function TryScreen() {
  const { id: recipeId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [rating, setRating] = useState(7.5);
  const [note, setNote] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [activeTags, setActiveTags] = useState<string[]>([]);

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

  function toggleTag(tag: string) {
    setActiveTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
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
        // Validate file size (max 5MB)
        if (blob.size > 5 * 1024 * 1024) {
          throw new Error('Photo must be under 5MB');
        }
        // Validate file type
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

      const { error } = await (supabase.from('recipe_tries') as any).insert({
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
    onError: (e: any) => {
      setUploading(false);
      Alert.alert('Error', e.message);
    },
  });

  const submitting = mutation.isPending || uploading;

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 60 }}>
          <View style={styles.head}>
            <Pressable
              style={styles.iconBtn}
              onPress={() => router.back()}
              hitSlop={8}
            >
              <Text style={styles.iconText}>✕</Text>
            </Pressable>
            <Text style={styles.titleSm}>log a try</Text>
            <Pressable
              onPress={() => mutation.mutate()}
              disabled={submitting}
              hitSlop={8}
            >
              {submitting ? (
                <ActivityIndicator color={colors.clay} />
              ) : (
                <Text style={styles.postBtn}>post</Text>
              )}
            </Pressable>
          </View>

          <EditorialHeading size={32} emphasis="go?" emphasisColor="clay">
            {"How'd it"}
          </EditorialHeading>
          <Text style={styles.sub}>tell the group how it turned out</Text>

          {/* PHOTO CARD */}
          <View style={styles.photoCard}>
            <Text style={styles.cap}>YOUR PHOTO</Text>
            <Text style={styles.capBig}>
              {photoUri ? 'looks great' : 'add one'}
            </Text>
            <Pressable style={styles.changeBtn} onPress={pickPhoto}>
              <Text style={styles.changeBtnText}>
                {photoUri ? '📷 change' : '📷 add photo'}
              </Text>
            </Pressable>
            <View style={styles.plateFloat}>
              <Plate uri={photoUri} size={170} />
            </View>
          </View>

          {/* RATING CARD */}
          <View style={styles.ratingCard}>
            <View style={styles.ratingRow}>
              <Text style={styles.ratingLabel}>YOUR RATING</Text>
              <Text style={styles.bigNum}>{rating.toFixed(1)}</Text>
            </View>
            <RatingSlider value={rating} onChange={setRating} />
          </View>

          {/* TAG CHIPS */}
          <View style={styles.tags}>
            {TAG_OPTIONS.map((t) => {
              const active = activeTags.includes(t);
              return (
                <Pressable
                  key={t}
                  onPress={() => toggleTag(t)}
                  style={[styles.ttag, active && styles.ttagOn]}
                >
                  <Text style={[styles.ttagText, active && styles.ttagTextOn]}>{t}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* NOTES CARD */}
          <View style={styles.notesCard}>
            <Text style={styles.notesLabel}>NOTES</Text>
            <TextInput
              multiline
              style={styles.notesInput}
              placeholder="how did it actually go?"
              placeholderTextColor={colors.muted}
              value={note}
              onChangeText={setNote}
            />
          </View>

          <Pressable
            style={[styles.shareBtn, submitting && { opacity: 0.6 }]}
            onPress={() => mutation.mutate()}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.shareBtnText}>share with dinner group →</Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bone },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 14,
    paddingBottom: 18,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.cta,
  },
  iconText: { fontFamily: 'Inter_700Bold', fontSize: 14, color: colors.ink },
  titleSm: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: colors.ink },
  postBtn: { fontFamily: 'Inter_700Bold', fontSize: 13, color: colors.clay },
  sub: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: colors.muted,
    marginTop: 6,
    marginBottom: 22,
  },
  photoCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 22,
    padding: 20,
    paddingRight: 160,
    marginBottom: 16,
    minHeight: 170,
    justifyContent: 'flex-end',
    position: 'relative',
  },
  cap: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    color: colors.muted,
    letterSpacing: 1.0,
    marginBottom: 4,
  },
  capBig: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: colors.ink,
    letterSpacing: -0.4,
    marginBottom: 10,
  },
  changeBtn: {
    alignSelf: 'flex-start',
    backgroundColor: colors.ink,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  changeBtnText: { fontFamily: 'Inter_700Bold', fontSize: 11, color: '#fff' },
  plateFloat: { position: 'absolute', top: '50%', right: -26, marginTop: -85 },
  ratingCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
  },
  ratingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 14,
  },
  ratingLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    color: colors.muted,
    letterSpacing: 1.2,
  },
  bigNum: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 38,
    color: colors.ochre,
    letterSpacing: -1.5,
  },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  ttag: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: '#F1F1EC',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  ttagOn: { backgroundColor: colors.sageSoft, borderColor: '#D6DECB' },
  ttagText: { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: colors.inkSoft },
  ttagTextOn: { color: colors.sageDeep },
  notesCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: 16,
    marginBottom: 18,
  },
  notesLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    color: colors.muted,
    letterSpacing: 1.0,
    marginBottom: 6,
  },
  notesInput: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: colors.inkSoft,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  shareBtn: {
    backgroundColor: colors.clay,
    borderRadius: 999,
    paddingVertical: 17,
    alignItems: 'center',
    ...shadow.cta,
  },
  shareBtnText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    color: '#fff',
    letterSpacing: -0.1,
  },
});
