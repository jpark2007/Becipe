import { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, radius } from '@/lib/theme';

const STORAGE_KEY = 'has_seen_photo_tips';

export function usePhotoTips() {
  const [shouldShow, setShouldShow] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((val) => {
      setShouldShow(val !== 'true');
      setChecked(true);
    });
  }, []);

  async function dismiss() {
    setShouldShow(false);
    await AsyncStorage.setItem(STORAGE_KEY, 'true');
  }

  return { shouldShow: checked && shouldShow, dismiss };
}

export function PhotoTipsModal({ visible, onDismiss }: { visible: boolean; onDismiss: () => void }) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Quick photo tips</Text>
          <Text style={styles.tip}>Natural light works best</Text>
          <Text style={styles.tip}>Shoot from above to show the whole plate</Text>
          <Text style={styles.tip}>Get close — fill the frame</Text>
          <Pressable style={styles.btn} onPress={onDismiss}>
            <Text style={styles.btnText}>Got it</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.bone,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: colors.ink,
    marginBottom: 16,
  },
  tip: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: colors.inkSoft,
    marginBottom: 12,
    lineHeight: 20,
  },
  btn: {
    backgroundColor: colors.sage,
    borderRadius: radius.pill,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  btnText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    color: '#fff',
  },
});
