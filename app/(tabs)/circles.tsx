import { ScrollView, View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, shadow } from '@/lib/theme';
import { EditorialHeading } from '@/components/EditorialHeading';
import { RitualCard } from '@/components/RitualCard';
import { MemberRing } from '@/components/MemberRing';
import { Plate } from '@/components/Plate';
import { pollinationsUrl } from '@/lib/seed-images';

const MOCK_MEMBERS = [
  { initial: 'J', name: 'julian',  twin: '92% twin',  color: colors.avJ },
  { initial: 'E', name: 'elara',   twin: '88% twin',  color: colors.avE },
  { initial: 'M', name: 'marcus',  twin: '81% match', color: colors.avM },
  { initial: 'D', name: 'you',     twin: '—',          color: colors.avD },
];

const MOCK_CANON = [
  { title: 'Miso Salmon',        meta: 'unanimous · 4 tries', score: 8.7, seed: 101, prompt: 'charred miso salmon overhead' },
  { title: 'Herb Roast Chicken', meta: 'consensus · 3 tries', score: 8.4, seed: 102, prompt: 'herb roast chicken overhead' },
];

export default function CirclesScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 60 }}>
        <View style={styles.demoBanner}>
          <Text style={styles.demoBannerText}>demo · circles backend coming next</Text>
        </View>

        <View style={styles.head}>
          <Pressable style={styles.iconBtn}><Text style={styles.iconBtnText}>←</Text></Pressable>
          <Pressable style={styles.iconBtn}><Text style={styles.iconBtnText}>⋯</Text></Pressable>
        </View>

        <EditorialHeading size={30} emphasis="Group" emphasisColor="ink">
          {'The Dinner\n'}
        </EditorialHeading>
        <Text style={styles.meta}>4 members · 12 canonical · 87% palate overlap</Text>

        <View style={{ marginVertical: 22 }}>
          <RitualCard
            theme="Sour &"
            emphasis="Bright"
            prompt="Cook something that wakes your palate up. Vinegar, citrus, ferments, briny things. Post by Sunday."
          />
        </View>

        <MemberRing members={MOCK_MEMBERS} />

        <View style={styles.sectionH}>
          <Text style={styles.sectionTitle}>Canonical</Text>
          <Text style={styles.count}>12 recipes</Text>
        </View>
        <View style={{ gap: 14 }}>
          {MOCK_CANON.map((c, i) => (
            <View key={i} style={styles.canonCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.canonTitle}>{c.title}</Text>
                <Text style={styles.canonMeta}>{c.meta}</Text>
                <Text style={styles.canonScore}>{c.score}</Text>
              </View>
              <View style={{ position: 'absolute', top: '50%', right: -16, marginTop: -55 }}>
                <Plate uri={pollinationsUrl(c.prompt, c.seed)} size={110} />
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bone },
  demoBanner: {
    marginTop: 10,
    marginBottom: 6,
    backgroundColor: colors.ochreSoft,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  demoBannerText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    color: colors.ochre,
    letterSpacing: 1.0,
    textTransform: 'uppercase',
  },
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
    borderRadius: 999,
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
