import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Dimensions, 
  Image,
  Platform,
  StatusBar,
  Animated as RNAnimated
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

import { useTheme } from '@/src/context/ThemeProvider';

interface PanicModalProps {
  visible: boolean;
  onClose: () => void;
}

const { height, width } = Dimensions.get('window');

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
  const cursorOpacity = useRef(new RNAnimated.Value(1)).current;
  const timeoutRef = useRef<number | null>(null);
  const currentSentenceRef = useRef(0);
  const typingPositionRef = useRef(0);
  const hapticTimeoutRef = useRef<number | null>(null);
  
  // Adjust for safe areas
  const bottomPadding = Math.max(insets.bottom, 20);
  const topPadding = Math.max(insets.top, 20);
  
  // Get a typing delay with slight variation
  const getTypingDelay = () => {
    return 70 + Math.random() * 50; // 70-120ms
  };
  
  // Function to trigger a haptic pattern: 3 x warning at 160ms, then 900ms pause, repeat
  const triggerHapticPattern = () => {
    let count = 0;
    const doPattern = () => {
      if (!visible) return;
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
  };
  
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
  }, [visible, cursorOpacity]);
  
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
  }, [visible]);
  
  // Main typing function
  const typeNextCharacter = () => {
    // Check if we've reached the end of all sentences
    if (currentSentenceRef.current >= MOTIVATIONAL_TEXT.length) {
      // Reset to start over from the first sentence
      currentSentenceRef.current = 0;
      typingPositionRef.current = 0;
      // Clear all displayed sentences to start fresh
      setDisplayedSentences([]);
      // Wait a bit longer before starting over
      timeoutRef.current = setTimeout(typeNextCharacter, 1000);
      return;
    }
    
    const currentSentence = MOTIVATIONAL_TEXT[currentSentenceRef.current];
    
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
      
      // Move to next sentence
      currentSentenceRef.current++;
      typingPositionRef.current = 0;
      
      // Wait longer between sentences
      timeoutRef.current = setTimeout(typeNextCharacter, 700);
    }
  };
  
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
  
  if (!visible) return null;
  
  const styles = createStyles(theme, bottomPadding, topPadding);
  
  return (
    <Animated.View 
      style={styles.container}
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(200)}
    >
      <StatusBar barStyle="light-content" />
      
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
            <View style={styles.textContainer}>
              {displayedSentences.map((sentence, index) => (
                <Animated.View 
                  key={`sentence-${index}`} 
                  style={styles.sentenceContainer}
                  entering={FadeIn.duration(200)}
                >
                  <HighlightedSentence sentence={sentence} />
                </Animated.View>
              ))}
              
              {typingText !== "" && (
                <View style={styles.sentenceContainer}>
                  <Text style={styles.sentenceText}>
                    {typingText}
                    <RNAnimated.Text style={[styles.cursor, { opacity: cursorOpacity }]}>|</RNAnimated.Text>
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </Animated.View>
    </Animated.View>
  );
};

const createStyles = (theme: any, bottomPadding: number, topPadding: number) => StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    zIndex: 1000,
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
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
    padding: 20,
  },
  textContainer: {
    width: '100%',
    alignItems: 'center',
  },
  sentenceContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginVertical: 6,
    width: '100%',
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