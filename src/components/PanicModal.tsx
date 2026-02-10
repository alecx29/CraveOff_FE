import React, { useEffect, useState, useRef, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image,
  ScrollView,
  Platform,
  StatusBar,
  Linking,
  Animated as RNAnimated,
  Modal,
  Dimensions,
  AppState
} from 'react-native';
import { AntDesign, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { 
  FadeIn, 
  FadeOut, 
  SlideInUp, 
  SlideOutDown 
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Camera, CameraView, useCameraPermissions } from 'expo-camera';

import { useTheme } from '@/src/context/ThemeProvider';

interface PanicModalProps {
  visible: boolean;
  onClose: () => void;
  onRelapsed?: () => void;
  onPrevention?: () => void;
}

type SideEffectItem = {
  key: string;
  title: string;
  description: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
};

// Define motivational text sentences
const MOTIVATIONAL_TEXT = [
  "STOP.",
  "The urge will pass.",
  "You are stronger than this.",
  "Breathe...",
  "Hold the line.",
  "Victory is 5 minutes away."
];

const SIDE_EFFECTS: SideEffectItem[] = [
  {
    key: 'reduced-performance',
    title: 'REDUCED PERFORMANCE',
    description: 'Not feeling physically responsive',
    icon: 'chart-bar',
    color: '#d45555',
  },
  {
    key: 'desensitization',
    title: 'DESENSITIZATION',
    description: 'Needing more extreme content for arousal.',
    icon: 'eye-outline',
    color: '#d28a3f',
  },
  {
    key: 'relationship-issues',
    title: 'RELATIONSHIP ISSUES',
    description: 'Decreased intimacy and trust.',
    icon: 'heart-broken-outline',
    color: '#d35b7a',
  },
  {
    key: 'social-isolation',
    title: 'SOCIAL ISOLATION',
    description: 'Withdrawal from social interactions.',
    icon: 'account-off-outline',
    color: '#4a86e8',
  },
  {
    key: 'distorted-perceptions',
    title: 'DISTORTED PERCEPTIONS OF SEX',
    description: 'Unrealistic expectations in relationships.',
    icon: 'brain',
    color: '#a86bff',
  },
];

const PanicModal = ({ visible, onClose, onRelapsed, onPrevention }: PanicModalProps) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [displayedSentences, setDisplayedSentences] = useState<string[]>([]);
  const [typingText, setTypingText] = useState("");
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [cameraPermissionSnapshot, setCameraPermissionSnapshot] = useState<any>(null);
  const cursorOpacity = useRef(new RNAnimated.Value(1)).current;
  const timeoutRef = useRef<number | null>(null);
  const currentSentenceRef = useRef(0);
  const typingPositionRef = useRef(0);
  const hapticTimeoutRef = useRef<number | null>(null);
  const hapticPausedUntilRef = useRef<number>(0);
  const END_OF_CYCLE_PAUSE_MS = 1500;
  
  // Adjust for safe areas
  const bottomPadding = Math.max(insets.bottom, 20);
  const androidStatusBarHeight = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0;
  const topPadding = Math.max(insets.top, androidStatusBarHeight, 20);
  const [topOverlayHeight, setTopOverlayHeight] = useState<number>(0);
  const [bottomActionsHeight, setBottomActionsHeight] = useState<number>(0);
  const contentTopPadding = Math.max(topOverlayHeight, topPadding + 110);
  const permissionForRender = cameraPermissionSnapshot ?? cameraPermission ?? null;
  const cameraGranted = !!permissionForRender?.granted;
  
  // Get a typing delay with slight variation
  const getTypingDelay = useCallback(() => {
    return 40 + Math.random() * 30; // 40-70ms (faster typing)
  }, []);

  const pauseHapticsFor = useCallback((ms: number) => {
    const now = Date.now();
    hapticPausedUntilRef.current = Math.max(hapticPausedUntilRef.current || 0, now + ms);
  }, []);

  const refreshCameraPermission = useCallback(async () => {
    try {
      const current = await Camera.getCameraPermissionsAsync();
      setCameraPermissionSnapshot(current);
    } catch {
      setCameraPermissionSnapshot(cameraPermission ?? null);
    }
  }, [cameraPermission]);

  useEffect(() => {
    setCameraPermissionSnapshot(cameraPermission ?? null);
  }, [cameraPermission]);

  useEffect(() => {
    if (!visible) return;
    void refreshCameraPermission();
  }, [visible, refreshCameraPermission]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active' && visible) {
        void refreshCameraPermission();
      }
    });
    return () => subscription.remove();
  }, [visible, refreshCameraPermission]);
  
  // Function to trigger a haptic pattern: 3 x warning at 160ms, then 900ms pause, repeat
  const triggerHapticPattern = useCallback(() => {
    let count = 0;
    const doPattern = () => {
      if (!visible) return;
      const now = Date.now();
      const pausedUntil = hapticPausedUntilRef.current || 0;
      if (pausedUntil > now) {
        hapticTimeoutRef.current = setTimeout(doPattern, pausedUntil - now);
        return;
      }
      if (count < 3) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        count++;
        hapticTimeoutRef.current = setTimeout(doPattern, 300);
      } else {
        count = 0;
        hapticTimeoutRef.current = setTimeout(doPattern, 900);
      }
    };
    doPattern();
  }, [visible]);
  
  // Set up cursor blinking animation and start haptic pattern
  useEffect(() => {
    const blinkAnimation = RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(cursorOpacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true
        }),
        RNAnimated.timing(cursorOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true
        })
      ])
    );
    
    if (visible) {
      blinkAnimation.start();
      triggerHapticPattern();
    }
    
    return () => {
      blinkAnimation.stop();
      if (hapticTimeoutRef.current) {
        clearTimeout(hapticTimeoutRef.current);
        hapticTimeoutRef.current = null;
      }
    };
  }, [visible, cursorOpacity, triggerHapticPattern]);
  
  // Main typing function
  const typeNextCharacter = useCallback(() => {
    if (!visible) return;

    // Check if we've reached the end of all sentences
    if (currentSentenceRef.current >= MOTIVATIONAL_TEXT.length) {
      // Pause on the final state, then restart from the top
      pauseHapticsFor(END_OF_CYCLE_PAUSE_MS);
      timeoutRef.current = setTimeout(() => {
        if (!visible) return;
        currentSentenceRef.current = 0;
        typingPositionRef.current = 0;
        setDisplayedSentences([]);
        typeNextCharacter();
      }, END_OF_CYCLE_PAUSE_MS);
      return;
    }
    
    const sentenceIndex = currentSentenceRef.current;
    const currentSentence = MOTIVATIONAL_TEXT[sentenceIndex];
    
    if (typingPositionRef.current < currentSentence.length) {
      // Still typing the current sentence
      setTypingText(currentSentence.slice(0, typingPositionRef.current + 1));
      typingPositionRef.current++;
      
      // Schedule next character
      timeoutRef.current = setTimeout(typeNextCharacter, getTypingDelay());
    } else {
      // Finished typing current sentence
      const sentence = currentSentence;
      setDisplayedSentences(prev => [...prev, sentence]);
      setTypingText("");

      const isLastSentence = sentenceIndex >= MOTIVATIONAL_TEXT.length - 1;
      if (isLastSentence) {
        // Pause after the last sentence, including haptics, then restart from the top
        currentSentenceRef.current = MOTIVATIONAL_TEXT.length;
        typingPositionRef.current = 0;
        pauseHapticsFor(END_OF_CYCLE_PAUSE_MS);
        timeoutRef.current = setTimeout(() => {
          if (!visible) return;
          currentSentenceRef.current = 0;
          typingPositionRef.current = 0;
          setDisplayedSentences([]);
          typeNextCharacter();
        }, END_OF_CYCLE_PAUSE_MS);
        return;
      }

      // Move to next sentence
      currentSentenceRef.current = sentenceIndex + 1;
      typingPositionRef.current = 0;

      // Wait longer between sentences
      timeoutRef.current = setTimeout(typeNextCharacter, 700);
    }
  }, [visible, getTypingDelay, pauseHapticsFor]);

  // Reset state when modal closes
  useEffect(() => {
    if (!visible) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (hapticTimeoutRef.current) {
        clearTimeout(hapticTimeoutRef.current);
        hapticTimeoutRef.current = null;
      }
      setDisplayedSentences([]);
      setTypingText("");
      currentSentenceRef.current = 0;
      typingPositionRef.current = 0;
    } else {
      timeoutRef.current = setTimeout(() => {
        typeNextCharacter();
      }, 200);
    }
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [visible, typeNextCharacter]);

  // Component to display a highlighted sentence
  const HighlightedSentence = ({ sentence }: { sentence: string }) => {
    // Define which word to highlight in each sentence
    const highlightMap: Record<string, string> = {
      "STOP.": "STOP",
      "The urge will pass.": "will pass",
      "You are stronger than this.": "stronger",
      "Breathe...": "Breathe",
      "Hold the line.": "Hold",
      "Victory is 5 minutes away.": "Victory"
    };
    
    const wordToHighlight = highlightMap[sentence] || '';
    
    if (!wordToHighlight) {
      return <Text style={styles.sentenceText}>{sentence}</Text>;
    }
    
    const parts = sentence.split(wordToHighlight);
    return (
      <Text style={styles.sentenceText}>
        {parts[0]}
        <Text style={styles.highlightText}>{wordToHighlight}</Text>
        {parts[1] || ''}
      </Text>
    );
  };
  
  const styles = createStyles(theme, bottomPadding, topPadding);

  const handleEnableCamera = async () => {
    try {
      await requestCameraPermission();
    } catch {
      // ignore - we'll keep showing the prompt
    }
  };

  const handleOpenSettings = async () => {
    try {
      await Linking.openSettings();
    } catch {
      // ignore
    }
  };

  // Show only 3 visible lines total:
  // - while typing: 1 typing line + last 2 completed lines
  // - while idle (between sentences / end pause): last 3 completed lines
  const completedSentencesForRender =
    typingText !== '' ? displayedSentences.slice(-2) : displayedSentences.slice(-3);
  
  return (
    <Modal
      transparent
      hardwareAccelerated
      visible={visible}
      onRequestClose={onClose}
      animationType="none"
      statusBarTranslucent
    >
    <Animated.View 
      style={styles.container}
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(200)}
    >
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="rgba(0, 0, 0, 0.9)"
      />
      
      <Animated.View 
        style={styles.modalContainer}
        entering={SlideInUp.duration(400).springify()}
        exiting={SlideOutDown.duration(300).springify()}
      >
        <View
          style={styles.topOverlay}
          pointerEvents="box-none"
          onLayout={(event) => setTopOverlayHeight(event.nativeEvent.layout.height)}
        >
          <View style={styles.headerContainer} pointerEvents="box-none">
            <View style={styles.headerSpacer} />
            <Image
              source={require('@/assets/images/logo.png')}
              style={styles.headerLogo}
              resizeMode="contain"
            />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              activeOpacity={0.7}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <AntDesign name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.titleContainer} pointerEvents="none">
            <Text style={styles.panicText}>Panic Button</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: contentTopPadding + 12, paddingBottom: bottomActionsHeight + bottomPadding + 16 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.placeholderContainer}>
              {visible && cameraGranted ? (
                <View style={styles.cameraViewWrapper} pointerEvents="none">
                  <CameraView
                    style={styles.cameraView}
                    facing="front"
                    pointerEvents="none"
                  />
                </View>
              ) : null}

              <View
                style={[
                  styles.textOverlay,
                  (visible && cameraGranted) ? styles.textOverlayOnCamera : null,
                ]}
                pointerEvents="none"
              >
                <View style={styles.textContainer}>
                  {typingText !== "" && (
                    <View
                      style={[
                        styles.sentenceContainer,
                        (visible && cameraGranted) ? styles.sentenceContainerOnCamera : null,
                      ]}
                    >
                      <Text style={styles.sentenceText}>
                        {typingText}
                        <RNAnimated.Text style={[styles.cursor, { opacity: cursorOpacity }]}>|</RNAnimated.Text>
                      </Text>
                    </View>
                  )}

                  {completedSentencesForRender
                    .map((sentence, index) => ({ sentence, index }))
                    .reverse()
                    .map(({ sentence, index }) => (
                      <Animated.View
                        key={`sentence-${index}-${sentence}`}
                        style={[
                          styles.sentenceContainer,
                          (visible && cameraGranted) ? styles.sentenceContainerOnCamera : null,
                        ]}
                        entering={Platform.OS === 'ios' ? FadeIn.duration(200) : (undefined as any)}
                      >
                        <HighlightedSentence sentence={sentence} />
                      </Animated.View>
                    ))}
                </View>
              </View>

              {!cameraGranted ? (
                <View style={styles.cameraPromptOverlay}>
                  <Text style={styles.cameraPromptTitle}>Front Camera</Text>
                  <Text style={styles.cameraPromptBody}>
                    To show your camera feed in Panic Mode, allow camera access.
                  </Text>

                  <View style={styles.cameraPromptButtons}>
                    {permissionForRender?.canAskAgain === false ? (
                      <TouchableOpacity
                        style={styles.cameraPromptButton}
                        onPress={handleOpenSettings}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.cameraPromptButtonText}>Open Settings</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={styles.cameraPromptButton}
                        onPress={handleEnableCamera}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.cameraPromptButtonText}>Allow Camera</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ) : null}
          </View>

          <View style={styles.sectionSeparator}>
            <View style={styles.separatorLine} />
            <Text style={styles.separatorText}>Side Effects of Relapsing</Text>
            <View style={styles.separatorLine} />
          </View>

          <View style={styles.effectsCard}>
            {SIDE_EFFECTS.map((item, index) => (
              <View key={item.key}>
                <View style={styles.effectRow}>
                  <View style={styles.effectIconWrap}>
                    <MaterialCommunityIcons name={item.icon} size={26} color={item.color} />
                  </View>
                  <View style={styles.effectTextWrap}>
                    <Text style={styles.effectTitle}>{item.title}</Text>
                    <Text style={styles.effectBody}>{item.description}</Text>
                  </View>
                </View>
                {index < SIDE_EFFECTS.length - 1 && <View style={styles.effectDivider} />}
              </View>
            ))}
          </View>
        </ScrollView>

        <View
          style={styles.bottomActions}
          onLayout={(event) => setBottomActionsHeight(event.nativeEvent.layout.height)}
        >
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.actionButton, styles.primaryActionButton]}
            onPress={() => {
              onClose();
              setTimeout(() => onPrevention?.(), 0);
            }}
          >
            <MaterialCommunityIcons name="alert-circle-outline" size={20} color="#ffffff" />
            <Text style={styles.actionButtonText}>I&apos;m thinking of relapsing</Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.actionButton, styles.secondaryActionButton]}
            onPress={() => {
              onClose();
              setTimeout(() => onRelapsed?.(), 0);
            }}
          >
            <MaterialCommunityIcons name="thumb-down-outline" size={20} color="#ffffff" />
            <Text style={styles.actionButtonText}>I Relapsed</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Animated.View>
    </Modal>
  );
};

const createStyles = (theme: any, bottomPadding: number, topPadding: number) => StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  modalContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000000',
    overflow: 'hidden',
  },
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 60,
    elevation: 60,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: topPadding + 10,
    paddingBottom: 8,
    zIndex: 50,
    elevation: 50,
  },
  headerSpacer: {
    width: 40,
    height: 40,
  },
  headerLogo: {
    width: 120,
    height: 40,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    zIndex: 51,
    elevation: 51,
  },
  titleContainer: {
    alignItems: 'center',
    marginTop: Platform.OS === 'ios' ? 8 : 4,
    marginBottom: Platform.OS === 'ios' ? 18 : 12,
  },
  panicText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#d85555',
    textAlign: 'center',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: bottomPadding + 20,
  },
  placeholderContainer: {
    width: '100%',
    height: Math.min(420, Math.max(260, Math.round(Dimensions.get('window').height * 0.42))),
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: 16,
  },
  sectionSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginTop: 6,
    marginBottom: 30,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  separatorText: {
    paddingHorizontal: 12,
    color: 'rgba(255, 255, 255, 0.62)',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  effectsCard: {
    width: '100%',
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: 10,
  },
  bottomActions: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: bottomPadding,
    backgroundColor: '#000000',
    zIndex: 40,
    elevation: 40,
  },
  actionButton: {
    width: '100%',
    borderRadius: 999,
    paddingVertical: 16,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  primaryActionButton: {
    backgroundColor: '#e02727',
    shadowColor: '#e02727',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  secondaryActionButton: {
    marginTop: 12,
    backgroundColor: '#2a2a2a',
    marginBottom: 10,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  effectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  effectIconWrap: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  effectTextWrap: {
    flex: 1,
  },
  effectTitle: {
    color: '#f2f2f2',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  effectBody: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: 14,
    marginTop: 4,
    lineHeight: 18,
  },
  effectDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginLeft: 54,
  },
  cameraView: {
    ...StyleSheet.absoluteFillObject,
  },
  cameraViewWrapper: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
    elevation: 0,
  },
  textOverlay: {
    width: '100%',
    padding: 20,
    zIndex: 2,
  },
  textOverlayOnCamera: {
    // Push the text down a bit so the camera feed is more visible.
    transform: [{ translateY: Math.min(110, topPadding + 78) }],
  },
  textContainer: {
    width: '100%',
    alignItems: 'center',
  },
  cameraPromptOverlay: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    zIndex: 3,
  },
  cameraPromptTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },
  cameraPromptBody: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
    marginBottom: 10,
  },
  cameraPromptButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  cameraPromptButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(216, 85, 85, 0.95)',
  },
  cameraPromptButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  sentenceContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginVertical: 2,
    width: '100%',
  },
  sentenceContainerOnCamera: {
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  sentenceText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 24,
  },
  highlightText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#d85555', // Using the same red as the Panic Button title
    textAlign: 'center',
    lineHeight: 24,
  },
  cursor: {
    color: '#fff',
    fontWeight: 'bold',
  }
});

export default PanicModal; 