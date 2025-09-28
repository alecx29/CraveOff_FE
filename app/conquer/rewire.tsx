import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, Text, TouchableOpacity, Image, ScrollView, Dimensions, Platform } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ConquerProgressDots from '@/src/components/ConquerProgressDots';
import LottieUniversal from '@/src/components/LottieUniversal';

const { width, height } = Dimensions.get('window');

export default function ConquerRewire() {
  const insets = useSafeAreaInsets();
  const styles = createStyles(insets);
  
  // Handler to navigate to next page
  const handleNext = () => {
    router.push('/conquer/levelup');
  };
  
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Background Animation - positioned absolutely to cover the entire screen */}
      <View style={styles.backgroundContainer}>
        <LottieUniversal
          source={require('@/assets/images/Animation_SkyStar.json')}
          autoPlay
          loop
          style={styles.backgroundAnimation}
          resizeMode="cover"
        />
      </View>
      
      {/* Content Container */}
      <View style={styles.contentWrapper}>
        {/* Logo at the top */}
        <View style={styles.logoContainer}>
          <Image 
            source={require('@/assets/images/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        
        <View style={styles.mainContainer}>
          <ScrollView 
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.contentContainer}>
              <View style={styles.imageContainer}>
                <LottieUniversal
                  source={require('@/assets/images/Animation - brainRewire.json')}
                  autoPlay
                  loop
                  style={styles.lottie}
                />
              </View>
              
              <Text style={[styles.title, { color: '#ffffff' }]}>
                Rewire your brain with CraveOff
              </Text>
              
              <Text style={[styles.subtitle, { color: '#ffffff' }]}>
                Science-backed exercises help you rewire your brain, rebuild your dopamine receptors, and avoid setbacks.
              </Text>
            </View>
          </ScrollView>
          
          {/* Fixed position elements at bottom */}
          <View style={styles.bottomContainer}>
            {/* Progress dots */}
            <ConquerProgressDots activeIndex={1} />
            
            {/* Custom button */}
            <TouchableOpacity 
              style={styles.nextButton}
              onPress={handleNext}
              activeOpacity={0.8}
            >
              <Text style={styles.nextButtonText}>Next</Text>
              <Ionicons name="arrow-forward" size={20} color="#6366f1" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const createStyles = (insets: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Platform.OS === 'ios' ? 'transparent' : '#0B0A10',
  },
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
    backgroundColor: Platform.OS === 'ios' ? 'transparent' : '#0B0A10',
    overflow: 'hidden',
  },
  backgroundAnimation: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  contentWrapper: {
    flex: 1,
    zIndex: 1,
  },
  logoContainer: {
    alignItems: 'center',
    paddingTop: insets.top + 10,
    paddingBottom: 10,
    zIndex: 1,
  },
  logo: {
    width: width * 0.35,
    height: height * 0.04,
    maxWidth: 150,
    maxHeight: 40,
    tintColor: '#ffffff',
  },
  mainContainer: {
    flex: 1,
    position: 'relative',
    zIndex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: height * 0.15, // Add padding to account for bottom container
  },
  contentContainer: {
    paddingHorizontal: width * 0.06,
    paddingVertical: height * 0.04,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: height * 0.6,
  },
  imageContainer: {
    width: Math.min(width * 0.5, 200),
    height: Math.min(width * 0.5, 200),
    overflow: 'hidden',
    marginBottom: height * 0.03,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lottie: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: height * 0.03,
    textAlign: 'center',
    width: '100%',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 24,
    width: '90%',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: height * 0.08 + insets.bottom, // Account for safe area to match onboarding
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1,
  },
  nextButton: {
    backgroundColor: '#ffffff',
    borderRadius: 30,
    height: Math.min(52, height * 0.07),
    paddingHorizontal: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: Math.min(150, width * 0.4),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    marginTop: height * 0.02,
  },
  nextButtonText: {
    color: "#6366f1",
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
}); 