import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { useTheme } from '@/src/context/ThemeProvider';

interface QuizGenderProps {
  selectedGender: string;
  onSelectGender: (gender: string) => void;
  questionNumber?: number;
}

const QuizGender = ({ selectedGender, onSelectGender, questionNumber = 1 }: QuizGenderProps) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  // Gender options
  const genderOptions = ['Male', 'Female', 'Other'];

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
        Choose your gender
      </Animated.Text>
      
      <Animated.Text 
        entering={FadeIn.duration(400).delay(300)} 
        style={styles.subtitle}
      >
        This will be used to calibrate your custom plan
      </Animated.Text>
      
      <View style={styles.optionsContainer}>
        {genderOptions.map((gender, index) => (
          <Animated.View 
            key={gender}
            entering={FadeIn.duration(400).delay(400 + index * 100)}
          >
            <TouchableOpacity
              style={[
                styles.option,
                selectedGender === gender && styles.selectedOption
              ]}
              onPress={() => onSelectGender(gender)}
              activeOpacity={0.7}
            >
              <Text 
                style={[
                  styles.optionText,
                  selectedGender === gender && styles.selectedOptionText
                ]}
              >
                {gender}
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
    marginBottom: 8,
    lineHeight: 30,
  },
  subtitle: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    marginBottom: 32,
  },
  optionsContainer: {
    marginTop: 16,
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

export default QuizGender; 