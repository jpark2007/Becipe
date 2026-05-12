// components/ActionSheet.tsx
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, radius } from '@/lib/theme';

export interface ActionSheetAction {
  label: string;
  onPress: () => void;
  destructive?: boolean;
}

export interface ActionSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  actions: ActionSheetAction[];
}

export function ActionSheet({ visible, onClose, title, actions }: ActionSheetProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          {title ? <Text style={styles.title} numberOfLines={2}>{title}</Text> : null}

          <View style={styles.actions}>
            {actions.map((action, i) => (
              <Pressable
                key={i}
                style={styles.actionBtn}
                onPress={() => {
                  onClose();
                  action.onPress();
                }}
              >
                <Text
                  style={[
                    styles.actionLabel,
                    action.destructive && { color: colors.clay },
                  ]}
                >
                  {action.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Pressable style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelLabel}>Cancel</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlayScrim,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: colors.ink,
    textAlign: 'center',
    marginBottom: 16,
  },
  actions: {
    gap: 8,
  },
  actionBtn: {
    height: 52,
    backgroundColor: colors.bg,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: colors.ink,
  },
  cancelBtn: {
    height: 52,
    backgroundColor: colors.bg,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  cancelLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: colors.muted,
  },
});
