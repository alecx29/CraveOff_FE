import React from 'react';
import { Modal, TouchableOpacity, View, Text } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/context/ThemeProvider';

interface DeepBreathingComingSoonModalProps {
  visible: boolean;
  onClose: () => void;
}

const DeepBreathingComingSoonModal: React.FC<DeepBreathingComingSoonModalProps> = ({ visible, onClose }) => {
  const { theme } = useTheme();
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' }} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <Animated.View 
          style={{ backgroundColor: theme.colors.background, borderRadius: theme.borderRadius.large, padding: 24, width: '85%', maxWidth: 340, ...theme.shadows.medium }}
          entering={FadeIn.duration(300).springify()}
          exiting={FadeOut.duration(200)}
        >
          <TouchableOpacity activeOpacity={1}>
            <View style={{ alignItems: 'center' }}>
              <View style={{ backgroundColor: `${theme.colors.primary}15`, borderRadius: 30, padding: 16, marginBottom: 20 }}>
                <Ionicons name="leaf" size={36} color={theme.colors.primary} />
              </View>
              <Text style={{ fontSize: 22, fontWeight: '700', color: theme.colors.textPrimary, marginBottom: 4 }}>Deep Breathing</Text>
              <Text style={{ fontSize: 16, fontWeight: '600', color: theme.colors.primary, marginBottom: 16 }}>Coming Soon</Text>
              <Text style={{ fontSize: 15, color: theme.colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 24 }}>
                We&apos;re working on guided breathing exercises to help you manage urges and reduce stress.
                This feature will be available in the next update.
              </Text>
              <TouchableOpacity 
                style={{ backgroundColor: theme.colors.primary, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 32, marginTop: 8 }}
                onPress={onClose}
              >
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#fff' }}>Got it</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
};

export default DeepBreathingComingSoonModal; 