import React, { useEffect, useState, useRef, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image,
  Platform,
  StatusBar,
  Linking,
  Animated as RNAnimated,
  Modal
} from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { 
  FadeIn, 
  FadeOut, 
  SlideInUp, 
  SlideOutDown 
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { CameraView, useCameraPermissions } from 'expo-camera';

import { useTheme } from '@/src/context/ThemeProvider';

interface PanicModalProps {
  visible: boolean;
  onClose: () => void;
}

// Define motivational text sentences
const MOTIVATIONAL_TEXT = [
  "STOP.",
  "The urge will pass.",
  "You are stronger than this.",
  "Breathe...",
  "Hold the line.",
  "Victory is 5 minutes away."
];

const PanicModal = ({ visible, onClose }: PanicModalProps) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [displayedSentences, setDisplayedSentences] = useState<string[]>([]);
  const [typingText, setTypingText] = useState("");
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
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
  
  // Get a typing delay with slight variation
  const getTypingDelay = useCallback(() => {
    return 40 + Math.random() * 30; // 40-70ms (faster typing)
  }, []);

  const pauseHapticsFor = useCallback((ms: number) => {
    const now = Date.now();
    hapticPausedUntilRef.current = Math.max(hapticPausedUntilRef.current || 0, now + ms);
  }, []);
  
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
        <View style={styles.headerContainer}>
          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={onClose}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <AntDesign name="close" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.logoContainer}>
          <Image 
            source={require('@/assets/images/logo.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.panicText}>Panic Button</Text>
        </View>
        
        <View style={styles.contentContainer}>
          <View style={styles.placeholderContainer}>
            {visible && cameraPermission?.granted ? (
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
                (visible && cameraPermission?.granted) ? styles.textOverlayOnCamera : null,
              ]}
              pointerEvents="none"
            >
              <View style={styles.textContainer}>
                {typingText !== "" && (
                  <View
                    style={[
                      styles.sentenceContainer,
                      (visible && cameraPermission?.granted) ? styles.sentenceContainerOnCamera : null,
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
                        (visible && cameraPermission?.granted) ? styles.sentenceContainerOnCamera : null,
                      ]}
                      entering={Platform.OS === 'ios' ? FadeIn.duration(200) : (undefined as any)}
                    >
                      <HighlightedSentence sentence={sentence} />
                    </Animated.View>
                  ))}
              </View>
            </View>

            {!cameraPermission?.granted ? (
              <View style={styles.cameraPromptOverlay}>
                <Text style={styles.cameraPromptTitle}>Front Camera</Text>
                <Text style={styles.cameraPromptBody}>
                  To show your camera feed in Panic Mode, allow camera access.
                </Text>

                <View style={styles.cameraPromptButtons}>
                  {cameraPermission?.canAskAgain === false ? (
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
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: topPadding + 10,
    paddingBottom: 8,
    zIndex: 50,
    elevation: 50,
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
  logoContainer: {
    alignItems: 'center',
    marginTop: Platform.OS === 'ios' ? 20 : 10,
    marginBottom: Platform.OS === 'ios' ? 30 : 20,
  },
  logo: {
    width: 150,
    height: 60,
    marginBottom: 16,
  },
  panicText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#d85555',
    textAlign: 'center',
  },
  contentContainer: {
    flex: 1,
    padding: 20,
    paddingBottom: bottomPadding + 20,
  },
  placeholderContainer: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
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