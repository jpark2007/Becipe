import { useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  FlatList,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadow } from '@/lib/theme';

const SCREEN_W = Dimensions.get('window').width;

// ─── Slide illustrations ───────────────────────────────────────────────────

function IllustrationFeed() {
  return (
    <View style={il.frame}>
      {/* Wordmark bar */}
      <View style={il.topBar}>
        <View style={[il.dot, { backgroundColor: colors.sage }]} />
        <View style={[il.pill, { width: 48, backgroundColor: colors.sageSoft }]} />
        <View style={[il.circle, { backgroundColor: colors.bg }]} />
      </View>
      {/* Feed cards */}
      {[colors.claySoft, colors.ochreSoft, colors.sageSoft].map((bg, i) => (
        <View key={i} style={[il.feedCard, i === 0 && { marginTop: 10 }]}>
          <View style={[il.avatar, { backgroundColor: i === 0 ? colors.clay : i === 1 ? colors.ochre : colors.sage }]} />
          <View style={il.feedMeta}>
            <View style={[il.bar, { width: 70, backgroundColor: colors.ink, opacity: 0.18 }]} />
            <View style={[il.bar, { width: 44, backgroundColor: colors.muted, opacity: 0.25, marginTop: 5 }]} />
          </View>
          <View style={[il.heartBtn, { backgroundColor: i === 0 ? colors.claySoft : colors.bg }]}>
            <Ionicons name={i === 0 ? 'heart' : 'heart-outline'} size={12} color={i === 0 ? colors.clay : colors.muted} />
          </View>
        </View>
      ))}
      {/* Photo block */}
      <View style={[il.photoBlock, { backgroundColor: colors.claySoft }]}>
        <View style={il.photoInner}>
          <View style={[il.bar, { width: 88, backgroundColor: colors.card, opacity: 0.9, height: 10, borderRadius: 3 }]} />
          <View style={[il.bar, { width: 56, backgroundColor: colors.card, opacity: 0.55, height: 6, borderRadius: 3, marginTop: 5 }]} />
        </View>
        <View style={il.actionRow}>
          <Ionicons name="heart-outline" size={14} color={colors.muted} />
          <Ionicons name="bookmark-outline" size={14} color={colors.muted} />
        </View>
      </View>
    </View>
  );
}

function IllustrationExplore() {
  const cards = [
    { bg: colors.sageSoft, label: colors.sage, pct: '94%', title: 'Spiced\nLamb' },
    { bg: colors.claySoft, label: colors.clay, pct: '88%', title: 'Miso\nNoodles' },
    { bg: colors.ochreSoft, label: colors.ochre, pct: '81%', title: 'Brown\nButter' },
    { bg: colors.bg, label: colors.inkSoft, pct: null, title: 'Burrata\nSalad' },
  ];
  return (
    <View style={il.frame}>
      {/* Search bar */}
      <View style={il.searchBar}>
        <Ionicons name="search-outline" size={11} color={colors.muted} />
        <View style={[il.bar, { flex: 1, backgroundColor: colors.border, height: 6, borderRadius: 3 }]} />
      </View>
      {/* Mode chips */}
      <View style={il.chipRow}>
        {['Name', 'Cuisine', 'Ingredient'].map((c, i) => (
          <View key={c} style={[il.chip, i === 0 && { backgroundColor: colors.sage, borderColor: colors.sage }]}>
            <Text style={[il.chipText, i === 0 && { color: '#fff' }]}>{c}</Text>
          </View>
        ))}
      </View>
      {/* 2-col grid */}
      <View style={il.grid}>
        {cards.map((c, i) => (
          <View key={i} style={[il.gridCard, { backgroundColor: c.bg }]}>
            {c.pct && (
              <View style={[il.matchBadge, { backgroundColor: c.label }]}>
                <Text style={il.matchText}>{c.pct}</Text>
              </View>
            )}
            <Text style={[il.gridTitle, { color: c.label }]} numberOfLines={2}>{c.title}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function IllustrationKitchen() {
  const albums = [
    { bg: colors.claySoft, color: colors.clay, icon: 'heart' as const, name: 'Favorites' },
    { bg: colors.bg, color: colors.inkSoft, icon: 'create-outline' as const, name: 'Drafts' },
    { bg: colors.sageSoft, color: colors.sage, icon: 'folder-outline' as const, name: 'Summer' },
    { bg: colors.ochreSoft, color: colors.ochre, icon: 'folder-outline' as const, name: 'Quick meals' },
  ];
  return (
    <View style={il.frame}>
      {/* Header */}
      <View style={il.kitchenHeader}>
        <View>
          <View style={[il.bar, { width: 28, height: 5, backgroundColor: colors.muted, opacity: 0.3, borderRadius: 2, marginBottom: 5 }]} />
          <View style={[il.bar, { width: 80, height: 10, backgroundColor: colors.ink, opacity: 0.18, borderRadius: 3 }]} />
        </View>
        <View style={il.circle} />
      </View>
      {/* Tab pills */}
      <View style={il.tabRow}>
        {['Albums', 'All', 'Mine'].map((t, i) => (
          <View key={t} style={[il.tabPill, i === 0 && { backgroundColor: colors.sage, borderColor: colors.sage }]}>
            <Text style={[il.tabText, i === 0 && { color: '#fff' }]}>{t}</Text>
          </View>
        ))}
      </View>
      {/* Album grid */}
      <View style={il.albumGrid}>
        {albums.map((a, i) => (
          <View key={i} style={[il.albumCard, { backgroundColor: a.bg }]}>
            <Ionicons name={a.icon} size={16} color={a.color} style={{ marginBottom: 6 }} />
            <Text style={[il.albumName, { color: a.color }]} numberOfLines={1}>{a.name}</Text>
            <Text style={[il.albumCount, { color: a.color }]}>12 recipes</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function IllustrationTries() {
  const tries = [
    { rating: 9.2, color: colors.sage, bg: colors.sageSoft, title: 'Carbonara', note: 'Perfect silkiness this time.' },
    { rating: 7.5, color: colors.ochre, bg: colors.ochreSoft, title: 'Lamb Ragu', note: 'Needed more time.' },
    { rating: 8.8, color: colors.sage, bg: colors.sageSoft, title: 'Brown Butter Pasta', note: null },
  ];
  return (
    <View style={il.frame}>
      {/* Header */}
      <View style={il.kitchenHeader}>
        <View>
          <View style={[il.bar, { width: 28, height: 5, backgroundColor: colors.muted, opacity: 0.3, borderRadius: 2, marginBottom: 5 }]} />
          <View style={[il.bar, { width: 68, height: 10, backgroundColor: colors.ink, opacity: 0.18, borderRadius: 3 }]} />
        </View>
      </View>
      {/* Month label */}
      <View style={il.monthRow}>
        <Text style={il.monthText}>MAY 2026</Text>
        <View style={[il.bar, { flex: 1, height: 1, backgroundColor: colors.borderSoft }]} />
      </View>
      {/* Try rows */}
      {tries.map((t, i) => (
        <View key={i} style={il.tryRow}>
          <View style={[il.tryThumb, { backgroundColor: t.bg }]} />
          <View style={{ flex: 1, gap: 3 }}>
            <View style={[il.bar, { width: t.title.length * 6, backgroundColor: colors.ink, opacity: 0.18, height: 7, borderRadius: 2 }]} />
            {t.note && <View style={[il.bar, { width: t.note.length * 3.5, backgroundColor: colors.muted, opacity: 0.2, height: 5, borderRadius: 2, maxWidth: 110 }]} />}
          </View>
          <View style={[il.ratingChip, { backgroundColor: t.bg, borderColor: t.color + '40' }]}>
            <Text style={[il.ratingChipText, { color: t.color }]}>{t.rating}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

// ─── Shared illustration styles ────────────────────────────────────────────
const il = StyleSheet.create({
  frame: {
    width: SCREEN_W * 0.72,
    backgroundColor: colors.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    ...shadow.card,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  pill: { height: 8, borderRadius: 4 },
  circle: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border },
  bar: { height: 7, borderRadius: 3 },
  feedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
  },
  avatar: { width: 24, height: 24, borderRadius: 12 },
  feedMeta: { flex: 1 },
  heartBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  photoBlock: {
    marginTop: 10,
    borderRadius: 10,
    padding: 12,
    gap: 8,
  },
  photoInner: { gap: 4 },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 26,
    backgroundColor: colors.bg,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  chipRow: { flexDirection: 'row', gap: 5, marginBottom: 10 },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  chipText: { fontFamily: 'Inter_600SemiBold', fontSize: 8, color: colors.muted },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  gridCard: {
    width: '47%',
    aspectRatio: 0.9,
    borderRadius: 10,
    padding: 8,
    justifyContent: 'space-between',
  },
  matchBadge: {
    alignSelf: 'flex-end',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 99,
  },
  matchText: { fontFamily: 'Inter_700Bold', fontSize: 7, color: '#fff' },
  gridTitle: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: -0.2, lineHeight: 13 },
  kitchenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  tabRow: { flexDirection: 'row', gap: 5, marginBottom: 10 },
  tabPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
  },
  tabText: { fontFamily: 'Inter_600SemiBold', fontSize: 8, color: colors.muted },
  albumGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  albumCard: {
    width: '47%',
    aspectRatio: 1,
    borderRadius: 10,
    padding: 10,
    justifyContent: 'flex-end',
  },
  albumName: { fontFamily: 'Inter_700Bold', fontSize: 9, letterSpacing: -0.1 },
  albumCount: { fontFamily: 'Inter_500Medium', fontSize: 7, opacity: 0.65, marginTop: 2 },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    marginTop: 4,
  },
  monthText: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 7,
    color: colors.muted,
    letterSpacing: 1,
  },
  tryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
  },
  tryThumb: { width: 32, height: 32, borderRadius: 6 },
  ratingChip: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  ratingChipText: { fontFamily: 'Inter_800ExtraBold', fontSize: 9 },
});

// ─── Slide data ─────────────────────────────────────────────────────────────
const SLIDES = [
  {
    key: 'feed',
    eyebrow: 'SOCIAL FEED',
    heading: 'See what friends\nare cooking',
    body: 'Follow cooks and watch their activity. Like and save recipes without leaving your feed.',
    accentColor: colors.clay,
    illustration: <IllustrationFeed />,
  },
  {
    key: 'explore',
    eyebrow: 'DISCOVER',
    heading: 'Ranked for\nyour taste',
    body: 'Explore recipes sorted by how closely they match your palate. Search by name, cuisine, or ingredient.',
    accentColor: colors.sage,
    illustration: <IllustrationExplore />,
  },
  {
    key: 'kitchen',
    eyebrow: 'YOUR KITCHEN',
    heading: 'Build your\npersonal cookbook',
    body: 'Save recipes into albums. Favorites, Drafts, and any collection you want to create.',
    accentColor: colors.ochre,
    illustration: <IllustrationKitchen />,
  },
  {
    key: 'tries',
    eyebrow: 'LOG YOUR COOKS',
    heading: 'Every try\nleaves a record',
    body: 'Rate what you cook, add a photo and a note. Your tries build into an archive over time.',
    accentColor: colors.sage,
    illustration: <IllustrationTries />,
  },
];

// ─── Main screen ─────────────────────────────────────────────────────────────
export default function TutorialScreen() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList>(null);

  function goNext() {
    if (index < SLIDES.length - 1) {
      const next = index + 1;
      listRef.current?.scrollToIndex({ index: next, animated: true });
      setIndex(next);
    } else {
      router.push('/(onboarding)/palate-quiz');
    }
  }

  function skip() {
    router.push('/(onboarding)/palate-quiz');
  }

  const slide = SLIDES[index];
  const isLast = index === SLIDES.length - 1;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Skip */}
      <View style={styles.topBar}>
        <View style={{ flex: 1 }} />
        <Pressable onPress={skip} hitSlop={12}>
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      </View>

      {/* Slides */}
      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(s) => s.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            <View style={styles.illustrationWrap}>{item.illustration}</View>
          </View>
        )}
        getItemLayout={(_, i) => ({ length: SCREEN_W, offset: SCREEN_W * i, index: i })}
      />

      {/* Text content */}
      <View style={styles.textBlock}>
        <Text style={[styles.eyebrow, { color: slide.accentColor }]}>
          {slide.eyebrow}
        </Text>
        <Text style={styles.heading}>{slide.heading}</Text>
        <Text style={styles.body}>{slide.body}</Text>
      </View>

      {/* Progress dots */}
      <View style={styles.dotsRow}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === index
                ? [styles.dotActive, { backgroundColor: slide.accentColor }]
                : styles.dotInactive,
            ]}
          />
        ))}
      </View>

      {/* CTA */}
      <View style={styles.footer}>
        <Pressable
          style={[styles.btn, { backgroundColor: slide.accentColor }]}
          onPress={goNext}
        >
          <Text style={styles.btnText}>
            {isLast ? 'Set up my palate →' : 'Next'}
          </Text>
          {!isLast && (
            <Ionicons name="arrow-forward" size={16} color="#fff" style={{ marginLeft: 4 }} />
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bone,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 4,
  },
  skipText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: colors.muted,
  },
  slide: {
    width: SCREEN_W,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 12,
  },
  illustrationWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: {
    paddingHorizontal: 28,
    paddingTop: 28,
    gap: 8,
  },
  eyebrow: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    letterSpacing: 2,
  },
  heading: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 32,
    color: colors.ink,
    letterSpacing: -0.9,
    lineHeight: 37,
  },
  body: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: colors.muted,
    lineHeight: 21,
    marginTop: 2,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 28,
    marginTop: 24,
    alignItems: 'center',
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    width: 20,
  },
  dotInactive: {
    width: 6,
    backgroundColor: colors.border,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 12,
  },
  btn: {
    borderRadius: radius.pill,
    paddingVertical: 17,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  btnText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    color: '#fff',
    letterSpacing: -0.2,
  },
});
