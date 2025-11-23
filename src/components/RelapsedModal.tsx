import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  StatusBar,
  ScrollView,
  Modal
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { 
  FadeIn, 
  FadeOut
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { useTheme } from '@/src/context/ThemeProvider';
import { usePledge } from '@/src/context/PledgeContext';
import Header from '@/src/components/header/Header';

interface RelapsedModalProps {
  visible: boolean;
  onClose: () => void;
  onResetCounter: () => void;
}

const RelapsedModal = ({ visible, onClose, onResetCounter }: RelapsedModalProps) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { canMakePledge, activePledgeTimeRemaining } = usePledge();
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  // Adjust for safe areas
  const bottomPadding = Math.max(insets.bottom, 20);
  const topPadding = Math.max(insets.top, 20);
  
  // Function to navigate to journal tab
  const goToJournal = () => {
    onClose();
    // Navigate to journal tab
    router.push('/(tabs)/journal');
  };

  // Function to handle reset button press
  const handleResetPress = () => {
    // Always show confirmation modal, regardless of pledge status
    setShowConfirmation(true);
  };

  // Function to confirm reset
  const confirmReset = () => {
    setShowConfirmation(false);
    onResetCounter();
    onClose();
  };
  
  const styles = createStyles(theme, bottomPadding, topPadding);
  
  return (
    <Modal
      transparent
      visible={visible}
      onRequestClose={onClose}
      animationType="none"
    >
      <Animated.View 
        style={styles.container}
        entering={FadeIn.duration(300)}
        exiting={FadeOut.duration(200)}
      >
        <StatusBar barStyle="light-content" />
        
        {/* Using the reusable Header component */}
        <Header 
          title="Relapsed" 
          titleColor="#e74c3c"
          onClose={onClose}
          backgroundColor={theme.colors.background || '#121212'}
        />
        
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.contentContainer}>
            {/* Header Section */}
            <View style={styles.headerSection}>
              {/* Subtitle */}
              <Text style={styles.subtitle}>
                Don&apos;t be hard on yourself
              </Text>
              
              {/* Description */}
              <Text style={styles.description}>
                Every setback is a learning opportunity. Focus on progress, not perfection.
              </Text>
            </View>
            
            {/* Objections Container */}
            <View style={styles.optionsOuterContainer}>
              <Text style={styles.cycleText}>
                Our goal is to avoid the following cycle
              </Text>
              <View style={styles.optionsContainer}>
                {/* Option 1 */}
                <View style={styles.optionItem}>
                  <View style={styles.optionContent}>
                    <View style={styles.optionIconContainer}>
                      <Text style={styles.optionEmoji}>👀</Text>
                    </View>
                    <View style={styles.optionTextContainer}>
                      <Text style={styles.optionText} selectable={false}>
                        Watching porn
                      </Text>
                      <Text style={styles.optionSubtext} selectable={false}>
                        In the moment you feel incredible
                      </Text>
                    </View>
                  </View>
                </View>
                
                {/* Option 2 */}
                <View style={styles.optionItem}>
                  <View style={styles.optionContent}>
                    <View style={styles.optionIconContainer}>
                      <Text style={styles.optionEmoji}>🧠</Text>
                    </View>
                    <View style={styles.optionTextContainer}>
                      <Text style={styles.optionText} selectable={false}>
                        Post-Nut Clarity
                      </Text>
                      <Text style={styles.optionSubtext} selectable={false}>
                        Shortly after, the euphoria fades, and you get feelings of guilt or sadness
                      </Text>
                    </View>
                  </View>
                </View>
                
                {/* Option 3 */}
                <View style={styles.optionItem}>
                  <View style={styles.optionContent}>
                    <View style={styles.optionIconContainer}>
                      <Text style={styles.optionEmoji}>🔁</Text>
                    </View>
                    <View style={styles.optionTextContainer}>
                      <Text style={styles.optionText} selectable={false}>
                        Compensation cycle
                      </Text>
                      <Text style={styles.optionSubtext} selectable={false}>
                        You repeat
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
            
            {/* Journal Button */}
            <TouchableOpacity 
              style={styles.journalButton}
              onPress={goToJournal}
              activeOpacity={0.8}
            >
              <View style={styles.journalButtonContent}>
                <Ionicons name="journal-outline" size={20} color="#fff" style={styles.journalIcon} />
                <Text style={styles.journalButtonText}>Journal Feelings</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </View>
            </TouchableOpacity>
          </View>
          
          {/* Button Container - Fixed at bottom */}
          <View style={styles.bottomButtonContainer}>
            {!canMakePledge && (
              <View style={styles.pledgeWarning}>
                <Ionicons name="shield-checkmark" size={18} color="#fff" style={styles.pledgeIcon} />
                <Text style={styles.pledgeWarningText}>
                  You have an active pledge ({activePledgeTimeRemaining} remaining)
                </Text>
              </View>
            )}
            <TouchableOpacity 
              style={styles.resetButton}
              onPress={handleResetPress}
              activeOpacity={0.8}
            >
              <Ionicons name="refresh-outline" size={22} color="#fff" style={styles.resetIcon} />
              <Text style={styles.buttonText}>Reset Counter</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
    
        {/* Confirmation Modal */}
        <Modal
          transparent={true}
          visible={showConfirmation}
          animationType="fade"
          onRequestClose={() => setShowConfirmation(false)}
        >
          <View style={styles.confirmationOverlay}>
            <View style={styles.confirmationContainer}>
              <View style={styles.confirmationHeader}>
                <Ionicons name="warning" size={28} color="#FF9500" />
                <Text style={styles.confirmationTitle}>Reset Counter</Text>
              </View>
              {!canMakePledge ? (
                <Text style={styles.confirmationMessage}>
                  You have an active pledge with {activePledgeTimeRemaining} remaining. 
                  Are you sure you want to reset your counter?
                </Text>
              ) : (
                <Text style={styles.confirmationMessage}>
                  Are you sure you want to reset your counter?
                </Text>
              )}
              {!canMakePledge && (
                <Text style={styles.confirmationEncouragement}>
                  Remember, you committed to this pledge.
                </Text>
              )}
              <View style={styles.confirmationButtons}>
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={() => setShowConfirmation(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.confirmButton}
                  onPress={confirmReset}
                >
                  <Text style={styles.confirmButtonText}>Reset</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </Animated.View>
    </Modal>
  );
};

const createStyles = (theme: any, bottomPadding: number, topPadding: number) => StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.colors.background || '#121212',
    zIndex: 1000,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 20,
    paddingBottom: bottomPadding + 20,
    justifyContent: 'space-between',
  },
  contentContainer: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 30,
    marginBottom: 30,
  },
  headerSection: {
    alignItems: 'center',
    width: '100%',
  },
  subtitle: {
    fontSize: 28,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 30,
    maxWidth: 300,
  },
  optionsOuterContainer: {
    width: '100%',
    marginBottom: 30,
    borderRadius: 16,
    overflow: 'hidden',
  },
  cycleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#916262',
    textAlign: 'center',
    marginBottom: 12,
    opacity: 0.9,
  },
  optionsContainer: {
    borderRadius: 16,
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  optionItem: {
    padding: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'transparent',
    marginBottom: 8,
    borderWidth: 0,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionIconContainer: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
    marginBottom: 2,
  },
  optionEmoji: {
    fontSize: 18,
  },
  optionSubtext: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '400',
  },
  journalButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 30,
    marginBottom: 20,
    width: '100%',
    maxWidth: 300,
  },
  journalButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  journalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  journalIcon: {
    marginRight: 6,
  },
  bottomButtonContainer: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 30,
    marginTop: 20,
    marginBottom: 10,
  },
  pledgeWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 149, 0, 0.2)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 16,
    width: '100%',
  },
  pledgeIcon: {
    marginRight: 8,
  },
  pledgeWarningText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  resetButton: {
    backgroundColor: '#e74c3c', // Red color for the button
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    minWidth: 200,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  resetIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  confirmationOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
  },
  confirmationContainer: {
    backgroundColor: theme.colors.card || '#1c1c1e',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 360,
    alignItems: 'center',
  },
  confirmationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  confirmationTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginLeft: 10,
  },
  confirmationMessage: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 12,
  },
  confirmationEncouragement: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 24,
  },
  confirmationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#e74c3c',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default RelapsedModal; 