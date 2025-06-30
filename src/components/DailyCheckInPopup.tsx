import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, ImageBackground, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/src/context/ThemeProvider';
import { useLogs, LogEntry } from '@/src/context/LogsContext';

interface DailyCheckInPopupProps {
  onDismiss: () => void;
}

const { height, width } = Dimensions.get('window');
// Reduce height percentage for smaller screens to ensure it fits
const POPUP_HEIGHT = Math.min(450, height * 0.55); // Reduced from 60% to 55%, max 450px (was 500px)

// Define a variable for smaller screens
const IS_SMALL_SCREEN = height < 700; // Nexus 5 is around 640px height

const DailyCheckInPopup: React.FC<DailyCheckInPopupProps> = ({ onDismiss }) => {
  const { theme } = useTheme();
  const { addLog, isLoading } = useLogs();
  const [buttonDisabled, setButtonDisabled] = useState(false);
  const insets = useSafeAreaInsets();
  
  // Adjust for bottom safe area to ensure buttons are accessible
  const bottomPadding = Math.max(insets.bottom, 20);
  
  const slideAnim = useRef(new Animated.Value(height)).current;
  
  useEffect(() => {
    // Calculate the position based on screen size
    // For small screens, position it higher up
    const finalPosition = IS_SMALL_SCREEN 
      ? height - POPUP_HEIGHT - 80 // Position it 80px higher on small screens
      : height - POPUP_HEIGHT;
    
    // Slide up animation when component mounts
    Animated.timing(slideAnim, {
      toValue: finalPosition,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [slideAnim]);
  
  const handleDismiss = () => {
    // Slide down animation when dismissing
    Animated.timing(slideAnim, {
      toValue: height,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onDismiss();
    });
  };
  
  const handleResponse = async (isClean: boolean) => {
    if (buttonDisabled || isLoading) return;
    
    setButtonDisabled(true);
    const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
    
    try {
      // Create log entry - don't include duration at all as it's not needed for daily check-in
      // The backend will handle it as null
      const logEntry = {
        date: today,
        is_clean: isClean
      };
      
      // Pass the log entry without the duration field
      await addLog(logEntry as Omit<LogEntry, 'id'>);
      handleDismiss();
    } catch (error) {
      console.error('Error adding log entry:', error);
    } finally {
      setButtonDisabled(false);
    }
  };
  
  const styles = createStyles(theme, bottomPadding);
  
  return (
    <View style={styles.container}>
      <Animated.View 
        style={[
          styles.popup,
          { transform: [{ translateY: slideAnim }] }
        ]}
      >
        <ImageBackground 
          source={require('@/assets/images/star_background.png')}
          style={styles.backgroundImage}
          resizeMode="cover"
        >
          <View style={styles.contentContainer}>
            <View style={styles.handle} />
            
            <View style={styles.emojiContainer}>
              <Text style={styles.emoji}>👀</Text>
            </View>
            
            <Text style={styles.title}>Did you relapse?</Text>
            <Text style={styles.question}>Let the community know by checking in</Text>
            
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.successButton]}
                onPress={() => handleResponse(true)}
                disabled={buttonDisabled || isLoading}
                activeOpacity={0.8}
              >
                <Ionicons name="shield-checkmark" size={24} color="white" />
                <Text style={styles.buttonText}>No, still going strong</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.button, styles.dangerButton]}
                onPress={() => handleResponse(false)}
                disabled={buttonDisabled || isLoading}
                activeOpacity={0.8}
              >
                <Ionicons name="fitness" size={24} color="white" />
                <Text style={styles.buttonText}>Yes, I relapsed</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ImageBackground>
      </Animated.View>
    </View>
  );
};

// Adjust styles for small screens
const createStyles = (theme: any, bottomPadding: number) => StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000, // Ensure it's above all content including tabs
  },
  popup: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: POPUP_HEIGHT,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden', // Ensure the background image respects rounded corners
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 10,
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  contentContainer: {
    flex: 1,
    padding: IS_SMALL_SCREEN ? 16 : 20, // Smaller padding on small screens
    paddingBottom: bottomPadding, // Dynamic bottom padding based on safe area
    backgroundColor: 'rgba(0, 0, 0, 0.65)', // Semi-transparent overlay to ensure text is readable
  },
  handle: {
    width: 40,
    height: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: IS_SMALL_SCREEN ? 12 : 20, // Smaller margin on small screens
  },
  emojiContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: IS_SMALL_SCREEN ? 12 : 16,
  },
  emoji: {
    fontSize: IS_SMALL_SCREEN ? 40 : 46, // Smaller on small screens
    marginBottom: 6,
  },
  title: {
    fontSize: IS_SMALL_SCREEN ? 22 : 24, // Smaller on small screens
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: IS_SMALL_SCREEN ? 6 : 10,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  question: {
    fontSize: IS_SMALL_SCREEN ? 14 : 16, // Smaller on small screens
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: IS_SMALL_SCREEN ? 20 : 30, // Smaller margin on small screens
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  buttonContainer: {
    gap: IS_SMALL_SCREEN ? 12 : 16, // Smaller gap on small screens
    marginTop: 'auto', // Push buttons to the bottom of the available space
    marginBottom: Platform.OS === 'ios' ? 8 : 16,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: IS_SMALL_SCREEN ? 14 : 16, // Smaller padding on small screens
    paddingHorizontal: 24,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  successButton: {
    backgroundColor: '#4CAF50', // Bright green color
  },
  dangerButton: {
    backgroundColor: '#F44336', // Bright red color
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: IS_SMALL_SCREEN ? 16 : 18, // Smaller font on small screens
    marginLeft: 10,
  },
});

export default DailyCheckInPopup; 