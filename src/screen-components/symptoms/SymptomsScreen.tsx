import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Dimensions, LayoutChangeEvent } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/src/context/ThemeProvider';
import FixedBottomButton from '@/src/components/FixedBottomButton';
import DarkTheme from '@/assets/DarkTheme';

interface SymptomItem {
  id: string;
  text: string;
  selected: boolean;
}

interface SymptomCategory {
  id: string;
  title: string;
  icon: string;
  symptoms: SymptomItem[];
}

interface SymptomsScreenProps {
  onComplete?: () => void;
}

const SymptomsScreen: React.FC<SymptomsScreenProps> = ({ onComplete }) => {
  const { theme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [buttonHeight, setButtonHeight] = useState(0);
  const buttonContainerRef = useRef(null);
  const styles = createStyles(theme, buttonHeight, insets);

  // Measure the button container height to adjust scroll padding
  useEffect(() => {
    // Default button container height estimate until we can measure it
    setButtonHeight(90);
  }, []);

  // Handle button container layout change
  const handleButtonLayout = (event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    setButtonHeight(height);
  };

  // State pentru categoriile de simptome și simptomele selectate
  const [categories, setCategories] = useState<SymptomCategory[]>([
    {
      id: 'mental',
      title: 'Mental',
      icon: '🧠',
      symptoms: [
        { id: 'mental_1', text: 'Feeling unmotivated', selected: false },
        { id: 'mental_2', text: 'Lack of ambition to pursue goals', selected: false },
        { id: 'mental_3', text: 'Difficulty concentrating', selected: false },
        { id: 'mental_4', text: 'Poor memory or \'brain fog\'', selected: false },
      ]
    },
    {
      id: 'physical',
      title: 'Physical',
      icon: '💪',
      symptoms: [
        { id: 'physical_1', text: 'Tiredness and lethargy', selected: false },
        { id: 'physical_2', text: 'Low sex drive or desire', selected: false },
        { id: 'physical_3', text: 'Weak erections without porn', selected: false },
      ]
    },
    {
      id: 'social',
      title: 'Social',
      icon: '👥',
      symptoms: [
        { id: 'social_1', text: 'Low self-confidence', selected: false },
        { id: 'social_2', text: 'Feeling unattractive or unworthy of love', selected: false },
        { id: 'social_3', text: 'Unsuccessful or unenjoyable sex', selected: false },
      ]
    },
    {
      id: 'faith',
      title: 'Faith',
      icon: '🙏',
      symptoms: [
        { id: 'faith_1', text: 'Guilt or shame related to spiritual values', selected: false },
      ]
    },
  ]);

  // Funcție pentru a selecta/deselecta un simptom
  const toggleSymptom = (categoryId: string, symptomId: string) => {
    setCategories(categories.map(category => 
      category.id === categoryId 
        ? {
            ...category,
            symptoms: category.symptoms.map(symptom => 
              symptom.id === symptomId 
                ? { ...symptom, selected: !symptom.selected }
                : symptom
            )
          }
        : category
    ));
  };

  // Verificăm dacă utilizatorul a selectat cel puțin un simptom
  const hasSelectedSymptoms = categories.some(category => 
    category.symptoms.some(symptom => symptom.selected)
  );

  const handleRebootPress = () => {
    // Call the onComplete callback if provided
    if (onComplete) {
      onComplete();
    } else {
      // Fallback to default navigation if no callback provided
      router.replace('/onboarding/process');
    }
  };
  
  const handleBackPress = () => {
    // Navigăm înapoi la ecranul anterior
    router.back();
  };

  return (
    <View style={styles.container}>
      {/* Buton Back */}
      <View style={styles.headerContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBackPress}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
      </View>
      
      {/* Main content area - will only take up space above the button */}
      <View style={styles.mainContentArea}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <Animated.Text 
            entering={FadeInDown.duration(600).delay(100)}
            style={styles.title}
          >
            Symptoms of Pornography Addiction
          </Animated.Text>
          
          <Animated.View
            entering={FadeInDown.duration(600).delay(200)}
            style={styles.warningContainer}
          >
            <Ionicons name="warning-outline" size={22} color="#FFFFFF" style={styles.warningIcon} />
            <Text style={styles.warningText}>Excessive porn use can have negative impacts</Text>
          </Animated.View>
          
          <Animated.Text 
            entering={FadeInDown.duration(600).delay(300)}
            style={styles.subtitle}
          >
            Select the symptoms you're experiencing in each category:
          </Animated.Text>
          
          {categories.map((category, categoryIndex) => (
            <Animated.View 
              key={category.id}
              entering={FadeInDown.duration(500).delay(400 + categoryIndex * 100)}
              style={styles.categoryContainer}
            >
              <View style={styles.categoryTitleContainer}>
                <Text style={styles.categoryIcon}>{category.icon}</Text>
                <Text style={styles.categoryTitle}>{category.title}</Text>
              </View>
              
              <View style={styles.symptomsContainer}>
                {category.symptoms.map((symptom, symptomIndex) => (
                  <Animated.View 
                    key={symptom.id}
                    entering={FadeInDown.duration(400).delay(500 + categoryIndex * 100 + symptomIndex * 50)}
                  >
                    <TouchableOpacity
                      style={[
                        styles.symptomItem,
                        symptom.selected && styles.symptomSelected
                      ]}
                      onPress={() => toggleSymptom(category.id, symptom.id)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.symptomContent}>
                        <Text style={[
                          styles.symptomText,
                          symptom.selected && styles.symptomTextSelected
                        ]}>
                          {symptom.text}
                        </Text>
                        
                        <View style={[
                          styles.checkbox,
                          symptom.selected && styles.checkboxSelected
                        ]}>
                          {symptom.selected && (
                            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                          )}
                        </View>
                      </View>
                    </TouchableOpacity>
                  </Animated.View>
                ))}
              </View>
            </Animated.View>
          ))}
          
          <Animated.View 
            entering={FadeInDown.duration(600).delay(1300)}
            style={styles.infoContainer}
          >
            <Text style={styles.footerText}>
              Ready to break free from these symptoms and start your recovery journey?
            </Text>
          </Animated.View>
        </ScrollView>
      </View>
      
      {/* Fixed bottom button with transparent styling */}
      <View 
        ref={buttonContainerRef} 
        onLayout={handleButtonLayout}
        style={styles.buttonWrapper}
      >
        <FixedBottomButton
          title="Reboot my Brain"
          onPress={handleRebootPress}
          disabled={!hasSelectedSymptoms}
          absolute={false}
          customStyle={{ 
            backgroundColor: theme.colors.background,
            borderTopWidth: 0,
            paddingTop: 10,
            paddingBottom: insets.bottom + 16
          }}
          buttonStyle={{ backgroundColor: theme.colors.primary }}
        />
      </View>
    </View>
  );
};

const createStyles = (theme: any, buttonHeight: number, insets: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  mainContentArea: {
    flex: 1,
    marginBottom: buttonHeight, // Reserve space for the button
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.pill,
    borderCurve: 'continuous',
    backgroundColor: theme.colors.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.light,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 20, // Normal padding as we're handling the button space separately
    paddingTop: 0,
  },
  buttonWrapper: {
    backgroundColor: theme.colors.background,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 16,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f39c12', // Brighter warning color for better visibility
    borderRadius: theme.borderRadius.xl,
    borderCurve: 'continuous',
    padding: 14,
    marginBottom: 20,
    ...theme.shadows.light,
  },
  warningIcon: {
    marginRight: 10,
  },
  warningText: {
    color: '#FFFFFF', // White text for better contrast
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginBottom: 20,
    lineHeight: 22,
  },
  categoryContainer: {
    marginBottom: 24,
  },
  categoryTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryIcon: {
    fontSize: 22,
    marginRight: 8,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  symptomsContainer: {
    borderRadius: theme.borderRadius.xl,
    borderCurve: 'continuous',
    overflow: 'hidden',
    gap: 8, // Add spacing between symptom items
  },
  symptomItem: {
    backgroundColor: theme.colors.cardBackground,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: theme.borderRadius.xl,
    borderCurve: 'continuous',
    ...theme.shadows.light,
  },
  symptomSelected: {
    backgroundColor: theme.colors.primary === '#6366f1' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(52, 152, 219, 0.1)',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  symptomContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  symptomText: {
    fontSize: 15,
    color: theme.colors.textPrimary,
    flex: 1,
    paddingRight: 8,
  },
  symptomTextSelected: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderCurve: 'continuous',
    borderWidth: 2,
    borderColor: theme.colors.border || '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  checkboxSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  infoContainer: {
    marginTop: 16,
    marginBottom: 20,
    backgroundColor: theme.colors.background === '#000000' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
    borderRadius: theme.borderRadius.xl,
    borderCurve: 'continuous',
    padding: 16,
  },
  footerText: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    fontStyle: 'italic',
  },
});

export default SymptomsScreen; 