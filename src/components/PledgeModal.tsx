import React, { useEffect, useRef, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Dimensions, 
  ImageBackground, 
  StatusBar,
  Animated as RNAnimated,
  ScrollView
} from 'react-native';
import { Ionicons, AntDesign, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  FadeIn, 
  FadeOut
} from 'react-native-reanimated';

import { useTheme } from '@/src/context/ThemeProvider';

interface PledgeModalProps {
  visible: boolean;
  onClose: () => void;
  onPledge: () => void;
}

const { height, width } = Dimensions.get('window');
const IS_SMALL_SCREEN = height < 700;
const MODAL_MAX_HEIGHT = Math.min(height - 40, 600); // max 600px sau cât încape pe ecran

const PledgeModal = ({ visible, onClose, onPledge }: PledgeModalProps) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [isPledging, setIsPledging] = useState(false);
  
  // Animation values
  const opacityAnim = useRef(new RNAnimated.Value(0)).current;
  
  // Adjust for safe areas
  const bottomPadding = Math.max(insets.bottom, 20);
  const topPadding = Math.max(insets.top, 20);
  
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
  }, [visible]);
  
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
  
  if (!visible) return null;
  
  const styles = createStyles(theme, bottomPadding, topPadding);
  
  return (
    <Animated.View 
      style={styles.container}
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(200)}
    >
      <StatusBar barStyle="light-content" />
      
      <View style={styles.backgroundImage}>
        <RNAnimated.View 
          style={[
            styles.fullScreenContainer,
            { opacity: opacityAnim, justifyContent: 'center', alignItems: 'center' }
          ]}
        >
          {/* X Button at the top */}
          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={handleClose}
            activeOpacity={0.7}
          >
            <AntDesign name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={[styles.modalBox, { maxHeight: MODAL_MAX_HEIGHT, minWidth: 320, width: '90%' }]}> 
            <ScrollView
              contentContainerStyle={styles.contentContainer}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.title}>Pledge Sobriety Today</Text>
              <View style={styles.iconContainer}>
                <LinearGradient
                  colors={['rgb(175, 15, 81)', 'rgb(93, 107, 250)']}
                  style={styles.iconBackground}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name="hand-right" size={40} color="#fff" />
                </LinearGradient>
              </View>
              <Text style={styles.pledgeText}>
                Commit to 24 hours of strength. You're stronger than the urge — and we'll be here to check in when you've won.
              </Text>
              <View style={styles.optionsOuterContainer}>
                <View style={styles.optionsContainer}>
                  <View style={styles.optionItem}>
                    <View style={styles.optionContent}>
                      <View style={styles.optionIconContainer}>
                        <MaterialCommunityIcons 
                          name="target" 
                          size={18} 
                          color={theme.colors.primary} 
                        />
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
                        <Feather 
                          name="coffee" 
                          size={18} 
                          color={theme.colors.primary} 
                        />
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
                        <Ionicons 
                          name="trophy-outline" 
                          size={18} 
                          color={theme.colors.primary} 
                        />
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
              {/* Padding bottom pentru a nu fi acoperit de buton */}
              <View style={{ height: 80 }} />
            </ScrollView>
            {/* Pledge Button la baza modalului, mereu vizibil */}
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
                  <Text style={styles.pledgeButtonText}>Pledge Now</Text>
                )}
              </View>
            </TouchableOpacity>
          </View>
        </RNAnimated.View>
      </View>
    </Animated.View>
  );
};

const createStyles = (theme: any, bottomPadding: number, topPadding: number) => StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    zIndex: 1000,
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
  },
  fullScreenContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  closeButton: {
    position: 'absolute',
    top: topPadding,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    zIndex: 10,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingTop: topPadding + 40,
    paddingBottom: 100, // Space for the button at bottom
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 30,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  iconBackground: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgb(175, 15, 81)',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  pledgeText: {
    fontSize: 18,
    lineHeight: 26,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 30,
  },
  optionsOuterContainer: {
    width: '100%',
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  optionsContainer: {
    borderRadius: 16,
    padding: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    backdropFilter: 'blur(0px)',
  },
  optionItem: {
    padding: 12,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'transparent',
    marginBottom: 10,
    borderWidth: 0,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    marginBottom: 4,
  },
  optionSubtext: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '400',
  },
  modalBox: {
    backgroundColor: 'rgba(20,20,30,0.98)',
    borderRadius: 24,
    paddingBottom: 0,
    paddingTop: 0,
    alignItems: 'center',
    justifyContent: 'flex-start',
    overflow: 'hidden',
    position: 'relative',
  },
  pledgeButton: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 20,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  pledgeButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
  },
  pledgeButtonText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default PledgeModal; 