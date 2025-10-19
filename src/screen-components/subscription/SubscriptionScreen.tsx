import React from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Image, ImageBackground } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/src/context/ThemeProvider';
import FreeJourneyContent from './FreeJourneyContent';

interface SubscriptionScreenProps {
  onComplete?: () => void;
}

const SubscriptionScreen = ({ onComplete }: SubscriptionScreenProps) => {
  const { theme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const styles = createStyles(theme, insets);
  
  // Handler pentru continuarea spre aplicație
  const handleContinue = () => {
    if (onComplete) {
      onComplete();
    } else {
      router.replace('/(tabs)');
    }
  };
  
  // Adăugăm un buton de back
  const handleBackPress = () => {
    // Always go back to the plan built (typing) screen
    router.replace('/conquer/planBuilt');
  };

  return (
    <ImageBackground 
      source={require('@/assets/images/star_background.png')}
      style={styles.backgroundImage}
      resizeMode="cover"
      imageStyle={styles.backgroundImageStyle}
    >
      <StatusBar style="light" />
      
      <View style={styles.container}>
        {/* Buton Back */}
        <View style={styles.headerContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBackPress}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
        </View>
        
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* App Logo */}
          <Animated.View 
            entering={FadeInDown.duration(600).delay(100)}
            style={styles.logoContainer}
          >
            <Image 
              source={require('@/assets/images/logo.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
          </Animated.View>
          
          {/* Free Journey Content */}
          <FreeJourneyContent onContinue={handleContinue} />
        </ScrollView>
      </View>
    </ImageBackground>
  );
};

const createStyles = (theme: any, insets: any) => StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  backgroundImageStyle: {
    top: 0,
    scaleX: 1.5,
    scaleY: 1.5,
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: insets.top || 16,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(10px)',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 60 + (insets.bottom || 0),
    paddingTop: 0,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 10,
  },
  logo: {
    width: 200,
    height: 70,
    tintColor: 'white',
  },
});

export default SubscriptionScreen; 