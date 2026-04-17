import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Plate } from '@/components/Plate';
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

export function FeedCard({ item }: { item: FeedItem }) {
  const router = useRouter();
  const userPalate = useAuthStore(s => s.profile?.palate_vector ?? null);
  if (!item.recipe || !item.actor) return null;

  const actorName = item.actor.display_name || item.actor.username;
  const avInitials = initialsFor(actorName);
  const avColor = colorForUserId(item.actor.id);
  const score = matchScore(parsePalate(userPalate), parsePalate(item.recipe.palate_vector));
  const time = formatRelative(item.created_at);
  const actorId = item.actor.id;

  return (
    <Pressable
      style={styles.row}
      onPress={() => router.push(`/recipe/${item.recipe!.id}`)}
    >
      <Pressable
        style={[styles.av, { backgroundColor: avColor }]}
        onPress={() => router.push(`/user/${actorId}` as any)}
      >
        <Text style={styles.avText}>{avInitials}</Text>
      </Pressable>
      <View style={styles.card}>
        <Pressable
          onPress={(e) => {
            e.stopPropagation?.();
            router.push(`/user/${actorId}` as any);
          }}
        >
          <Text style={styles.byline} numberOfLines={1}>
            {(actorName || 'someone').toLowerCase()} · {item.verb} · {time}
          </Text>
        </Pressable>
        <Text style={styles.title} numberOfLines={2}>{item.recipe.title}</Text>
        <View style={styles.tagsRow}>
          {score != null && <MatchPill score={score} />}
        </View>
        <View style={styles.plateWrap}>
          <Plate uri={item.recipe.cover_image_url} size={108} />
        </View>
      </View>
    </Pressable>
  );
}

function formatRelative(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const h = Math.floor(ms / 3600000);
  if (h < 1) return 'just now';
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12, marginBottom: 24, alignItems: 'flex-start' },
  av: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 3, shadowOffset: { width: 0, height: 1 },
  },
  avText: { fontFamily: 'Inter_700Bold', fontSize: 13, color: '#F5E9D3' },
  card: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    paddingVertical: 16,
    paddingLeft: 18,
    paddingRight: 100,
    minHeight: 130,
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative',
    ...shadow.card,
  },
  byline: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11, color: colors.muted, marginBottom: 6,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 17, color: colors.ink, lineHeight: 20,
    letterSpacing: -0.5, marginBottom: 10,
  },
  tagsRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  plateWrap: {
    position: 'absolute',
    top: -18, right: -14,
  },
});
