import React, { useEffect, useRef, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  StatusBar,
  Animated as RNAnimated,
  ScrollView,
  Modal,
  ImageBackground
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated from 'react-native-reanimated';

import { useTheme } from '@/src/context/ThemeProvider';
import Header from '@/src/components/header/Header';

interface PledgeModalProps {
  visible: boolean;
  onClose: () => void;
  onPledge: () => void;
}

const PledgeModal = ({ visible, onClose, onPledge }: PledgeModalProps) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [isPledging, setIsPledging] = useState(false);
  
  // Animation values
  const opacityAnim = useRef(new RNAnimated.Value(0)).current;
  
  // Adjust for safe areas
  const bottomPadding = Math.max(insets.bottom, 20);
  
  useEffect(() => {
    if (visible) {
      // Reset animation values
      opacityAnim.setValue(0);
      
      // Start animations
      RNAnimated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, opacityAnim]);
  
  const handleClose = () => {
    // Animate out
    RNAnimated.timing(opacityAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };
  
  const handlePledge = async () => {
    setIsPledging(true);
    
    // Call onPledge without requiring a selected option
    setTimeout(() => {
      setIsPledging(false);
      onPledge();
      handleClose();
    }, 800);
  };
  
  const styles = createStyles(theme, bottomPadding);
  
  return (
    <Modal
      transparent
      visible={visible}
      onRequestClose={handleClose}
      animationType="none"
      statusBarTranslucent
    >
      <Animated.View style={styles.container}>
        <StatusBar barStyle="light-content" />
        
        <ImageBackground
          source={require('@/assets/images/afterPay1.png')}
          style={styles.background}
          resizeMode="cover"
        >
          <RNAnimated.View 
            style={[
              styles.fullScreenContainer,
              { opacity: opacityAnim }
            ]}
          >
            {/* Using the reusable Header component */}
            <Header 
              title="Pledge" 
              onClose={handleClose}
              backgroundColor="transparent"
            />
            
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.contentContainer}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.iconContainer}>
                <Ionicons name="hand-right" size={94} color="#fff" />
              </View>
              
              <Text style={styles.title}>Pledge Sobriety Today</Text>
              
              <Text style={styles.pledgeText}>
                Commit to 24 hours of strength. You&apos;re stronger than the urge — and we&apos;ll be here to check in when you&apos;ve won.
              </Text>
              <View style={styles.optionsOuterContainer}>
                <View style={styles.optionsContainer}>
                  <View style={styles.optionItem}>
                    <View style={styles.optionContent}>
                      <View style={styles.optionIconContainer}>
                        <Text style={styles.optionEmoji}>🎯</Text>
                      </View>
                      <View style={styles.optionTextContainer}>
                        <Text style={styles.optionText}>
                          Achievable goal
                        </Text>
                        <Text style={styles.optionSubtext}>Focus on small wins</Text>
                      </View>
                    </View>
                  </View>
                  
                  <View style={styles.optionItem}>
                    <View style={styles.optionContent}>
                      <View style={styles.optionIconContainer}>
                        <Text style={styles.optionEmoji}>☕</Text>
                      </View>
                      <View style={styles.optionTextContainer}>
                        <Text style={styles.optionText}>
                          Take it Easy
                        </Text>
                        <Text style={styles.optionSubtext}>One day at a time</Text>
                      </View>
                    </View>
                  </View>
                  
                  <View style={styles.optionItem}>
                    <View style={styles.optionContent}>
                      <View style={styles.optionIconContainer}>
                        <Text style={styles.optionEmoji}>🏆</Text>
                      </View>
                      <View style={styles.optionTextContainer}>
                        <Text style={styles.optionText}>
                          Success is Inevitable
                        </Text>
                        <Text style={styles.optionSubtext}>Embrace your potential</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
              
              {/* Pledge Button now inside ScrollView */}
              <View style={styles.buttonWrapper}>
                <TouchableOpacity
                  style={styles.pledgeButton}
                  onPress={handlePledge}
                  activeOpacity={0.7}
                  disabled={isPledging}
                >
                  <View style={styles.pledgeButtonContent}>
                    {isPledging ? (
                      <View style={styles.loadingContainer}>
                        <Ionicons name="sync" size={22} color="#000000" style={{ transform: [{ rotate: '45deg' }] }} />
                      </View>
                    ) : (
                      <>
                        <Ionicons name="hand-right" size={22} color="#000000" style={styles.pledgeIcon} />
                        <Text style={styles.pledgeButtonText}>Pledge Now</Text>
                      </>
                    )}
                  </View>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </RNAnimated.View>
        </ImageBackground>
      </Animated.View>
    </Modal>
  );
};

const createStyles = (theme: any, bottomPadding: number) => StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    // Modal is `transparent`, so ensure we still fully cover (no bleed-through).
    backgroundColor: '#000',
  },
  background: {
    width: '100%',
    height: '100%',
    opacity: 0.90,
  },
  fullScreenContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingTop: 20,
    paddingBottom: bottomPadding + 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 16,
  },
  pledgeText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 30,
  },
  optionsOuterContainer: {
    width: '100%',
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
  },
  optionsContainer: {
    borderRadius: 16,
    padding: 10,
    // Tinted overlay over the background image (readable + premium, still shows the image)
    backgroundColor: 'rgba(10, 10, 20, 0.24 )',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
  },
  optionItem: {
    padding: 8,
    paddingVertical: 8,
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
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionText: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '600',
    marginBottom: 2,
  },
  optionEmoji: {
    fontSize: 18,
  },
  optionSubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '400',
  },
  buttonWrapper: {
    width: '100%',
    marginTop: 20,
    paddingHorizontal: 10,
    paddingBottom: bottomPadding,
    alignItems: 'center',
  },
  pledgeButton: {
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    minWidth: 200,
    paddingHorizontal: 32,
  },
  pledgeButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  pledgeButtonText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '600',
  },
  pledgeIcon: {
    marginRight: 8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default PledgeModal; 