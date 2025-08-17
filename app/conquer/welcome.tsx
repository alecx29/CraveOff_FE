import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, Text, TouchableOpacity, Image, ScrollView, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ConquerProgressDots from '@/src/components/ConquerProgressDots';
import LottieUniversal from '@/src/components/LottieUniversal';

const { width, height } = Dimensions.get('window');

export default function ConquerWelcome() {
  const insets = useSafeAreaInsets();
  const styles = createStyles(insets);
  
  // Handler to navigate to next page
  const handleNext = () => {
    router.push('/conquer/rewire');
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
                  source={require('@/assets/images/Animation - Superman2.json')}
                  autoPlay
                  loop
                  style={styles.lottie}
                />
              </View>
              
              <Text style={[styles.title, { color: '#ffffff' }]}>
                Welcome to CraveOff
              </Text>
              
              <Text style={[styles.subtitle, { color: '#ffffff' }]}>
                The class-leading porn addiction recovery app that helps you quit for good.
              </Text>
            </View>
          </ScrollView>
          
          {/* Fixed position elements at bottom */}
          <View style={styles.bottomContainer}>
            {/* Progress dots */}
            <ConquerProgressDots activeIndex={0} />
            
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
    backgroundColor: '#db042c',
  },
  backgroundContainer: {
    position: 'absolute',
    top: -insets.top, // Extend above status bar
    left: -insets.left, // Extend to left edge
    right: -insets.right, // Extend to right edge
    bottom: -insets.bottom, // Extend below safe area
    width: width + insets.left + insets.right,
    height: height + insets.top + insets.bottom,
    zIndex: 0,
    backgroundColor: '#db042c',
  },
  backgroundAnimation: {
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
    bottom: height * 0.08, // Position from bottom
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