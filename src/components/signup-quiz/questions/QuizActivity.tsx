import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useTheme } from '@/src/context/ThemeProvider';

interface FrequencyOption {
  value: string;
  label: string;
}

interface QuizActivityProps {
  selectedActivity: string;
  onSelectActivity: (activity: string) => void;
  questionNumber?: number;
}

const QuizActivity = ({ selectedActivity, onSelectActivity, questionNumber = 1 }: QuizActivityProps) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  // Frequency options
  const frequencyOptions: FrequencyOption[] = [
    { value: 'multiple_daily', label: 'More than once a day' },
    { value: 'daily', label: 'Once a day' },
    { value: 'few_weekly', label: 'A few times a week' },
    { value: 'less_weekly', label: 'Less than once a week' },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.questionNumber}>
        Question {questionNumber}
      </Text>
      
      <Text style={styles.title}>
        How often do you typically view pornography?
      </Text>
      
      <View style={styles.optionsContainer}>
        {frequencyOptions.map((option, index) => (
          <View key={option.value}>
            <TouchableOpacity
              style={[
                styles.option,
                selectedActivity === option.value && styles.selectedOption
              ]}
              onPress={() => onSelectActivity(option.value)}
              activeOpacity={0.7}
            >
              <Text 
                style={[
                  styles.optionText,
                  selectedActivity === option.value && styles.selectedOptionText
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
    marginTop: 24,
  },
  option: {
    padding: 16,
    borderRadius: theme.borderRadius.medium,
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
    textAlign: 'center',
  },
  selectedOptionText: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
});

export default QuizActivity; 