import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useTheme } from '@/src/context/ThemeProvider';

interface QuizGoalsProps {
  selectedGoal: string;
  onSelectGoal: (goal: string) => void;
  questionNumber?: number;
}

const QuizGoals = ({ selectedGoal, onSelectGoal, questionNumber = 3 }: QuizGoalsProps) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  // Goal options
  const goalOptions = [
    { value: 'reduce', label: 'Reduce my usage' },
    { value: 'quit', label: 'Quit completely' },
    { value: 'explore', label: 'Just exploring' },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.questionNumber}>
        Question {questionNumber}
      </Text>
      
      <Text style={styles.title}>
        What&apos;s your primary goal?
      </Text>
      
      <View style={styles.optionsContainer}>
        {goalOptions.map((option, index) => (
          <View key={option.value}>
            <TouchableOpacity
              style={[
                styles.option,
                selectedGoal === option.value && styles.selectedOption
              ]}
              onPress={() => onSelectGoal(option.value)}
              activeOpacity={0.7}
            >
              <Text 
                style={[
                  styles.optionText,
                  selectedGoal === option.value && styles.selectedOptionText
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  questionNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 32,
    lineHeight: 30,
  },
  optionsContainer: {
    marginTop: 16,
  },
  option: {
    padding: 16,
    borderRadius: theme.borderRadius.xl,
    borderCurve: 'continuous',
    backgroundColor: theme.colors.cardBackground,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    ...theme.shadows.light,
  },
  selectedOption: {
    backgroundColor: theme.colors.cardInteractive,
    borderColor: theme.colors.primary,
    ...theme.shadows.medium,
  },
  optionText: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.colors.textPrimary,
    marginLeft: 16,
  },
  selectedOptionText: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
});

export default QuizGoals; 