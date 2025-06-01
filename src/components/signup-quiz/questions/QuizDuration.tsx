import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { useTheme } from '@/src/context/ThemeProvider';

interface AgeOption {
  value: string;
  label: string;
}

interface QuizDurationProps {
  selectedDuration: string;
  onSelectDuration: (duration: string) => void;
  questionNumber?: number;
}

const QuizDuration = ({ selectedDuration, onSelectDuration, questionNumber = 5 }: QuizDurationProps) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  // Age options
  const ageOptions: AgeOption[] = [
    { value: '12_or_younger', label: '12 or younger' },
    { value: '13_to_16', label: '13 to 16' },
    { value: '17_to_24', label: '17 to 24' },
    { value: '25_or_older', label: '25 or older' },
  ];

  return (
    <View style={styles.container}>
      <Animated.Text 
        entering={FadeIn.duration(400).delay(200)} 
        style={styles.questionNumber}
      >
        Question {questionNumber}
      </Animated.Text>
      
      <Animated.Text 
        entering={FadeIn.duration(400).delay(200)} 
        style={styles.title}
      >
        At what age did you first come across explicit content?
      </Animated.Text>
      
      <View style={styles.optionsContainer}>
        {ageOptions.map((option, index) => (
          <Animated.View 
            key={option.value}
            entering={FadeIn.duration(400).delay(400 + index * 100)}
          >
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
          </Animated.View>
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
    padding: 20,
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

export default QuizDuration; 