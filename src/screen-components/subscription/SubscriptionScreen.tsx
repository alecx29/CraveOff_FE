import React from 'react';
import { StyleSheet, View, ScrollView, ImageBackground, Text, Image, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LottieView from 'lottie-react-native';
import * as Updates from 'expo-updates';

import { useTheme } from '@/src/context/ThemeProvider';
import FreeJourneyContent from './FreeJourneyContent';
import PaywallTest from './PaywallTest';
import { apiClient } from '@/src/axios/apiClient';
import { BackendRoutes } from '@/src/axios/backendRoutes';
import { saveAuthFlags } from '@/src/Storage/authFlagsStorage';

interface SubscriptionScreenProps {
  onComplete?: () => void;
}

const SubscriptionScreen = ({ onComplete }: SubscriptionScreenProps) => {
  const { theme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const styles = createStyles(theme, insets);

  // TEMP: Always show the test paywall (needed for internal rollout builds too).
  // TODO: Gate this again before a public release (e.g. with an env/config flag).
  const showPaywall = true;

  // Mark paywall reached when this screen mounts (idempotent backend)
  React.useEffect(() => {
    (async () => {
      try {
        await apiClient.post(BackendRoutes.PAYWALL_REACHED);
        // Persist locally so relaunch / interceptors can decide routing without waiting on network.
        await saveAuthFlags({ reached_paywall: true });
      } catch {
        // non-blocking
      }
    })();
  }, []);

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
          <View style={styles.lottieWrapper}>
            <LottieView
              source={require('@/assets/images/MeditationGuy.json')}
              autoPlay
              loop
              style={styles.lottie}
            />
          </View>
          <Text style={styles.conquerText}>Conquer Yourself</Text>
          <View style={styles.bulletList}>
            <View style={styles.bulletRow}>
              <View style={[styles.bulletBadge, { backgroundColor: '#2563EB' }]}>
                <Ionicons name="lock-closed" size={16} color="#ffffff" />
              </View>
              <Text style={styles.bulletText}>Build unbreakable self control</Text>
            </View>
            <View style={styles.bulletRow}>
              <View style={[styles.bulletBadge, { backgroundColor: '#8B5CF6' }]}>
                <Ionicons name="person" size={16} color="#ffffff" />
              </View>
              <Text style={styles.bulletText}>Become more attractive and confident</Text>
            </View>
            <View style={styles.bulletRow}>
              <View style={[styles.bulletBadge, { backgroundColor: '#22C55E' }]}>
                <Ionicons name="leaf" size={16} color="#ffffff" />
              </View>
              <Text style={styles.bulletText}>Boost your self worth</Text>
            </View>
            <View style={styles.bulletRow}>
              <View style={[styles.bulletBadge, { backgroundColor: '#FACC15' }]}>
                <Ionicons name="happy" size={16} color="#0F172A" />
              </View>
              <Text style={styles.bulletText}>Fill each day with pride and happiness</Text>
            </View>
          </View>
          <Image
            source={require('@/assets/images/5star.png')}
            style={styles.starsImage}
            resizeMode="contain"
          />
          <Text style={styles.quoteText}>
            “All this time my social anxiety was just because I was secretly ashamed of my porn problem. I never want to feel that small again.”
          </Text>
          <Text style={styles.quoteAuthor}>Anonymous</Text>
          <View style={styles.hr} />
          <View style={styles.lottieWrapper}>
            <LottieView
              source={require('@/assets/images/Hero.json')}
              autoPlay
              loop
              style={styles.heroLottie}
            />
          </View>
          <Text style={styles.takeBackText}>Take back control</Text>
        <View style={styles.bulletList}>
          <View style={styles.bulletRow}>
            <View style={[styles.bulletBadge, { backgroundColor: '#2563EB' }]}>
              <Ionicons name="refresh" size={16} color="#ffffff" />
            </View>
            <Text style={styles.bulletText}>Learn to redirect harmful cravings</Text>
          </View>
          <View style={styles.bulletRow}>
            <View style={[styles.bulletBadge, { backgroundColor: '#8B5CF6' }]}>
              <Ionicons name="rocket" size={16} color="#ffffff" />
            </View>
            <Text style={styles.bulletText}>Regain focus and motivation</Text>
          </View>
          <View style={styles.bulletRow}>
            <View style={[styles.bulletBadge, { backgroundColor: '#22C55E' }]}>
              <Ionicons name="heart" size={16} color="#ffffff" />
            </View>
            <Text style={styles.bulletText}>Find real joy and satisfaction in life</Text>
          </View>
        </View>
        <Image
          source={require('@/assets/images/5star.png')}
          style={styles.starsImage}
          resizeMode="contain"
        />
        <Text style={styles.quoteText}>
          “I had started to dread having sex with my girlfriend because I was so anxious all the time. But now our sex is so good it&apos;s made our relationship much stronger.”
        </Text>
        <Text style={styles.quoteAuthor}>Anonymous</Text>
        <View style={styles.hr} />
          
          {/* Free Journey Content */}
          <FreeJourneyContent onContinue={handleContinue} />

          {/* Subscription paywall (dev only) */}
          {showPaywall && (
            <Animated.View entering={FadeInDown.duration(500).delay(600)}>
              <PaywallTest onSubscribed={handleContinue} />
            </Animated.View>
          )}
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
    paddingBottom: 56 + (insets.bottom || 0),
    paddingTop: 16,
  },
  heroContainer: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: Platform.OS === 'android' ? 24 : 4,
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
    fontSize: 20,
    fontWeight: '700',
    marginTop: 12,
    textAlign: 'center',
  },
  goalContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  greySubtitle: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 12,
    marginBottom: 8,
  },
  datePill: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    opacity: 0.95,
  },
  datePillText: {
    color: '#111827',
    fontSize: 12,
    fontWeight: '700',
  },
  hr: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginVertical: 16,
    width: '70%',
    alignSelf: 'center',
  },
  laurelContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  laurelImage: {
    width: 360,
    height: 110,
  },
  tagline: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 8,
  },
  subTagline: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 12,
  },
  lottieWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 0,
  },
  lottie: {
    width: 180,
    height: 180,
  },
  heroLottie: {
    width: 224,
    height: 224,
  },
  conquerText: {
    color: 'white',
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
  },
  takeBackText: {
    color: 'white',
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 20,
  },
  bulletList: {
    marginBottom: 4,
    gap: 8,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bulletBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bulletText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  starsImage: {
    width: 190,
    height: 38,
    alignSelf: 'center',
    marginTop: 24,
  },
  quoteText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 16,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 26,
    paddingHorizontal: 12,
  },
  quoteAuthor: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
});

export default SubscriptionScreen; 