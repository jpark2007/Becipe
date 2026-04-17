// components/MemberRing.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/lib/theme';

type Member = {
  initial: string;
  name: string;
  twin?: string;       // e.g. "92% twin"
  color: string;       // background color
};

export function MemberRing({ members }: { members: Member[] }) {
  // 4 members: top / right / bottom / left
  const positions = [
    { top: -12, left: '50%' as const, marginLeft: -34 },
    { top: '50%' as const, right: -18, marginTop: -34 },
    { bottom: -12, left: '50%' as const, marginLeft: -34 },
    { top: '50%' as const, left: -18, marginTop: -34 },
  ];

  return (
    <View style={styles.ring}>
      <Text style={styles.tableLabel}>THE TABLE</Text>
      {members.slice(0, 4).map((m, i) => (
        <View key={i} style={[styles.mem, positions[i]]}>
          <View style={[styles.av, { backgroundColor: m.color }]}>
            <Text style={styles.avText}>{m.initial}</Text>
          </View>
          <Text style={styles.name}>{m.name}</Text>
          {m.twin ? <Text style={styles.twin}>{m.twin}</Text> : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    width: 260, height: 260,
    alignSelf: 'center',
    position: 'relative',
    marginVertical: 12,
  },
  tableLabel: {
    position: 'absolute',
    top: '50%', left: '50%',
    width: 80, marginLeft: -40, marginTop: -7,
    textAlign: 'center',
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    color: colors.muted,
    letterSpacing: 1.5,
  },
  mem: {
    position: 'absolute',
    width: 68, alignItems: 'center', gap: 4,
  },
  av: {
    width: 54, height: 54, borderRadius: 27,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 4, borderColor: colors.bone,
    shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 6, shadowOffset: { width: 0, height: 4 },
  },
  avText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20, color: '#F5E9D3',
  },
  name: { fontFamily: 'Inter_700Bold', fontSize: 11, color: colors.ink },
  twin: { fontFamily: 'Inter_700Bold', fontSize: 9, color: colors.sage },
});
