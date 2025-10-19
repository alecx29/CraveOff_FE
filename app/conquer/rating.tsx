import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, Text, TouchableOpacity, Platform, Image, Dimensions, ScrollView, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/src/context/ThemeProvider';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LottieUniversal from '@/src/components/LottieUniversal';
import Constants from 'expo-constants';

export default function ConquerRating() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const styles = createStyles(insets);
  const colorsMap = theme.colors as Record<string, string>;
  const topPurple = colorsMap['primaryDark'] ?? colorsMap['primary'];

  // Safely load store review only if native module exists in the binary
  const getStoreReview = async (): Promise<any | null> => {
    try {
      const g: any = globalThis as any;
      const hasNative = !!(g?.ExpoModules?.ExpoStoreReview) || !!(g?.NativeModules?.ExpoStoreReview);
      if (!hasNative) return null;
      const mod = await import('expo-store-review');
      return mod;
    } catch {
      return null;
    }
  };

  const handleNext = () => {
    router.push('/conquer/commitment');
  };

  React.useEffect(() => {
    const promptForReview = async () => {
      try {
        // Dynamic import guarded to avoid TS resolution error when module not installed
        await new Promise(res => setTimeout(res, 1600)); // 1.6s polite delay
        const StoreReview = await getStoreReview();
        if (StoreReview && (await StoreReview.isAvailableAsync())) {
          await StoreReview.requestReview();
          return;
        }
      } catch {}

      // Fallback: open store listing
      try {
        await openStoreListing();
      } catch {}
    };

    promptForReview();
  }, []);

  const openStoreManually = async () => {
    try {
      await new Promise(res => setTimeout(res, 300)); // tiny UX delay
      const StoreReview = await getStoreReview();
      if (StoreReview && (await StoreReview.isAvailableAsync())) {
        await StoreReview.requestReview();
        return;
      }
    } catch {}

    await openStoreListing();
  };

  const openStoreListing = async () => {
    try {
      if (Platform.OS === 'android') {
        const pkg = ((Constants as any).expoConfig?.android?.package) || 'com.usualsuspect29.craveoffapp';
        // Try to open Play review composer directly when possible
        const marketUrl = `market://details?id=${pkg}&reviewId=0`;
        const webUrl = `https://play.google.com/store/apps/details?id=${pkg}&reviewId=0`;
        try {
          const supported = await Linking.canOpenURL(marketUrl);
          if (supported) {
            await Linking.openURL(marketUrl);
            return;
          }
        } catch {}
        await Linking.openURL(webUrl);
      } else if (Platform.OS === 'ios') {
        const appId = ((Constants as any).expoConfig?.extra?.iosAppStoreId) || '';
        if (appId) {
          // Use apps.apple.com for modern deep links
          const url = `itms-apps://apps.apple.com/app/id${appId}?action=write-review`;
          try {
            await Linking.openURL(url);
            return;
          } catch {}
          await Linking.openURL(`https://apps.apple.com/app/id${appId}`);
        } else {
          // Fallback search if appId is not set
          await Linking.openURL('https://apps.apple.com/search?term=CraveOff');
        }
      }
    } catch {}
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient 
        colors={[topPurple || '#4f46e5', '#2a2654', '#0f0f17', '#000000']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Confetti overlay on top portion */}
      <View style={styles.confettiContainer} pointerEvents="none">
        <LottieUniversal
          source={require('@/assets/images/Confetti.json')}
          autoPlay
          loop
          resizeMode="cover"
          style={styles.confetti}
        />
      </View>

      <View style={[styles.backButtonContainer]}> 
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={22} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
      <View style={styles.contentWrapper}>
        <Text style={styles.title}>Give us a rating</Text>
        <Image
          source={require('@/assets/images/laurel_5Star.png')}
          style={styles.laurelImage}
          resizeMode="contain"
        />
        <Text style={styles.subtitle}><Text style={styles.subtitleBold}>This app was designed for people like you.</Text></Text>
        <View style={styles.avatarsRow}>
          <Image source={require('@/assets/images/human0.jpg')} style={styles.avatar} />
          <Image source={require('@/assets/images/human2.jpg')} style={[styles.avatar, styles.avatarSpacing]} />
          <Image source={require('@/assets/images/human3.jpg')} style={styles.avatar} />
          <Text style={styles.communityText}>Meet Your new Comunity!</Text>
          <LottieUniversal
            source={require('@/assets/images/Winner Badge.json')}
            autoPlay
            loop={false}
            resizeMode="cover"
            style={styles.winnerBadge}
          />
        </View>

        {/* Review widget styled like home cards */}
        <View style={styles.reviewCard}>
          <LinearGradient
            colors={['rgba(76, 62, 98, 0.25)', 'rgba(76, 62, 98, 0.38)']}
            style={styles.reviewGradient}
          >
            <View style={styles.reviewTopRow}>
              <View style={styles.reviewUser}>
                <Image source={require('@/assets/images/human0.jpg')} style={styles.reviewAvatar} />
                <View>
                  <Text style={styles.reviewName}>Michael S.</Text>
                  <Text style={styles.reviewHandle}>@Michaels</Text>
                </View>
              </View>
              <View style={styles.reviewStars}>
                {[0,1,2,3,4].map((_, idx) => (
                  <Ionicons key={idx} name="star" size={14} color="#FFD700" style={styles.starIcon} />
                ))}
              </View>
            </View>
            <Text style={styles.reviewText}>
              &quot;Great app, helped me stay consistent and focused. I check in every day and it keeps me accountable.&quot;
            </Text>
            <Text style={styles.reviewTimestamp}>Aug 2025</Text>
          </LinearGradient>
        </View>

        {/* Second review widget using human2.jpg */}
        <View style={styles.reviewCard}>
          <LinearGradient
            colors={['rgba(76, 62, 98, 0.25)', 'rgba(76, 62, 98, 0.38)']}
            style={styles.reviewGradient}
          >
            <View style={styles.reviewTopRow}>
              <View style={styles.reviewUser}>
                <Image source={require('@/assets/images/human2.jpg')} style={styles.reviewAvatar} />
                <View>
                  <Text style={styles.reviewName}>Laura M.</Text>
                  <Text style={styles.reviewHandle}>@lauram</Text>
                </View>
              </View>
              <View style={styles.reviewStars}>
                {[0,1,2,3,4].map((_, idx) => (
                  <Ionicons key={idx} name="star" size={14} color="#FFD700" style={styles.starIcon} />
                ))}
              </View>
            </View>
            <Text style={styles.reviewText}>
              &quot;I feel supported by this community. Reading others&apos; stories and writing mine really changed my routine.&quot;
            </Text>
            <Text style={styles.reviewTimestamp}>Oct 2025</Text>
          </LinearGradient>
        </View>

        {/* Third review widget using human3.jpg */}
        <View style={styles.reviewCard}>
          <LinearGradient
            colors={['rgba(76, 62, 98, 0.25)', 'rgba(76, 62, 98, 0.38)']}
            style={styles.reviewGradient}
          >
            <View style={styles.reviewTopRow}>
              <View style={styles.reviewUser}>
                <Image source={require('@/assets/images/human3.jpg')} style={styles.reviewAvatar} />
                <View>
                  <Text style={styles.reviewName}>Robert K.</Text>
                  <Text style={styles.reviewHandle}>@robertk</Text>
                </View>
              </View>
              <View style={styles.reviewStars}>
                {[0,1,2,3,4].map((_, idx) => (
                  <Ionicons key={idx} name="star" size={14} color="#FFD700" style={styles.starIcon} />
                ))}
              </View>
            </View>
            <Text style={styles.reviewText}>
              &quot;The daily tools and reminders are exactly what I needed. After two weeks I already feel more in control.&quot;
            </Text>
            <Text style={styles.reviewTimestamp}>1w ago</Text>
          </LinearGradient>
        </View>
      </View>
      </ScrollView>

      <View style={styles.bottomContainer}>
        <TouchableOpacity 
          style={styles.nextButton}
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.rateButton}
          onPress={openStoreManually}
          activeOpacity={0.8}
        >
          <Ionicons name="star" size={16} color="#FFD700" />
          <Text style={styles.rateButtonText}>Rate CraveOff</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const { width, height } = Dimensions.get('window');

const createStyles = (insets: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Platform.OS === 'ios' ? 'transparent' : '#0B0A10',
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: Math.min(Math.round(height * 0.42), 420),
  },
  confetti: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    opacity: 0.9,
  },
  winnerBadge: {
    width: 30,
    height: 30,
    marginLeft: 0,
    alignSelf: 'center',
    opacity: 0.9,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 140 + insets.bottom,
  },
  contentWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: insets.top + 20,
    paddingHorizontal: 24,
  },
  backButtonContainer: {
    position: 'absolute',
    top: insets.top + 8,
    left: 12,
    zIndex: 3,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)'
  },
  title: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  laurelImage: {
    width: Math.min(width * 0.85, 360),
    height: Math.min(width * 0.48, 200),
    marginBottom: 0,
  },
  subtitle: {
    color: '#ffffff',
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.95,
    marginBottom: 12,
  },
  subtitleBold: {
    fontWeight: 'bold',
  },
  avatarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  avatar: {
    width: 20,
    height: 20,
    borderRadius: 20,
    borderWidth: 0,
  },
  avatarSpacing: {
    marginHorizontal: 2,
  },
  communityText: {
    color: '#ffffff',
    fontSize: 14,
    textAlign: 'left',
    marginLeft: 10,
    marginBottom: 0,
    opacity: 0.95,
    alignSelf: 'center',
    lineHeight: 20,
    textAlignVertical: 'center',
  },
  reviewCard: {
    width: '100%',
    marginTop: 18,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)'
  },
  reviewGradient: {
    padding: 16,
    borderRadius: 12,
  },
  reviewTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  reviewUser: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
  },
  reviewName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  reviewHandle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  reviewStars: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  starIcon: {
    marginRight: 4,
  },
  reviewText: {
    color: '#ffffff',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 6,
  },
  reviewTimestamp: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
  },
  reviewAuthor: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    textAlign: 'right',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    backgroundColor: '#000000',
    paddingTop: 12,
    paddingBottom: 8 + insets.bottom,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    zIndex: 4,
  },
  nextButton: {
    backgroundColor: '#ffffff',
    borderRadius: 30,
    height: 52,
    paddingHorizontal: 30,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  nextButtonText: {
    color: '#6366f1',
    fontSize: 16,
    fontWeight: 'bold',
  },
  rateButton: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rateButtonText: {
    color: '#FFD700',
    fontSize: 14,
    marginLeft: 6,
  },
});


