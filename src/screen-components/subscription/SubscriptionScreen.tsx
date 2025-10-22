import React from 'react';
import { StyleSheet, View, ScrollView, ImageBackground, Text, Image, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/src/context/ThemeProvider';
import FreeJourneyContent from './FreeJourneyContent';
import PaywallTest from './PaywallTest';

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
  
  // Citește numele personalizat
  const [name, setName] = React.useState<string>('User');
  React.useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('signup.personalName');
        if (stored && stored.trim().length > 0) setName(stored.trim());
      } catch {}
    })();
  }, []);

  const targetDateStr = React.useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 90);
    try {
      // Force English and short month, day-first order: e.g., 17 Jan 2025
      const fmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      return fmt.format(d);
    } catch {
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    }
  }, []);

  return (
    <ImageBackground 
      source={require('@/assets/images/star_background.png')}
      style={styles.backgroundImage}
      resizeMode="cover"
      imageStyle={styles.backgroundImageStyle}
    >
      <StatusBar style="light" />
      
      <View style={styles.container}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Check + titlu personalizat */}
          <Animated.View entering={FadeInDown.duration(500).delay(80)} style={styles.heroContainer}>
            <View style={styles.checkBadge}>
              <Ionicons name="checkmark" size={28} color="#10B981" />
            </View>
            <Text style={styles.heroTitle}>{name}, we&apos;ve made you a custom plan</Text>
          </Animated.View>

          {/* Goal date */}
          <Animated.View entering={FadeInDown.duration(500).delay(120)} style={styles.goalContainer}>
            <Text style={styles.greySubtitle}>You will quit porn by:</Text>
            <View style={styles.datePill}>
              <Text style={styles.datePillText}>{targetDateStr}</Text>
            </View>
          </Animated.View>

          {/* Gradient free offer card */}
          <Animated.View entering={FadeInDown.duration(500).delay(160)} style={styles.gradientCardWrapper}>
            <LinearGradient
              colors={[
                'rgba(255, 255, 255, 0.22)',
                'rgba(255, 255, 255, 0.12)',
                'rgba(255, 255, 255, 0.0)'
              ]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.gradientCard}
            >
              <Text style={styles.offerTitle}>Free Offer</Text>
              <Text style={styles.offerSubtitle}>It may not be free tomorrow</Text>
            </LinearGradient>
          </Animated.View>

          {/* Divider + Laurel + Taglines */}
          <View style={styles.hr} />
          <View style={styles.laurelContainer}>
            <Image
              source={require('@/assets/images/laurel_5Star.png')}
              style={styles.laurelImage}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.tagline}>Become the best version of yourself with CraveOff.</Text>
          <Text style={styles.subTagline}>Emerge Stronger, Healthier, Happier</Text>
          
          {/* Free Journey Content */}
          <FreeJourneyContent onContinue={handleContinue} />

          {/* Test paywall (non-blocking) */}
          <Animated.View entering={FadeInDown.duration(500).delay(600)}>
            <PaywallTest onSubscribed={handleContinue} />
          </Animated.View>
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
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 60 + (insets.bottom || 0),
    paddingTop: 16,
  },
  heroContainer: {
    alignItems: 'center',
    marginBottom: 22,
    marginTop: Platform.OS === 'android' ? 26 : 6,
  },
  checkBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)'
  },
  heroTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: '700',
    marginTop: 12,
    textAlign: 'center',
  },
  goalContainer: {
    alignItems: 'center',
    marginBottom: 18,
  },
  greySubtitle: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 15,
    marginBottom: 10,
  },
  datePill: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    opacity: 0.95,
  },
  datePillText: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '700',
  },
  hr: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginVertical: 18,
  },
  laurelContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  laurelImage: {
    width: 280,
    height: 80,
  },
  tagline: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
  },
  subTagline: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 10,
  },
  gradientCardWrapper: {
    marginBottom: 20,
    marginTop: Platform.OS === 'android' ? 14 : 6,
  },
  gradientCard: {
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)'
  },
  offerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 6,
  },
  offerSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default SubscriptionScreen; 