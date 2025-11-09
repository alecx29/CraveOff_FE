import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, ImageBackground, ActivityIndicator, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/src/context/ThemeProvider';
import { useLogs, LogEntry } from '@/src/context/LogsContext';
import { apiClient } from '@/src/axios/apiClient';
import { BackendRoutes } from '@/src/axios/backendRoutes';

interface DailyCheckInPopupProps {
  onDismiss: () => void;
}

const { height } = Dimensions.get('window');
// Reduce height percentage and slightly shorten on iOS for better fit
const POPUP_HEIGHT = Platform.OS === 'ios'
  ? Math.min(520, height * 0.66)
  : Math.min(560, height * 0.70); // Increase height to give more space for mood step

// Define a variable for smaller screens
const IS_SMALL_SCREEN = height < 700; // Nexus 5 is around 640px height

const DailyCheckInPopup: React.FC<DailyCheckInPopupProps> = ({ onDismiss }) => {
  const { theme } = useTheme();
  const { addLog, isLoading } = useLogs();
  const [buttonDisabled, setButtonDisabled] = useState(false);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [step, setStep] = useState<'checkin' | 'mood' | 'summary'>('checkin');
  const [selectedClean, setSelectedClean] = useState<boolean | null>(null);
  const [selectedMood, setSelectedMood] = useState<'good' | 'meh' | 'bad' | null>(null);
  const [moodStats, setMoodStats] = useState<{
    counts: { good: number; meh: number; bad: number };
    total: number;
    percentages: { good: number; meh: number; bad: number };
    still_going?: number;
    last_updated?: string;
  } | null>(null);
  const [moodLoading, setMoodLoading] = useState(false);
  
  // Adjust for bottom safe area to ensure buttons are accessible
  const bottomPadding = Math.max(insets.bottom, 20);
  
  const slideAnim = useRef(new Animated.Value(POPUP_HEIGHT)).current;
  
  useEffect(() => {
    // Slide up from bottom: animate translateY from POPUP_HEIGHT to 0
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [slideAnim]);

  // Fetch mood stats when the modal opens so we can show "still_going" on the first step
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    fetchMoodStats(today);
  }, []);
  
  const handleDismiss = () => {
    // Slide down animation when dismissing
    Animated.timing(slideAnim, {
      toValue: POPUP_HEIGHT,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onDismiss();
    });
  };
  
  const fetchMoodStats = async (dateStr: string) => {
    setMoodLoading(true);
    try {
      const response = await apiClient.get(BackendRoutes.MOOD_STATS, { params: { date: dateStr } });
      if (response?.data) {
        setMoodStats(response.data);
      } else {
        setMoodStats(null);
      }
    } catch (e) {
      console.error('Failed to fetch mood stats:', e);
      setMoodStats(null);
    } finally {
      setMoodLoading(false);
    }
  };

  const handleResponse = async (isClean: boolean) => {
    if (buttonDisabled || isLoading) return;
    setButtonDisabled(true);
    try {
      setSelectedClean(isClean);
      setStep('mood');
    } finally {
      setButtonDisabled(false);
    }
  };

  const handleMoodSelect = async (mood: 'good' | 'meh' | 'bad') => {
    if (isLoading || selectedClean === null) return;
    setSelectedMood(mood);
    setStep('summary');
    const today = new Date().toISOString().split('T')[0];
    const logEntry = {
      date: today,
      is_clean: selectedClean,
      mood,
    } as Omit<LogEntry, 'id'>;
    // Fire-and-forget; we keep the modal open on summary until user closes it
    addLog(logEntry).catch((error) => {
      console.error('Error adding log entry with mood:', error);
    });
  };

  const handleReflect = () => {
    handleDismiss();
    try {
      router.push('/(tabs)/journal');
    } catch (e) {
      console.error('Failed to navigate to journal:', e);
    }
  };
  
  const styles = createStyles(theme, bottomPadding);
  
  return (
    <View style={styles.container}>
      <Animated.View 
        style={[
          styles.popup,
          { bottom: insets.bottom, transform: [{ translateY: slideAnim }] }
        ]}
      >
        <ImageBackground 
          source={require('@/assets/images/star_background.png')}
          style={styles.backgroundImage}
          resizeMode="cover"
        >
          <View style={[styles.contentContainer, step === 'summary' && styles.contentContainerSummary]}>
            <View style={styles.handle} />
            
            {step === 'checkin' ? (
              <>
                <View style={styles.emojiContainer}>
                  <Text style={styles.emoji}>👀</Text>
                </View>
                <Text style={styles.title}>Did you relapse?{"\n"}Let the community know by checking in</Text>

                <View style={styles.stillGoingContainer}>
                  {moodLoading ? (
                    <View style={styles.statsLoadingRow}>
                      <ActivityIndicator color="#fff" />
                      <Text style={styles.statsLoadingText}>Loading today’s stats…</Text>
                    </View>
                  ) : moodStats && typeof moodStats.still_going === 'number' ? (
                    <View style={styles.stillGoingBlock}>
                      <Text style={styles.stillGoingNumber}>{moodStats.still_going}</Text>
                      <Text style={styles.stillGoingLabel}>still going strong today</Text>
                    </View>
                  ) : null}
                </View>
                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    style={[styles.button, styles.panicSize, styles.successButton]}
                    onPress={() => handleResponse(true)}
                    disabled={buttonDisabled || isLoading}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.buttonText, styles.buttonTextTrailing]}>No, still going strong</Text>
                    <Text style={styles.buttonEmoji}>💪</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.button, styles.panicSize, styles.dangerButton]}
                    onPress={() => handleResponse(false)}
                    disabled={buttonDisabled || isLoading}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="fitness" size={24} color="white" />
                    <Text style={styles.buttonText}>Yes, I relapsed</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : step === 'mood' ? (
              <>
                <View style={styles.moodTop}>
                  <ScrollView
                    contentContainerStyle={styles.moodTopContent}
                    showsVerticalScrollIndicator={false}
                  >
                    <View style={styles.emojiContainer}>
                      <Text style={styles.emoji}>🧠</Text>
                    </View>
                    <Text style={styles.title}>How are you feeling today?</Text>
                  </ScrollView>
                </View>

                <View style={[styles.buttonContainer, styles.moodButtonContainer]}>
                  <TouchableOpacity
                    style={[styles.button, styles.buttonLarge, styles.successButton]}
                    onPress={() => handleMoodSelect('good')}
                    disabled={buttonDisabled || isLoading}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.moodEmoji}>😊</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.button, styles.buttonLarge, styles.mehButton]}
                    onPress={() => handleMoodSelect('meh')}
                    disabled={buttonDisabled || isLoading}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.moodEmoji}>😐</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.button, styles.buttonLarge, styles.dangerButton]}
                    onPress={() => handleMoodSelect('bad')}
                    disabled={buttonDisabled || isLoading}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.moodEmoji}>😞</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : step === 'summary' ? (
              <>
                <View style={styles.moodTop}>
                  <ScrollView
                    contentContainerStyle={styles.summaryTopContent}
                    showsVerticalScrollIndicator={false}
                  >
                    <Text style={[styles.title, styles.summaryTitle]}>CRAVEOFF believes in you</Text>
                    {(() => {
                      const baseCounts = moodStats?.counts || { good: 0, meh: 0, bad: 0 };
                      const computed = { ...baseCounts } as { good: number; meh: number; bad: number };
                      if (selectedMood) computed[selectedMood] = (computed[selectedMood] || 0) + 1;
                      return (
                        <View style={styles.summaryList}>
                          <View style={styles.summaryRow}>
                            <Text style={styles.summaryEmoji}>😊</Text>
                            <Text style={styles.summaryText}>{computed.good} others</Text>
                          </View>
                          <View style={styles.summaryRow}>
                            <Text style={styles.summaryEmoji}>😐</Text>
                            <Text style={styles.summaryText}>{computed.meh} others</Text>
                          </View>
                          <View style={styles.summaryRow}>
                            <Text style={styles.summaryEmoji}>😞</Text>
                            <Text style={styles.summaryText}>{computed.bad} others</Text>
                          </View>
                        </View>
                      );
                    })()}
                    <Text style={styles.summarySubText}>
                      The path is hard, but your strength is real. You’re not walking this journey alone.
                    </Text>
                  </ScrollView>
                </View>

                <View style={[styles.summaryActions, styles.summaryButtonContainer]}>
                  <TouchableOpacity
                    style={[styles.button, styles.panicSize, styles.reflectButton]}
                    onPress={handleReflect}
                    activeOpacity={0.9}
                  >
                    <Ionicons name="book-outline" size={20} color="#fff" />
                    <Text style={styles.buttonText}>Reflect</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleDismiss} activeOpacity={0.8}>
                    <Text style={styles.finishLink}>Finish</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : null}
          </View>
        </ImageBackground>
      </Animated.View>
    </View>
  );
};

// Adjust styles for small screens
const createStyles = (theme: any, bottomPadding: number) => StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000, // Ensure it's above all content including tabs
  },
  popup: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: POPUP_HEIGHT,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden', // Ensure the background image respects rounded corners
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 10,
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  contentContainer: {
    flex: 1,
    padding: IS_SMALL_SCREEN ? 16 : 20, // Smaller padding on small screens
    paddingBottom: bottomPadding, // Dynamic bottom padding based on safe area
    backgroundColor: 'rgba(0, 0, 0, 0.45)', // Semi-transparent overlay to ensure text is readable
  },
  contentContainerSummary: {
    paddingBottom: Math.max(bottomPadding - 12, 0),
  },
  handle: {
    width: 40,
    height: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: IS_SMALL_SCREEN ? 12 : 20, // Smaller margin on small screens
  },
  emojiContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: IS_SMALL_SCREEN ? 12 : 16,
  },
  emoji: {
    fontSize: IS_SMALL_SCREEN ? 40 : 46, // Smaller on small screens
    marginBottom: 6,
  },
  title: {
    fontSize: IS_SMALL_SCREEN ? 22 : 24, // Smaller on small screens
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: IS_SMALL_SCREEN ? 6 : 10,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    paddingBottom: 3,
  },
  question: {
    fontSize: IS_SMALL_SCREEN ? 14 : 16, // Smaller on small screens
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: IS_SMALL_SCREEN ? 20 : 30, // Smaller margin on small screens
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  buttonContainer: {
    gap: IS_SMALL_SCREEN ? 12 : 16, // Smaller gap on small screens
    marginTop: 'auto', // Push buttons to the bottom of the available space
    marginBottom: bottomPadding, // ensure safe spacing above the phone's bottom area
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: IS_SMALL_SCREEN ? 14 : 16, // Smaller padding on small screens
    paddingHorizontal: 24,
    borderRadius: 999,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    width: '100%',
  },
  buttonLarge: {
    paddingVertical: IS_SMALL_SCREEN ? 16 : 20,
  },
  panicSize: {
    paddingVertical: 16,
  },
  successButton: {
    backgroundColor: '#16A34A', // Modern emerald green
  },
  dangerButton: {
    backgroundColor: '#F44336', // Bright red color
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: IS_SMALL_SCREEN ? 16 : 18, // Smaller font on small screens
    marginLeft: 10,
  },
  buttonTextTrailing: {
    marginLeft: 0,
    marginRight: 10,
  },
  buttonEmoji: {
    fontSize: IS_SMALL_SCREEN ? 20 : 22,
  },
  moodEmoji: {
    fontSize: IS_SMALL_SCREEN ? 28 : 32,
  },
  mehButton: {
    backgroundColor: '#F59E0B',
  },
  statsContainer: {
    marginTop: IS_SMALL_SCREEN ? 8 : 12,
    marginBottom: IS_SMALL_SCREEN ? 12 : 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  statPill: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 999,
    alignItems: 'center',
  },
  statPillText: {
    color: 'white',
    fontWeight: '600',
    fontSize: IS_SMALL_SCREEN ? 12 : 14,
  },
  selectedPill: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  goodPill: {
    backgroundColor: 'rgba(22, 163, 74, 0.35)'
  },
  mehPill: {
    backgroundColor: 'rgba(145, 151, 174, 0.35)'
  },
  badPill: {
    backgroundColor: 'rgba(244, 67, 54, 0.35)'
  },
  statsLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statsLoadingText: {
    color: 'rgba(255,255,255,0.9)',
    marginLeft: 8,
  },
  statsErrorText: {
    color: '#FFB4A9',
  },
  statsMutedText: {
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
  },
  summaryList: {
    gap: 10,
    marginTop: IS_SMALL_SCREEN ? 8 : 12,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  summaryEmoji: {
    fontSize: IS_SMALL_SCREEN ? 30 : 30,
  },
  summaryText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: (IS_SMALL_SCREEN ? 18 : 20) + (Platform.OS === 'ios' ? 1 : 0),
    ...(Platform.OS === 'ios' ? { lineHeight: ((IS_SMALL_SCREEN ? 18 : 20) + 1 + 4) } : {}),
  },
  summarySubText: {
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    marginTop: IS_SMALL_SCREEN ? 10 : 14,
    fontSize: IS_SMALL_SCREEN ? 12 : 14,
    lineHeight: IS_SMALL_SCREEN ? 16 : 20,
  },
  stillGoingContainer: {
    marginTop: IS_SMALL_SCREEN ? 6 : 10,
    marginBottom: IS_SMALL_SCREEN ? 10 : 14,
    alignItems: 'center',
  },
  stillGoingBlock: {
    alignItems: 'center',
  },
  stillGoingNumber: {
    color: '#fff',
    fontWeight: '800',
    fontSize: IS_SMALL_SCREEN ? 36 : 44,
    lineHeight: IS_SMALL_SCREEN ? 40 : 48,
  },
  stillGoingLabel: {
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
    fontSize: IS_SMALL_SCREEN ? 14 : 16,
  },
  moodTop: {
    flex: 1,
  },
  moodTopContent: {
    paddingBottom: 8,
    flexGrow: 1,
  },
  summaryTopContent: {
    paddingBottom: 8,
    flexGrow: 1,
  },
  moodButtonContainer: {
    marginBottom: bottomPadding + 12,
  },
  summaryActions: {
    gap: 16,
    alignItems: 'center',
  },
  summaryButtonContainer: {
    marginBottom: Math.max(bottomPadding - 18, 0),
  },
  reflectButton: {
    backgroundColor: '#8B5CF6',
  },
  finishLink: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: IS_SMALL_SCREEN ? 18 : 20,
    paddingVertical: 6,
  },
  summaryTitle: {
    marginBottom: IS_SMALL_SCREEN ? 8 : 12,
  },
});

export default DailyCheckInPopup; 