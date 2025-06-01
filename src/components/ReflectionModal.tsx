import React, { useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Dimensions, 
  ImageBackground,
  StatusBar,
  Animated as RNAnimated
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { 
  FadeIn, 
  FadeOut
} from 'react-native-reanimated';

import { useTheme } from '@/src/context/ThemeProvider';

interface ReflectionModalProps {
  visible: boolean;
  onClose: () => void;
}

const { height, width } = Dimensions.get('window');

const ReflectionModal = ({ visible, onClose }: ReflectionModalProps) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  
  // Animation values
  const titleOpacity = useRef(new RNAnimated.Value(0)).current;
  const contentOpacity = useRef(new RNAnimated.Value(0)).current;
  const buttonOpacity = useRef(new RNAnimated.Value(0)).current;
  
  // Adjust for safe areas
  const bottomPadding = Math.max(insets.bottom, 20);
  const topPadding = Math.max(insets.top, 20);
  
  useEffect(() => {
    if (visible) {
      // Reset animation values
      titleOpacity.setValue(0);
      contentOpacity.setValue(0);
      buttonOpacity.setValue(0);
      
      // Animate title
      RNAnimated.timing(titleOpacity, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }).start();
      
      // Animate content with delay
      setTimeout(() => {
        RNAnimated.timing(contentOpacity, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }).start();
      }, 500);
      
      // Animate button with delay
      setTimeout(() => {
        RNAnimated.timing(buttonOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }).start();
      }, 1500);
    }
  }, [visible]);
  
  if (!visible) return null;
  
  const styles = createStyles(theme, bottomPadding, topPadding);
  
  return (
    <Animated.View 
      style={styles.container}
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(200)}
    >
      <StatusBar barStyle="light-content" />
      
      <ImageBackground
        source={require('@/assets/images/star_background.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.contentContainer}>
          {/* Title */}
          <RNAnimated.Text style={[styles.title, { opacity: titleOpacity }]}>
            REFLECT AND BREATHE
          </RNAnimated.Text>
          
          {/* Reflection content */}
          <RNAnimated.View style={[styles.textContainer, { opacity: contentOpacity }]}>
            <Text style={styles.reflectionText}>
              You&apos;re feeling the urge to relapse again, and that&apos;s okay.
            </Text>
            <Text style={styles.reflectionText}>
              It&apos;s love you&apos;re looking for.
            </Text>
            <Text style={styles.reflectionText}>
              Porn pushes you away from that.
            </Text>
          </RNAnimated.View>
          
          {/* Button */}
          <RNAnimated.View style={[styles.buttonContainer, { opacity: buttonOpacity }]}>
            <TouchableOpacity 
              style={styles.finishButton}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>Finish Reflecting</Text>
            </TouchableOpacity>
          </RNAnimated.View>
        </View>
      </ImageBackground>
    </Animated.View>
  );
};

const createStyles = (theme: any, bottomPadding: number, topPadding: number) => StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    zIndex: 1000,
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: topPadding + 80,
    paddingBottom: bottomPadding + 40,
    paddingHorizontal: 30,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    letterSpacing: 2,
    marginBottom: 60,
  },
  textContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  reflectionText: {
    fontSize: 28,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 45,
    marginBottom: 20,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 50,
  },
  finishButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    minWidth: 200,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default ReflectionModal; 