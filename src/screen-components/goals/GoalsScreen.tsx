import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useTheme } from '@/src/context/ThemeProvider';
import { apiClient } from '@/src/axios/apiClient';
import { BackendRoutes } from '@/src/axios/backendRoutes';
import { CustomAlert } from '@/src/components/alert';

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
  
  // Funcție pentru a naviga înapoi
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
        <Animated.Text 
          entering={FadeInDown.duration(600).delay(100)}
          style={styles.title}
        >
          Choose Your Goals
        </Animated.Text>
        
        <Animated.Text 
          entering={FadeInDown.duration(600).delay(200)}
          style={styles.subtitle}
        >
          Select the goals you want to achieve during your recovery journey
        </Animated.Text>
        
        <View style={styles.goalsContainer}>
          {goals.map((goal, index) => (
            <Animated.View 
              key={goal.id}
              entering={FadeInDown.duration(400).delay(300 + index * 100)}
              style={styles.goalItemWrapper}
            >
              <TouchableOpacity
                style={[
                  styles.goalItem,
                  goal.selected && styles.selectedGoal
                ]}
                onPress={() => toggleGoal(goal.id)}
                activeOpacity={0.8}
              >
                <View style={styles.goalHeader}>
                  <View style={[
                    styles.iconContainer,
                    { backgroundColor: goal.iconColor + '20' }
                  ]}>
                    <Ionicons 
                      name={goal.icon as any} 
                      size={22} 
                      color={goal.selected ? theme.colors.primary : goal.iconColor} 
                    />
                  </View>
                  <View style={styles.checkboxContainer}>
                    <View style={[
                      styles.checkbox,
                      goal.selected && styles.checkboxSelected
                    ]}>
                      {goal.selected && (
                        <Ionicons name="checkmark" size={16} color={theme.colors.cardBackground} />
                      )}
                    </View>
                  </View>
                </View>
                
                <Text style={[
                  styles.goalTitle,
                  goal.selected && styles.selectedGoalText
                ]}>
                  {goal.title}
                </Text>
                
                <Text style={styles.goalDescription}>
                  {goal.description}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>
        
        <Animated.View 
          entering={FadeInDown.duration(600).delay(1000)}
          style={styles.footerContainer}
        >
          <TouchableOpacity 
            style={[
              styles.trackButton,
              (!hasSelectedGoals || isLoading) && styles.disabledButton
            ]}
            onPress={handleTrackGoals}
            disabled={!hasSelectedGoals || isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color={theme.colors.cardBackground} size="small" />
            ) : (
              <Text style={styles.trackButtonText}>Track Your Goals</Text>
            )}
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
      
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
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginBottom: 32,
    lineHeight: 22,
  },
  goalsContainer: {
    marginBottom: 32,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  goalItemWrapper: {
    width: '48%', // Pentru a afișa 2 pe rând cu spațiu între ele
    marginBottom: 16,
  },
  goalItem: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.medium,
    padding: 16,
    height: 180, // Înălțime fixă pentru toate cardurile
    ...theme.shadows.light,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  selectedGoal: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.cardInteractive,
    ...theme.shadows.medium,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxContainer: {
    alignItems: 'flex-end',
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
  goalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 8,
  },
  selectedGoalText: {
    color: theme.colors.primary,
  },
  goalDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  footerContainer: {
    marginTop: 20,
  },
  trackButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.medium,
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
});

export default GoalsScreen; 