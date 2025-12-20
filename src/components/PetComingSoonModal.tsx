import React from 'react';
import { Modal, TouchableOpacity, View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useTheme } from '@/src/context/ThemeProvider';

interface PetComingSoonModalProps {
  visible: boolean;
  onClose: () => void;
}

const PetComingSoonModal: React.FC<PetComingSoonModalProps> = ({ visible, onClose }) => {
  const { theme } = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent
      presentationStyle="overFullScreen"
    >
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View
          style={styles.card}
          entering={FadeIn.duration(300).springify()}
          exiting={FadeOut.duration(200)}
        >
          <View style={styles.content}>
            <View style={styles.iconWrapper}>
              <Text style={styles.emoji}>🐶</Text>
            </View>
            <Text style={styles.title}>Virtual Pet</Text>
            <Text style={styles.subtitle}>Coming Soon</Text>
            <Text style={styles.description}>
              Soon you&apos;ll be able to adopt a virtual pet that grows and evolves as you progress in your recovery journey.
              Stay tuned for this exciting feature!
            </Text>
            <TouchableOpacity 
              style={styles.ctaButton}
              onPress={onClose}
              activeOpacity={0.9}
            >
              <Text style={styles.ctaText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default PetComingSoonModal; 

const createStyles = (theme: any) => StyleSheet.create({
  overlay: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.large,
    padding: 24,
    ...theme.shadows.medium,
  },
  content: {
    alignItems: 'center',
  },
  iconWrapper: {
    backgroundColor: `${theme.colors.primary}15`,
    borderRadius: 30,
    padding: 16,
    marginBottom: 20,
  },
  emoji: {
    fontSize: 36,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  ctaButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 32,
    marginTop: 8,
  },
  ctaText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
});