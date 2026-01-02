import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useTheme } from '@/src/context/ThemeProvider';

interface QuizDurationProps {
  selectedDuration: string;
  onSelectDuration: (duration: string) => void;
  questionNumber?: number;
}

const QuizDuration = ({ selectedDuration, onSelectDuration, questionNumber = 5 }: QuizDurationProps) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  // Duration options
  const durationOptions = [
    { value: 'less_than_year', label: 'Less than a year' },
    { value: '1_to_3_years', label: '1-3 years' },
    { value: '4_to_10_years', label: '4-10 years' },
    { value: 'more_than_10', label: 'More than 10 years' },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.questionNumber}>
        Question {questionNumber}
      </Text>
      
      <Text style={styles.title}>
        How long have you been struggling with pornography?
      </Text>
      
      <View style={styles.optionsContainer}>
        {durationOptions.map((option, index) => (
          <View key={option.value}>
            <TouchableOpacity
              style={[
                styles.option,
                selectedDuration === option.value && styles.selectedOption
              ]}
              onPress={() => onSelectDuration(option.value)}
              activeOpacity={0.7}
            >
              <Text 
                style={[
                  styles.optionText,
                  selectedDuration === option.value && styles.selectedOptionText
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
    textAlign: 'center',
  },
  selectedOptionText: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
});

export default QuizDuration; 