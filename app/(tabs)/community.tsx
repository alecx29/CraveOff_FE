import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Linking } from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';

import { useTheme } from '@/src/context/ThemeProvider';
import GradientBackground from '@/src/screen-components/gradient-background/GradientBackground';

export default function CommunityScreen() {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const openReddit = () => {
    Linking.openURL('https://www.reddit.com/r/CraveOff/');
  };

  return (
    <GradientBackground>
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Community</Text>
        
        {/* Hero Section */}
        <View style={styles.heroCard}>
          <Image 
            source={require('@/assets/images/logo.png')} 
            style={styles.heroImage}
            resizeMode="contain"
          />
          <Text style={styles.heroTitle}>You're Not Alone</Text>
          <Text style={styles.heroText}>
            Thousands of people are on the same journey as you. Share experiences, find accountability partners, and get support from a community that understands.
          </Text>
        </View>
        
        {/* Reddit Community Card */}
        <View style={styles.redditCard}>
          <View style={styles.redditHeader}>
            <View style={styles.redditIconContainer}>
              <FontAwesome name="reddit-alien" size={32} color="#FF4500" />
            </View>
            <View style={styles.redditTitleContainer}>
              <Text style={styles.redditTitle}>r/CraveOff</Text>
              <Text style={styles.redditMembers}>5.2k members • Private community</Text>
            </View>
          </View>
          
          <Text style={styles.redditDescription}>
            Join our private Reddit community where you can share your journey, ask questions, and get support from people who understand what you're going through.
          </Text>
          
          <View style={styles.benefitsContainer}>
            <View style={styles.benefitItem}>
              <Ionicons name="shield-checkmark-outline" size={22} color="rgb(255, 69, 0)" />
              <Text style={styles.benefitText}>Private & Anonymous</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="people-outline" size={22} color="rgb(255, 69, 0)" />
              <Text style={styles.benefitText}>Supportive Members</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="trophy-outline" size={22} color="rgb(255, 69, 0)" />
              <Text style={styles.benefitText}>Success Stories</Text>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.redditButton} 
            onPress={openReddit}
            activeOpacity={0.8}
          >
            <FontAwesome name="reddit" size={24} color="#FFFFFF" />
            <Text style={styles.redditButtonText}>Join r/CraveOff</Text>
          </TouchableOpacity>
        </View>
        
        {/* Community Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>Community Tips</Text>
          
          <View style={styles.tipItem}>
            <View style={styles.tipNumber}>
              <Text style={styles.tipNumberText}>1</Text>
            </View>
            <View style={styles.tipContent}>
              <Text style={styles.tipContentTitle}>Introduce Yourself</Text>
              <Text style={styles.tipContentText}>Start by sharing your story and goals with the community.</Text>
            </View>
          </View>
          
          <View style={styles.tipItem}>
            <View style={styles.tipNumber}>
              <Text style={styles.tipNumberText}>2</Text>
            </View>
            <View style={styles.tipContent}>
              <Text style={styles.tipContentTitle}>Be Respectful</Text>
              <Text style={styles.tipContentText}>Everyone is at different stages in their journey. Be kind and supportive.</Text>
            </View>
          </View>
          
          <View style={styles.tipItem}>
            <View style={styles.tipNumber}>
              <Text style={styles.tipNumberText}>3</Text>
            </View>
            <View style={styles.tipContent}>
              <Text style={styles.tipContentTitle}>Share Your Progress</Text>
              <Text style={styles.tipContentText}>Celebrate wins and be honest about setbacks. The community is here to support you.</Text>
            </View>
          </View>
        </View>
        
        {/* Coming Soon Section */}
        <View style={styles.comingSoonCard}>
          <Text style={styles.comingSoonTitle}>Coming Soon</Text>
          <Text style={styles.comingSoonText}>
            We're working on more community features, including direct messaging, accountability partners, and live support groups.
          </Text>
          <View style={styles.comingSoonBadge}>
            <Text style={styles.comingSoonBadgeText}>Stay Tuned</Text>
          </View>
        </View>
      </ScrollView>
    </GradientBackground>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 16,
  },
  heroCard: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.large,
    padding: 24,
    marginBottom: 20,
    alignItems: 'center',
    ...theme.shadows.medium,
  },
  heroImage: {
    width: 150,
    height: 100,
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  heroText: {
    fontSize: 15,
    color: 'rgb(156, 163, 175)',
    textAlign: 'center',
    lineHeight: 22,
  },
  redditCard: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.medium,
    padding: 20,
    marginBottom: 20,
    ...theme.shadows.light,
  },
  redditHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  redditIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    ...theme.shadows.light,
  },
  redditTitleContainer: {
    flex: 1,
  },
  redditTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  redditMembers: {
    fontSize: 13,
    color: theme.colors.textMuted,
  },
  redditDescription: {
    fontSize: 15,
    color: 'rgb(156, 163, 175)',
    lineHeight: 22,
    marginBottom: 18,
  },
  benefitsContainer: {
    marginBottom: 20,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  benefitText: {
    fontSize: 15,
    color: theme.colors.textPrimary,
    marginLeft: 10,
  },
  redditButton: {
    backgroundColor: '#FF4500',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.medium,
    paddingVertical: 14,
    paddingHorizontal: 20,
    ...theme.shadows.light,
  },
  redditButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  tipsCard: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.medium,
    padding: 20,
    marginBottom: 20,
    ...theme.shadows.light,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 16,
  },
  tipItem: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  tipNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  tipNumberText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  tipContent: {
    flex: 1,
  },
  tipContentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  tipContentText: {
    fontSize: 14,
    color: 'rgb(156, 163, 175)',
    lineHeight: 20,
  },
  comingSoonCard: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.medium,
    padding: 20,
    marginBottom: 40,
    alignItems: 'center',
    ...theme.shadows.light,
  },
  comingSoonTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 12,
  },
  comingSoonText: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  comingSoonBadge: {
    backgroundColor: theme.colors.cardInteractive,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.small,
  },
  comingSoonBadgeText: {
    fontSize: 13,
    color: theme.colors.textPrimary,
    fontWeight: '500',
  },
}); 