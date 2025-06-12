import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useTheme } from '@/src/context/ThemeProvider';

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
  const styles = createStyles(theme);

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
      router.push('/goals');
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
          <Ionicons name="warning-outline" size={22} color={theme.colors.cardBackground} style={styles.warningIcon} />
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
                          <Ionicons name="checkmark" size={16} color={theme.colors.cardBackground} />
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
          style={styles.footerContainer}
        >
          <Text style={styles.footerText}>
            Ready to break free from these symptoms and start your recovery journey?
          </Text>
          
          <TouchableOpacity 
            style={[
              styles.rebootButton,
              !hasSelectedSymptoms && styles.rebootButtonDisabled
            ]}
            onPress={handleRebootPress}
            disabled={!hasSelectedSymptoms}
            activeOpacity={0.8}
          >
            <Text style={styles.rebootButtonText}>Reboot my Brain</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    paddingBottom: 40,
    paddingTop: 0,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 16,
  },
  warningContainer: {
    backgroundColor: '#FF3B30',
    borderRadius: theme.borderRadius.medium,
    padding: 14,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    ...theme.shadows.medium,
  },
  warningIcon: {
    marginRight: 10,
  },
  warningText: {
    color: theme.colors.cardBackground,
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginBottom: 24,
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
    fontSize: 24,
    marginRight: 8,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  symptomsContainer: {
    marginBottom: 8,
  },
  symptomItem: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.medium,
    padding: 16,
    marginBottom: 10,
    ...theme.shadows.light,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.borderLight,
  },
  symptomSelected: {
    borderLeftColor: theme.colors.primary,
    backgroundColor: theme.colors.cardInteractive,
    ...theme.shadows.medium,
  },
  symptomContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  symptomText: {
    flex: 1,
    fontSize: 15,
    color: theme.colors.textPrimary,
    lineHeight: 22,
    marginRight: 12,
  },
  symptomTextSelected: {
    color: theme.colors.primary,
    fontWeight: '500',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: theme.colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  footerContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  footerText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  rebootButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.medium,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    ...theme.shadows.medium,
  },
  rebootButtonDisabled: {
    backgroundColor: theme.colors.primary + '80',
    ...theme.shadows.light,
  },
  rebootButtonText: {
    color: theme.colors.cardBackground,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SymptomsScreen; 