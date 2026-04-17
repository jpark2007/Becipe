import { ScrollView, View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors, radius, shadow } from '@/lib/theme';
import { EditorialHeading } from '@/components/EditorialHeading';
import { RitualCard } from '@/components/RitualCard';
import { WoodenTable } from '@/components/WoodenTable';
import { Plate } from '@/components/Plate';
import { pollinationsUrl } from '@/lib/seed-images';
import { getStubCircle } from '@/lib/circles-stub';

const MOCK_MEMBERS = [
  { initial: 'J', name: 'julian',  twin: '92% twin',  color: colors.avJ },
  { initial: 'E', name: 'elara',   twin: '88% twin',  color: colors.avE },
  { initial: 'M', name: 'marcus',  twin: '81% match', color: colors.avM },
  { initial: 'D', name: 'you',     twin: '—',          color: colors.avD },
];

const MOCK_CANON = [
  { id: '00000000-0000-0000-0000-000000000101', title: 'Miso Salmon',        meta: 'unanimous · 4 tries', score: 8.7, seed: 101, prompt: 'charred miso salmon overhead' },
  { id: '00000000-0000-0000-0000-000000000102', title: 'Herb Roast Chicken', meta: 'consensus · 3 tries', score: 8.4, seed: 102, prompt: 'herb roast chicken overhead' },
];

export default function CircleScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const circle = id ? getStubCircle(id) : undefined;

  const title = circle?.name ?? 'The Dinner Group';
  const ritualName = circle?.ritual?.name ?? 'Sour & Bright';
  const posted = circle?.ritual?.posted ?? 3;
  const total = circle?.ritual?.total ?? 4;
  const memberCount = circle?.memberCount ?? 4;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 100 }}>

        <View style={styles.head}>
          <Pressable style={styles.iconBtn} onPress={() => router.back()}>
            <Text style={styles.iconBtnText}>←</Text>
          </Pressable>
          <Pressable style={styles.iconBtn}><Text style={styles.iconBtnText}>⋯</Text></Pressable>
        </View>

        <EditorialHeading size={30} emphasis="Group" emphasisColor="ink">
          {title + '\n'}
        </EditorialHeading>
        <Text style={styles.meta}>
          {memberCount} members · {posted}/{total} this ritual
        </Text>

        <View style={{ marginVertical: 22 }}>
          <RitualCard
            theme={ritualName.split(' ')[0] + ' &'}
            emphasis={ritualName.split(' ').slice(1).join(' ') || 'Bright'}
            prompt="Cook something that wakes your palate up. Vinegar, citrus, ferments, briny things. Post by Sunday."
          />
        </View>

        <WoodenTable
          members={MOCK_MEMBERS}
          onMemberPress={() => router.push('/user/00000000-0000-0000-0000-000000000001' as any)}
        />

        <View style={styles.sectionH}>
          <Text style={styles.sectionTitle}>Canonical</Text>
          <Text style={styles.count}>{MOCK_CANON.length} recipes</Text>
        </View>
        <View style={{ gap: 14 }}>
          {MOCK_CANON.map((c, i) => (
            <Pressable key={i} onPress={() => router.push(`/recipe/${c.id}` as any)}>
              <View style={styles.canonCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.canonTitle}>{c.title}</Text>
                  <Text style={styles.canonMeta}>{c.meta}</Text>
                  <Text style={styles.canonScore}>{c.score}</Text>
                </View>
                <View style={{ position: 'absolute', top: '50%', right: -16, marginTop: -55 }}>
                  <Plate uri={pollinationsUrl(c.prompt, c.seed)} size={110} />
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bone },
  head: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 8, paddingBottom: 14 },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.card,
    alignItems: 'center', justifyContent: 'center',
    ...shadow.cta,
  },
  iconBtnText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: colors.ink,
  },
  meta: { fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.muted, marginTop: 6, marginBottom: 4 },
  sectionH: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, marginBottom: 14 },
  sectionTitle: { fontFamily: 'Inter_700Bold', fontSize: 15, color: colors.ink, letterSpacing: -0.2 },
  count: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    color: colors.ochre,
    backgroundColor: colors.ochreSoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  canonCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    paddingVertical: 16,
    paddingLeft: 18,
    paddingRight: 120,
    minHeight: 100,
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative',
    ...shadow.card,
  },
  canonTitle: { fontFamily: 'Inter_800ExtraBold', fontSize: 17, color: colors.ink, letterSpacing: -0.4, marginBottom: 4 },
  canonMeta: { fontFamily: 'Inter_700Bold', fontSize: 11, color: colors.sage, marginBottom: 10 },
  canonScore: { fontFamily: 'Inter_800ExtraBold', fontSize: 22, color: colors.ochre, letterSpacing: -0.6 },
});
