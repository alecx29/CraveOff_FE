import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { useTheme } from '@/src/context/ThemeProvider';

interface QuizExtremeProps {
  selectedOption: string;
  onSelectOption: (option: string) => void;
  questionNumber?: number;
}

const QuizExtreme = ({ selectedOption, onSelectOption, questionNumber = 4 }: QuizExtremeProps) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  // Yes/No options
  const options = [
    { value: 'yes', label: 'Yes' },
    { value: 'no', label: 'No' },
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
        Have you noticed a shift towards more extreme or graphic material?
      </Animated.Text>
      
      <View style={styles.optionsContainer}>
        {options.map((option, index) => (
          <Animated.View 
            key={option.value}
            entering={FadeIn.duration(400).delay(400 + index * 100)}
          >
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
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  option: {
    padding: 20,
    borderRadius: theme.borderRadius.medium,
    backgroundColor: theme.colors.cardBackground,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    width: 120,
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

export default QuizExtreme; 