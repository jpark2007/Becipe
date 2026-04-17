// components/WoodenTable.tsx
// Pure-View wooden table visual (react-native-svg not installed; fallback implementation).
// Renders a round "wood" circle with avatars positioned around the rim using absolute layout + trig.

import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, shadow } from '@/lib/theme';

export interface TableMember {
  initial: string;
  name: string;
  twin: string;
  color: string;
}

interface WoodenTableProps {
  members: TableMember[];
  onMemberPress?: (idx: number) => void;
}

const TABLE_SIZE = 320;
const TABLE_RADIUS = 90;
const AVATAR_SIZE = 56;
const RIM_RADIUS = 130; // how far avatars sit from center
const CX = TABLE_SIZE / 2;
const CY = TABLE_SIZE / 2;

export function WoodenTable({ members, onMemberPress }: WoodenTableProps) {
  return (
    <View style={styles.container}>
      {/* The table surface */}
      <View style={styles.tableSurface}>
        <View style={styles.tableInner}>
          <Text style={styles.tableLabel}>THE TABLE</Text>
        </View>
      </View>

      {/* Avatars positioned around the rim */}
      {members.map((member, i) => {
        const angle = (i / members.length) * 2 * Math.PI - Math.PI / 2;
        const x = CX + RIM_RADIUS * Math.cos(angle) - AVATAR_SIZE / 2;
        const y = CY + RIM_RADIUS * Math.sin(angle) - AVATAR_SIZE / 2;

        return (
          <Pressable
            key={i}
            style={[styles.memberChip, { left: x, top: y }]}
            onPress={() => onMemberPress?.(i)}
          >
            <View style={[styles.avatar, { backgroundColor: member.color }]}>
              <Text style={styles.avatarInitial}>{member.initial}</Text>
            </View>
            <Text style={styles.memberName}>{member.name}</Text>
            <Text style={[styles.memberTwin, member.twin === '—' ? styles.memberTwinMuted : styles.memberTwinSage]}>
              {member.twin}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: TABLE_SIZE,
    height: TABLE_SIZE,
    alignSelf: 'center',
    position: 'relative',
  },
  tableSurface: {
    position: 'absolute',
    left: CX - TABLE_RADIUS,
    top: CY - TABLE_RADIUS,
    width: TABLE_RADIUS * 2,
    height: TABLE_RADIUS * 2,
    borderRadius: TABLE_RADIUS,
    backgroundColor: '#C9A875',
    borderWidth: 4,
    borderColor: '#8B6F47',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.plate,
  },
  tableInner: {
    width: TABLE_RADIUS * 2 - 20,
    height: TABLE_RADIUS * 2 - 20,
    borderRadius: TABLE_RADIUS - 10,
    borderWidth: 1.5,
    borderColor: '#8B6F47',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: 9,
    color: '#F4E8D6',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  memberChip: {
    position: 'absolute',
    width: AVATAR_SIZE,
    alignItems: 'center',
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.bone,
    ...shadow.cta,
  },
  avatarInitial: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 20,
    color: '#fff',
  },
  memberName: {
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
    color: colors.ink,
    marginTop: 4,
    textAlign: 'center',
  },
  memberTwin: {
    fontFamily: 'Inter_500Medium',
    fontSize: 10,
    textAlign: 'center',
  },
  memberTwinSage: { color: colors.sage },
  memberTwinMuted: { color: colors.muted },
});
