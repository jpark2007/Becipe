import React from 'react';
import { View, Text, Pressable, Image, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { MatchPill } from '@/components/MatchPill';
import { colors, radius, shadow } from '@/lib/theme';
import { matchScore, parsePalate } from '@/lib/palate';
import { useAuthStore } from '@/store/auth';
import { initialsFor, colorForUserId } from '@/lib/avatar';

type FeedItem = {
  id: string;
  verb: string;
  created_at: string;
  actor: {
    id: string;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
  recipe: {
    id: string;
    title: string;
    cover_image_url: string | null;
    palate_vector: any;
  } | null;
};

const NO_PHOTO_PALETTES = [
  { bg: ['#EDF1E6', '#dce6d3'], label: colors.sage },
  { bg: ['#FBE7DF', '#f5d0c3'], label: colors.clay },
  { bg: ['#F8EED5', '#f0dfa8'], label: colors.ochre },
];

function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h);
  return Math.abs(h);
}

export function FeedCard({ item }: { item: FeedItem }) {
  const router = useRouter();
  const userPalate = useAuthStore(s => s.profile?.palate_vector ?? null);
  if (!item.recipe || !item.actor) return null;

  const actorName = item.actor.display_name || item.actor.username;
  const avInitials = initialsFor(actorName);
  const avColor = colorForUserId(item.actor.id);
  const score = matchScore(parsePalate(userPalate), parsePalate(item.recipe.palate_vector));
  const time = formatRelative(item.created_at);
  const hasPhoto = !!item.recipe.cover_image_url;
  const palette = NO_PHOTO_PALETTES[hashId(item.recipe.id) % NO_PHOTO_PALETTES.length];

  return (
    <Pressable
      style={styles.card}
      onPress={() => router.push(`/recipe/${item.recipe!.id}`)}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={[styles.av, { backgroundColor: avColor }]}
          onPress={() => router.push(`/user/${item.actor!.id}` as any)}
        >
          <Text style={styles.avText}>{avInitials}</Text>
        </Pressable>
        <Pressable
          style={styles.headerMeta}
          onPress={() => router.push(`/user/${item.actor!.id}` as any)}
        >
          <Text style={styles.username} numberOfLines={1}>
            {(actorName || 'someone').toLowerCase()}
          </Text>
          <Text style={styles.metaLine}>{item.verb} · {time}</Text>
        </Pressable>
      </View>

      {/* Photo */}
      {hasPhoto ? (
        <Image
          source={{ uri: item.recipe.cover_image_url! }}
          style={styles.photo}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.photo, styles.photoPlaceholder, {
          backgroundColor: palette.bg[0],
        }]}>
          <Text style={styles.placeholderTitle} numberOfLines={3}>
            {item.recipe.title}
          </Text>
          <Text style={[styles.placeholderLabel, { color: palette.label }]}>
            no photo yet
          </Text>
        </View>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        {hasPhoto && (
          <Text style={styles.title} numberOfLines={2}>{item.recipe.title}</Text>
        )}
        {score != null && <MatchPill score={score} />}
      </View>
    </Pressable>
  );
}

function formatRelative(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const h = Math.floor(ms / 3600000);
  if (h < 1) return 'just now';
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 18,
    overflow: 'hidden',
    ...shadow.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  av: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  avText: { fontFamily: 'Inter_800ExtraBold', fontSize: 11, color: '#F5E9D3' },
  headerMeta: { flex: 1, minWidth: 0 },
  username: {
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
    color: colors.ink,
    letterSpacing: -0.2,
  },
  metaLine: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: colors.muted,
    marginTop: 1,
  },
  photo: {
    width: '100%',
    aspectRatio: 1,
  },
  photoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 32,
  },
  placeholderTitle: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 28,
    color: colors.ink,
    textAlign: 'center',
    letterSpacing: -0.8,
    lineHeight: 32,
    opacity: 0.55,
  },
  placeholderLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  footer: {
    paddingHorizontal: 14,
    paddingTop: 11,
    paddingBottom: 14,
    gap: 7,
  },
  title: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 16,
    color: colors.ink,
    letterSpacing: -0.4,
    lineHeight: 20,
  },
});
