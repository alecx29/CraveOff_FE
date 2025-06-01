import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useTheme } from '@/src/context/ThemeProvider';

interface SubscriptionPlan {
  id: string;
  title: string;
  price: string;
  period: string;
  features: string[];
  popular: boolean;
  savings?: string;
}

interface SubscriptionScreenProps {
  onComplete?: () => void;
}

const SubscriptionScreen = ({ onComplete }: SubscriptionScreenProps) => {
  const { theme } = useTheme();
  const router = useRouter();
  const styles = createStyles(theme);
  
  // State pentru planul selectat
  const [selectedPlan, setSelectedPlan] = useState<string>('yearly');
  
  // Planurile de abonament
  const plans: SubscriptionPlan[] = [
    {
      id: 'monthly',
      title: 'Monthly',
      price: '$9.99',
      period: 'month',
      features: [
        'Personal recovery plan',
        'Daily motivational content',
        'Progress tracking',
        'Community support',
      ],
      popular: false,
    },
    {
      id: 'yearly',
      title: 'Yearly',
      price: '$59.99',
      period: 'year',
      features: [
        'All monthly features',
        'Advanced analytics',
        'Personal accountability coach',
        'Exclusive premium content',
        'Offline access',
      ],
      popular: true,
      savings: 'Save 50%',
    },
  ];
  
  // Handler pentru selectarea unui plan
  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId);
  };
  
  // Handler pentru continuarea spre aplicație cu planul selectat
  const handleContinue = () => {
    // Aici ar trebui să procesezi abonamentul
    // Pentru acum, doar navigăm spre aplicație
    if (onComplete) {
      onComplete();
    } else {
      router.replace('/(tabs)');
    }
  };
  
  // Handler pentru skip (doar în development)
  const handleSkip = () => {
    // Navigăm direct spre aplicație fără procesarea abonamentului
    router.replace('/(tabs)');
  };

  // Adăugăm un buton de back
  const handleBackPress = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      {/* Buton Back */}
      <View style={styles.headerContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBackPress}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(600).delay(100)}>
          <Text style={styles.title}>Accelerate Your Recovery</Text>
          
          <Text style={styles.subtitle}>
            Choose a plan that fits your journey to a porn-free life
          </Text>
        </Animated.View>
        
        <Animated.View entering={FadeInDown.duration(600).delay(200)} style={styles.bannerContainer}>
          <View style={styles.banner}>
            <Ionicons name="rocket" size={36} color="white" style={styles.bannerIcon} />
            <View style={styles.bannerTextContainer}>
              <Text style={styles.bannerTitle}>Premium Features</Text>
              <Text style={styles.bannerSubtitle}>For serious recovery progress</Text>
            </View>
          </View>
        </Animated.View>
        
        <View style={styles.plansContainer}>
          {plans.map((plan, index) => (
            <Animated.View 
              key={plan.id} 
              entering={FadeInDown.duration(500).delay(300 + index * 100)}
              style={styles.planWrapper}
            >
              <TouchableOpacity
                style={[
                  styles.planCard,
                  selectedPlan === plan.id && styles.selectedPlan,
                  plan.popular && styles.popularPlan,
                ]}
                onPress={() => handleSelectPlan(plan.id)}
                activeOpacity={0.8}
              >
                {plan.popular && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularBadgeText}>Most Popular</Text>
                  </View>
                )}
                
                <View style={styles.planHeader}>
                  <Text style={styles.planTitle}>{plan.title}</Text>
                  <View style={styles.priceContainer}>
                    <Text style={styles.planPrice}>{plan.price}</Text>
                    <Text style={styles.planPeriod}>/{plan.period}</Text>
                  </View>
                  {plan.savings && (
                    <View style={styles.savingsBadge}>
                      <Text style={styles.savingsText}>{plan.savings}</Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.featuresContainer}>
                  {plan.features.map((feature, featureIndex) => (
                    <View key={featureIndex} style={styles.featureItem}>
                      <Ionicons 
                        name="checkmark-circle" 
                        size={20} 
                        color={theme.colors.primary} 
                        style={styles.featureIcon} 
                      />
                      <Text style={styles.featureText}>{feature}</Text>
                    </View>
                  ))}
                </View>
                
                <View style={styles.selectionIndicator}>
                  <View style={[
                    styles.radioOuter,
                    selectedPlan === plan.id && styles.radioOuterSelected
                  ]}>
                    {selectedPlan === plan.id && (
                      <View style={styles.radioInner} />
                    )}
                  </View>
                  <Text style={[
                    styles.selectText,
                    selectedPlan === plan.id && styles.selectTextSelected
                  ]}>
                    {selectedPlan === plan.id ? 'Selected' : 'Select Plan'}
                  </Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>
        
        <Animated.View entering={FadeInDown.duration(500).delay(500)} style={styles.actionContainer}>
          <TouchableOpacity 
            style={styles.continueButton}
            onPress={handleContinue}
            activeOpacity={0.8}
          >
            <Text style={styles.continueButtonText}>Continue with {selectedPlan === 'monthly' ? 'Monthly' : 'Annual'} Plan</Text>
          </TouchableOpacity>
          
          {/* Skip button (only for development) */}
          <TouchableOpacity 
            style={styles.skipButton}
            onPress={handleSkip}
          >
            <Text style={styles.skipButtonText}>Skip for now</Text>
          </TouchableOpacity>
          
          <Text style={styles.termsText}>
            By continuing, you agree to our Terms of Service and Privacy Policy. 
            You can cancel your subscription anytime.
          </Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.light,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
    paddingTop: 0,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  bannerContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  banner: {
    width: '100%',
    height: 100,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.medium,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    ...theme.shadows.medium,
  },
  bannerIcon: {
    marginRight: 16,
  },
  bannerTextContainer: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  plansContainer: {
    marginBottom: 24,
  },
  planWrapper: {
    marginBottom: 16,
  },
  planCard: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.medium,
    padding: 16,
    ...theme.shadows.medium,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    position: 'relative',
    overflow: 'hidden',
  },
  selectedPlan: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.cardInteractive,
  },
  popularPlan: {
    borderColor: theme.colors.primary,
  },
  popularBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderBottomLeftRadius: theme.borderRadius.medium,
  },
  popularBadgeText: {
    color: theme.colors.cardBackground,
    fontSize: 12,
    fontWeight: '600',
  },
  planHeader: {
    marginBottom: 16,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  planPrice: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  planPeriod: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginLeft: 2,
  },
  savingsBadge: {
    backgroundColor: '#4CAF50',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.small,
    marginTop: 8,
  },
  savingsText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  featuresContainer: {
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureIcon: {
    marginRight: 8,
  },
  featureText: {
    fontSize: 14,
    color: theme.colors.textPrimary,
  },
  selectionIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: theme.colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  radioOuterSelected: {
    borderColor: theme.colors.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.primary,
  },
  selectText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  selectTextSelected: {
    color: theme.colors.primary,
    fontWeight: '500',
  },
  actionContainer: {
    marginTop: 8,
  },
  continueButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.medium,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.medium,
    marginBottom: 12,
  },
  continueButtonText: {
    color: theme.colors.cardBackground,
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  skipButtonText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  termsText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default SubscriptionScreen; 