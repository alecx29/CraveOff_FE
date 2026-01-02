import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useTheme } from '@/src/context/ThemeProvider';

interface QuizCopingProps {
  selectedOption: string;
  onSelectOption: (option: string) => void;
  questionNumber?: number;
}

const QuizCoping = ({ selectedOption, onSelectOption, questionNumber = 7 }: QuizCopingProps) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  // Options
  const options = [
    { value: 'frequently', label: 'Frequently' },
    { value: 'occasionally', label: 'Occasionally' },
    { value: 'rarely', label: 'Rarely or never' },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.questionNumber}>
        Question {questionNumber}
      </Text>
      
      <Text style={styles.title}>
        Do you use pornography to cope with negative emotions?
      </Text>
      
      <View style={styles.optionsContainer}>
        {options.map((option, index) => (
          <View key={option.value}>
            <TouchableOpacity
              style={[
                styles.option,
                selectedOption === option.value && styles.selectedOption
              ]}
              onPress={() => onSelectOption(option.value)}
              activeOpacity={0.7}
            >
              <Text 
                style={[
                  styles.optionText,
                  selectedOption === option.value && styles.selectedOptionText
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

export default QuizCoping; 