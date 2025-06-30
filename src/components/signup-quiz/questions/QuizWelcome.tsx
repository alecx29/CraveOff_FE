import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, Platform } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';

import { useTheme } from '@/src/context/ThemeProvider';

interface QuizWelcomeProps {
  onContinue: () => void;
}

export const QuizWelcome = ({ onContinue }: QuizWelcomeProps) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  
  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.container}>
        <Image 
          source={require('@/assets/images/logo.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
        
        <Text style={styles.title}>Welcome to CraveOff</Text>
        
        <Text style={styles.subtitle}>
          Your journey to freedom from porn addiction starts here
        </Text>
        
        <View style={styles.featureContainer}>
          <View style={styles.featureItem}>
            <View style={styles.featureIconContainer}>
              <Text style={styles.featureIcon}>🧠</Text>
            </View>
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureTitle}>Science-Based Approach</Text>
              <Text style={styles.featureDescription}>
                Neuroscience-backed methods to rewire your brain
              </Text>
            </View>
          </View>
          
          <View style={styles.featureItem}>
            <View style={styles.featureIconContainer}>
              <Text style={styles.featureIcon}>🔒</Text>
            </View>
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureTitle}>Complete Privacy</Text>
              <Text style={styles.featureDescription}>
                Your data is encrypted and never shared
              </Text>
            </View>
          </View>
          
          <View style={styles.featureItem}>
            <View style={styles.featureIconContainer}>
              <Text style={styles.featureIcon}>📈</Text>
            </View>
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureTitle}>Personalized Plan</Text>
              <Text style={styles.featureDescription}>
                Tailored recovery journey based on your responses
              </Text>
            </View>
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.continueButton}
          onPress={onContinue}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Start Assessment</Text>
        </TouchableOpacity>
        
        <Text style={styles.privacyText}>
          By continuing, you agree to our Terms of Service and Privacy Policy
        </Text>
      </View>
    </ScrollView>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: Platform.OS === 'web' ? 120 : 100,
    height: Platform.OS === 'web' ? 120 : 100,
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  featureContainer: {
    width: '100%',
    marginBottom: 32,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  featureIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 30,
    backgroundColor: theme.colors.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    ...theme.shadows.light,
  },
  featureIcon: {
    fontSize: 20,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  continueButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 30,
    paddingVertical: 14,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    ...theme.shadows.medium,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  privacyText: {
    fontSize: 12,
    color: 'white',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
});

export default QuizWelcome; 