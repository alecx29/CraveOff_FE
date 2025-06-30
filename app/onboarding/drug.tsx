import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, Text, SafeAreaView, TouchableOpacity, Image, ScrollView, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/src/context/ThemeProvider';
import { Ionicons } from '@expo/vector-icons';
import LottieUniversal from '@/src/components/LottieUniversal';
import OnboardingProgressDots from '@/src/components/OnboardingProgressDots';

const { width, height } = Dimensions.get('window');

export default function DrugOnboarding() {
  const { theme } = useTheme();
  
  // Handler to navigate to goals page - using replace to avoid transition issues
  const handleNext = () => {
    router.push('/onboarding/relationships');
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#db042c' }]}>
      <StatusBar style="light" />
      
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
                source={require('@/assets/images/Animation - brain1.json')}
                autoPlay
                loop
                style={styles.brainImage}
              />
            </View>
            
            <Text style={[styles.title, { color: '#ffffff' }]}>
              Porn is a drug
            </Text>
            
            <Text style={[styles.subtitle, { color: '#ffffff' }]}>
              Using porn releases a chemical in the brain called dopamine feel good- it&apos;s why you feel pleasure when you watch porn
            </Text>
          </View>
        </ScrollView>
        
        {/* Fixed position elements at bottom */}
        <View style={styles.bottomContainer}>
          {/* Progress dots */}
          <OnboardingProgressDots activeIndex={0} />
          
          {/* Custom button */}
          <TouchableOpacity 
            style={styles.nextButton}
            onPress={handleNext}
            activeOpacity={0.8}
          >
            <Text style={styles.nextButtonText}>Next</Text>
            <Ionicons name="arrow-forward" size={20} color="#db042c" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  logoContainer: {
    alignItems: 'center',
    paddingTop: height * 0.03,
    paddingBottom: height * 0.01,
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
  brainImage: {
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
    color: '#db042c',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
}); 