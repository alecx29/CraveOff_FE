import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Dimensions,
  StatusBar,
  ScrollView
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { 
  FadeIn, 
  FadeOut
} from 'react-native-reanimated';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { useTheme } from '@/src/context/ThemeProvider';

interface RelapsedModalProps {
  visible: boolean;
  onClose: () => void;
  onResetCounter: () => void;
}

const RelapsedModal = ({ visible, onClose, onResetCounter }: RelapsedModalProps) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  // Adjust for safe areas
  const bottomPadding = Math.max(insets.bottom, 20);
  const topPadding = Math.max(insets.top, 20);
  
  // Function to navigate to journal tab
  const goToJournal = () => {
    onClose();
    // Navigate to journal tab
    router.push('/(tabs)/journal');
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
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentContainer}>
          {/* Header Section */}
          <View style={styles.headerSection}>
            {/* Title */}
            <Text style={styles.title}>
              Relapsed
            </Text>
            
            {/* Subtitle */}
            <Text style={styles.subtitle}>
              Don&apos;t be hard on yourself
            </Text>
            
            {/* Description */}
            <Text style={styles.description}>
              Every setback is a learning opportunity. Focus on progress, not perfection.
            </Text>
          </View>
          
          {/* Objections Container */}
          <View style={styles.optionsOuterContainer}>
            <Text style={styles.cycleText}>
              Our goal is to avoid the following cycle
            </Text>
            <View style={styles.optionsContainer}>
              {/* Option 1 */}
              <View style={styles.optionItem}>
                <View style={styles.optionContent}>
                  <View style={styles.optionIconContainer}>
                    <Feather 
                      name="eye" 
                      size={16} 
                      color={theme.colors.primary} 
                    />
                  </View>
                  <View style={styles.optionTextContainer}>
                    <Text style={styles.optionText} selectable={false}>
                      Watching porn
                    </Text>
                    <Text style={styles.optionSubtext} selectable={false}>
                      In the moment you feel incredible
                    </Text>
                  </View>
                </View>
              </View>
              
              {/* Option 2 */}
              <View style={styles.optionItem}>
                <View style={styles.optionContent}>
                  <View style={styles.optionIconContainer}>
                    <MaterialCommunityIcons 
                      name="brain" 
                      size={16} 
                      color={theme.colors.primary} 
                    />
                  </View>
                  <View style={styles.optionTextContainer}>
                    <Text style={styles.optionText} selectable={false}>
                      Post-Nut Clarity
                    </Text>
                    <Text style={styles.optionSubtext} selectable={false}>
                      Shortly after, the euphoria fades, and you get feelings of guilt or sadness
                    </Text>
                  </View>
                </View>
              </View>
              
              {/* Option 3 */}
              <View style={styles.optionItem}>
                <View style={styles.optionContent}>
                  <View style={styles.optionIconContainer}>
                    <Ionicons 
                      name="repeat" 
                      size={16} 
                      color={theme.colors.primary} 
                    />
                  </View>
                  <View style={styles.optionTextContainer}>
                    <Text style={styles.optionText} selectable={false}>
                      Compensation cycle
                    </Text>
                    <Text style={styles.optionSubtext} selectable={false}>
                      You repeat
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
          
          {/* Journal Button */}
          <TouchableOpacity 
            style={styles.journalButton}
            onPress={goToJournal}
            activeOpacity={0.8}
          >
            <View style={styles.journalButtonContent}>
              <Ionicons name="journal-outline" size={20} color="#fff" style={styles.journalIcon} />
              <Text style={styles.journalButtonText}>Journal Feelings</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </View>
          </TouchableOpacity>
        </View>
        
        {/* Button Container - Fixed at bottom */}
        <View style={styles.bottomButtonContainer}>
          <TouchableOpacity 
            style={styles.resetButton}
            onPress={() => {
              onResetCounter();
              onClose();
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="refresh-outline" size={22} color="#fff" style={styles.resetIcon} />
            <Text style={styles.buttonText}>Reset Counter</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Animated.View>
  );
};

const createStyles = (theme: any, bottomPadding: number, topPadding: number) => StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.colors.backgroundDeep || '#121212',
    zIndex: 1000,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: topPadding + 40,
    paddingBottom: bottomPadding + 20,
    justifyContent: 'space-between',
  },
  contentContainer: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 30,
    marginBottom: 30,
  },
  headerSection: {
    alignItems: 'center',
    width: '100%',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#e74c3c', // Red color for "Relapsed"
    textAlign: 'center',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 28,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 30,
    maxWidth: 300,
  },
  optionsOuterContainer: {
    width: '100%',
    marginBottom: 30,
    borderRadius: 16,
    overflow: 'hidden',
  },
  cycleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#916262',
    textAlign: 'center',
    marginBottom: 12,
    opacity: 0.9,
  },
  optionsContainer: {
    borderRadius: 16,
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  optionItem: {
    padding: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'transparent',
    marginBottom: 8,
    borderWidth: 0,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionIconContainer: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
    marginBottom: 2,
  },
  optionSubtext: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '400',
  },
  journalButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 30,
    marginBottom: 20,
    width: '100%',
    maxWidth: 300,
  },
  journalButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  journalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  journalIcon: {
    marginRight: 6,
  },
  bottomButtonContainer: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 30,
    marginTop: 20,
    marginBottom: 10,
  },
  resetButton: {
    backgroundColor: '#e74c3c', // Red color for the button
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    minWidth: 200,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  resetIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default RelapsedModal; 