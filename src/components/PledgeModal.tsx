import React, { useEffect, useRef, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Dimensions, 
  ImageBackground, 
  Platform,
  Animated as RNAnimated
} from 'react-native';
import { Ionicons, AntDesign, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  FadeIn, 
  FadeOut, 
  SlideInUp, 
  SlideOutDown 
} from 'react-native-reanimated';

import { useTheme } from '@/src/context/ThemeProvider';

interface PledgeModalProps {
  visible: boolean;
  onClose: () => void;
  onPledge: () => void;
}

const { height, width } = Dimensions.get('window');
const MODAL_HEIGHT = Math.min(450, height * 0.6);
const IS_SMALL_SCREEN = height < 700;

const PledgeModal = ({ visible, onClose, onPledge }: PledgeModalProps) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [isPledging, setIsPledging] = useState(false);
  
  // Animation values
  const scaleAnim = useRef(new RNAnimated.Value(0.9)).current;
  const opacityAnim = useRef(new RNAnimated.Value(0)).current;
  
  // Adjust for safe areas
  const bottomPadding = Math.max(insets.bottom, 20);
  
  useEffect(() => {
    if (visible) {
      // Reset animation values
      scaleAnim.setValue(0.9);
      opacityAnim.setValue(0);
      
      // Start animations
      RNAnimated.parallel([
        RNAnimated.timing(scaleAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        RNAnimated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);
  
  const handleClose = () => {
    // Animate out
    RNAnimated.parallel([
      RNAnimated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 200,
        useNativeDriver: true,
      }),
      RNAnimated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
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
  
  const styles = createStyles(theme, bottomPadding);
  
  return (
    <Animated.View 
      style={styles.container}
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(200)}
    >
      <RNAnimated.View 
        style={[
          styles.modalContainer,
          {
            opacity: opacityAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        <ImageBackground
          source={require('@/assets/images/star_background.png')}
          style={[styles.backgroundImage, { backgroundColor: 'rgb(4 9 21 / 95%)' }]}
          imageStyle={{ opacity: 0.1 }}
        >
          <View style={styles.headerContainer}>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={handleClose}
              activeOpacity={0.7}
            >
              <AntDesign name="close" size={22} color={theme.colors.textSecondary} />
            </TouchableOpacity>
            
            <Text style={styles.title} selectable={false}>Pledge Sobriety Today</Text>
            <View style={{ width: 40 }} /> {/* Spacer for alignment */}
          </View>
          
          <View style={styles.contentContainer}>
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={['rgb(175, 15, 81)', 'rgb(93, 107, 250)']}
                style={styles.iconBackground}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="hand-right" size={36} color="#fff" />
              </LinearGradient>
            </View>
            
            <Text style={styles.pledgeText} selectable={false}>
              Commit to 24 hours of strength. You're stronger than the urge — and we'll be here to check in when you've won.
            </Text>
            
            <View style={styles.optionsOuterContainer}>
              <View style={styles.optionsContainer}>
                <View style={styles.optionItem}>
                  <View style={styles.optionContent}>
                    <View style={styles.optionIconContainer}>
                      <MaterialCommunityIcons 
                        name="target" 
                        size={16} 
                        color={theme.colors.primary} 
                      />
                    </View>
                    <View style={styles.optionTextContainer}>
                      <Text style={styles.optionText} selectable={false}>
                        Achievable goal
                      </Text>
                      <Text style={styles.optionSubtext} selectable={false}>Focus on small wins</Text>
                    </View>
                  </View>
                </View>
                
                <View style={styles.optionItem}>
                  <View style={styles.optionContent}>
                    <View style={styles.optionIconContainer}>
                      <Feather 
                        name="coffee" 
                        size={16} 
                        color={theme.colors.primary} 
                      />
                    </View>
                    <View style={styles.optionTextContainer}>
                      <Text style={styles.optionText} selectable={false}>
                        Take it Easy
                      </Text>
                      <Text style={styles.optionSubtext} selectable={false}>One day at a time</Text>
                    </View>
                  </View>
                </View>
                
                <View style={styles.optionItem}>
                  <View style={styles.optionContent}>
                    <View style={styles.optionIconContainer}>
                      <Ionicons 
                        name="trophy-outline" 
                        size={16} 
                        color={theme.colors.primary} 
                      />
                    </View>
                    <View style={styles.optionTextContainer}>
                      <Text style={styles.optionText} selectable={false}>
                        Success is Inevitable
                      </Text>
                      <Text style={styles.optionSubtext} selectable={false}>Embrace your potential</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </View>
          
          <TouchableOpacity
            style={[
              styles.pledgeButton, 
              styles.pledgeButtonEnabled
            ]}
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
                  <Ionicons name="warning" size={20} color="#000000" style={{ marginRight: 8 }} />
                  <Text style={styles.pledgeButtonText}>Pledge Now</Text>
                </>
              )}
            </View>
          </TouchableOpacity>
        </ImageBackground>
      </RNAnimated.View>
    </Animated.View>
  );
};

const createStyles = (theme: any, bottomPadding: number) => StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    zIndex: 1000,
  },
  modalContainer: {
    width: '90%',
    maxWidth: 360,
    backgroundColor: theme.colors.modalBackground || theme.colors.cardBackground,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    backgroundColor: 'rgb(4 9 21 / 95%)',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  contentContainer: {
    padding: 20,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconBackground: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgb(175, 15, 81)',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  pledgeText: {
    fontSize: 16,
    lineHeight: 24,
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: 24,
  },
  optionsOuterContainer: {
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
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(10px)',
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
    fontSize: 14,
    color: theme.colors.textPrimary,
    fontWeight: '600',
    marginBottom: 2,
  },
  optionSubtext: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '400',
  },
  pledgeButton: {
    margin: 20,
    marginTop: 0,
    marginBottom: bottomPadding,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  pledgeButtonDisabled: {
    backgroundColor: '#E5E5E5',
    opacity: 0.7,
  },
  pledgeButtonEnabled: {
    backgroundColor: '#FFFFFF',
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
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default PledgeModal; 