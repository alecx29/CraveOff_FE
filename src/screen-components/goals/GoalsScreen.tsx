import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/src/context/ThemeProvider';
import { apiClient } from '@/src/axios/apiClient';
import { BackendRoutes } from '@/src/axios/backendRoutes';
import { CustomAlert } from '@/src/components/alert';
import FixedBottomButton from '@/src/components/FixedBottomButton';

interface Goal {
  id: string;
  title: string;
  description: string;
  icon: string;
  iconColor: string;
  selected: boolean;
}

interface GoalsScreenProps {
  onComplete?: () => void;
}

const hexToRgba = (hexColor: string, alpha: number): string => {
  if (!hexColor?.startsWith('#')) return hexColor;

  const trimmed = hexColor.replace('#', '');
  if (trimmed.length !== 6) return hexColor;

  const r = parseInt(trimmed.slice(0, 2), 16);
  const g = parseInt(trimmed.slice(2, 4), 16);
  const b = parseInt(trimmed.slice(4, 6), 16);
  const safeAlpha = Math.min(1, Math.max(0, alpha));

  return `rgba(${r}, ${g}, ${b}, ${safeAlpha})`;
};

const GoalsScreen = ({ onComplete }: GoalsScreenProps) => {
  const { theme } = useTheme();
  const router = useRouter();
  const styles = createStyles(theme);
  
  // State for error handling
  const [isLoading, setIsLoading] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // State pentru obiectivele selectate
  const [goals, setGoals] = useState<Goal[]>([
    {
      id: '1',
      title: 'Improve Mental Health',
      description: 'Reduce anxiety, depression, and increase mental clarity',
      icon: 'medkit',
      iconColor: '#FF6B6B',
      selected: false
    },
    {
      id: '2',
      title: 'Boost Energy Levels',
      description: 'Increase productivity and overall energy throughout the day',
      icon: 'flash',
      iconColor: '#FFD93D',
      selected: false
    },
    {
      id: '3',
      title: 'Healthier Relationships',
      description: 'Build deeper connections and improve intimacy',
      icon: 'heart',
      iconColor: '#FF8FB1',
      selected: false
    },
    {
      id: '4',
      title: 'Better Focus',
      description: 'Improve concentration and mental clarity',
      icon: 'locate',
      iconColor: '#6BCB77',
      selected: false
    },
    {
      id: '5',
      title: 'Overcome Addiction',
      description: 'Break free from compulsive behavior patterns',
      icon: 'fitness',
      iconColor: '#4D96FF',
      selected: false
    },
    {
      id: '6',
      title: 'Reclaim Time',
      description: 'Spend time on meaningful activities instead',
      icon: 'time',
      iconColor: '#9D65C9',
      selected: false
    },
  ]);
  
  // Funcție pentru a selecta/deselecta un obiectiv
  const toggleGoal = (id: string) => {
    setGoals(goals.map(goal => 
      goal.id === id ? { ...goal, selected: !goal.selected } : goal
    ));
  };
  
  // Verificăm dacă cel puțin un obiectiv este selectat
  const hasSelectedGoals = goals.some(goal => goal.selected);
  
  // Funcție pentru a închide alerta de eroare
  const handleCloseError = () => {
    setShowError(false);
  };
  
  // Funcție pentru a continua către pasul următor
  const handleTrackGoals = async () => {
    if (!hasSelectedGoals) return;
    
    // Extragem id-urile obiectivelor selectate
    const selectedGoalIds = goals
      .filter(goal => goal.selected)
      .map(goal => goal.id);
    
    setIsLoading(true);
    
    try {
      // Trimitem datele către backend
      await apiClient.post(BackendRoutes.GOALS, {
        goals: selectedGoalIds
      });
      
      // Navigăm către ecranul următor
      if (onComplete) {
        onComplete();
      } else {
        router.push('/(auth)/subscription');
      }
    } catch (error: any) {
      console.error('Error saving goals:', error);
      setErrorMessage(error.response?.data?.message || 'Failed to save your goals. Please try again.');
      setShowError(true);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Funcție pentru a naviga înapoi la ecranul anterior (ex: /conquer/rating)
  const handleBackPress = () => {
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
        <Text 
          style={styles.title}
        >
          Choose Your Goals
        </Text>
        
        <Text 
          style={styles.subtitle}
        >
          Select the goals you want to achieve during your recovery journey
        </Text>
        
        <View style={styles.goalsContainer}>
          {goals.map((goal) => {
            const cardBackgroundColor = hexToRgba(goal.iconColor, goal.selected ? 0.32 : 0.12);
            const cardBorderColor = goal.selected ? goal.iconColor : hexToRgba(goal.iconColor, 0.45);
            const checkboxBorderColor = goal.selected ? goal.iconColor : hexToRgba(goal.iconColor, 0.6);
            const checkboxBackgroundColor = goal.selected ? goal.iconColor : 'transparent';
            const iconBackgroundColor = hexToRgba(goal.iconColor, 0.18);

            return (
              <View 
                key={goal.id}
                style={styles.goalItemWrapper}
              >
                <TouchableOpacity
                  style={[
                    styles.goalItem,
                    { backgroundColor: cardBackgroundColor, borderColor: cardBorderColor },
                    goal.selected && styles.selectedGoal
                  ]}
                  onPress={() => toggleGoal(goal.id)}
                  activeOpacity={0.8}
                >
                  <View style={styles.goalHeader}>
                    <View style={[
                      styles.iconContainer,
                      { backgroundColor: iconBackgroundColor }
                    ]}>
                      <Ionicons 
                        name={goal.icon as any} 
                        size={22} 
                        color={goal.iconColor} 
                      />
                    </View>
                    <View style={styles.checkboxContainer}>
                      <View style={[
                        styles.checkbox,
                        { borderColor: checkboxBorderColor, backgroundColor: checkboxBackgroundColor }
                      ]}>
                        {goal.selected && (
                          <Ionicons name="checkmark" size={16} color={theme.colors.cardBackground} />
                        )}
                      </View>
                    </View>
                  </View>
                  
                  <Text style={[
                    styles.goalTitle,
                    goal.selected && { color: goal.iconColor }
                  ]}>
                    {goal.title}
                  </Text>
                  
                  <Text style={styles.goalDescription}>
                    {goal.description}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
        
        {/* Add padding at the bottom to ensure content is not hidden behind the fixed button */}
        <View style={styles.bottomPadding} />
      </ScrollView>
      
      {/* Fixed bottom button */}
      <FixedBottomButton
        title="Track Your Goals"
        onPress={handleTrackGoals}
        disabled={!hasSelectedGoals || isLoading}
        isLoading={isLoading}
        buttonStyle={{ backgroundColor: '#ffffff' }}
        textStyle={{ color: theme.colors.primary }}
      />
      
      {/* Error Alert */}
      <CustomAlert
        visible={showError}
        title="Error"
        message={errorMessage}
        onClose={handleCloseError}
        type="error"
      />
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: theme.colors.background,
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 36 : 16,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 30,
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
    paddingBottom: 10,
    paddingTop: 0,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 24,
    lineHeight: 20,
  },
  goalsContainer: {
    marginBottom: 24,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  goalItemWrapper: {
    width: '48%', // Pentru a afișa 2 pe rând cu spațiu între ele
    marginBottom: 12,
  },
  goalItem: {
    borderRadius: 30,
    padding: 14,
    minHeight: 200,
    borderWidth: 1,
    overflow: 'hidden',
  },
  selectedGoal: {
    borderWidth: 1.2,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxContainer: {
    alignItems: 'flex-end',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 30,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 6,
  },
  goalDescription: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    lineHeight: 15,
  },
  footerContainer: {
    marginTop: 20,
  },
  trackButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.medium,
  },
  disabledButton: {
    backgroundColor: theme.colors.primary + '80',
    ...theme.shadows.light,
  },
  trackButtonText: {
    color: theme.colors.cardBackground,
    fontSize: 16,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 130, // Further increased padding at the bottom
  },
});

export default GoalsScreen; 