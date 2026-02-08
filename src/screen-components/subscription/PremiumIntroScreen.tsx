import React from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image as ExpoImage } from 'expo-image';

import { AuthContext } from '@/src/context/AuthContext';
import { runSignupCompleteFlow } from '@/src/screen-components/subscription/FreeJourneyContent';
export default function PremiumIntroScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signIn } = React.useContext(AuthContext);
  const [step, setStep] = React.useState<0 | 1>(0);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const goNext = async () => {
    if (step === 0) {
      setStep(1);
      return;
    }
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await runSignupCompleteFlow({
        signIn,
        onSuccess: () => router.replace('/(tabs)'),
        onRequireLogin: () => router.replace('/login'),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.root}>
      <ExpoImage
        source={require('@/assets/images/afterPay1.png')}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        transition={0}
      />
      <View style={[styles.content, { paddingTop: Math.max(insets.top + 12, 28), paddingBottom: Math.max(insets.bottom + 16, 28) }]}>
        <Image source={require('@/assets/images/logo.png')} style={styles.logo} resizeMode="contain" />

        <View style={styles.middle}>
          {step === 0 ? (
            <>
              {/* <Image
                source={require('@/assets/images/phone-home.png')}
                style={styles.heroImage}
                resizeMode="contain"
              /> */}
              <Text style={styles.title}>Welcome to CraveOff</Text>
              <Text style={styles.subtitle}>
                See your entire progress and use the Panic Button whenever you feel like giving up.
              </Text>
            </>
          ) : (
            <>
              <Image
                source={require('@/assets/images/phone-comunity-cut1.png')}
                style={styles.heroImage}
                resizeMode="contain"
              />
              <Text style={styles.title}>Get help from others</Text>
              <Text style={styles.subtitle}>
                Post in forum and get help from others on same journey.
              </Text>
            </>
          )}

          <View style={styles.dots}>
            <View style={[styles.dot, step === 0 ? styles.dotActive : styles.dotInactive]} />
            <View style={[styles.dot, step === 1 ? styles.dotActive : styles.dotInactive]} />
          </View>
        </View>

        <View style={styles.bottom}>
          <TouchableOpacity style={styles.cta} activeOpacity={0.85} onPress={goNext} disabled={isSubmitting}>
            {isSubmitting ? (
              <ActivityIndicator color="#111827" />
            ) : (
              <Text style={styles.ctaText}>{step === 0 ? 'Next' : 'Start'}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  logo: {
    width: 170,
    height: 70,
    marginBottom: 18,
  },
  middle: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
  },
  heroImage: {
    width: '100%',
    maxWidth: 420,
    height: 220,
    marginBottom: 14,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 15,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  dots: {
    marginTop: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 14,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    backgroundColor: '#fff',
    opacity: 0.95,
  },
  dotInactive: {
    backgroundColor: '#fff',
    opacity: 0.35,
  },
  bottom: {
    width: '100%',
    maxWidth: 420,
  },
  cta: {
    backgroundColor: '#ffffff',
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '800',
  },
});

