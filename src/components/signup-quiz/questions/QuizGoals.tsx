import { AntDesign, Feather, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { useTheme } from '@/src/context/ThemeProvider';

interface ReferralOption {
  value: string;
  label: string;
  icon: React.ReactNode;
}

interface QuizGoalsProps {
  selectedGoal: string;
  onSelectGoal: (goal: string) => void;
  questionNumber?: number;
}

const QuizGoals = ({ selectedGoal, onSelectGoal, questionNumber = 3 }: QuizGoalsProps) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  // Create referral options with icons
  const getReferralOptions = () => {
    return [
      { 
        value: 'instagram', 
        label: 'Instagram',
        icon: <AntDesign name="instagram" size={24} color={selectedGoal === 'instagram' ? theme.colors.primary : theme.colors.textSecondary} />
      },
      { 
        value: 'facebook', 
        label: 'Facebook',
        icon: <Feather name="facebook" size={24} color={selectedGoal === 'facebook' ? theme.colors.primary : theme.colors.textSecondary} />
      },
      { 
        value: 'tiktok', 
        label: 'TikTok',
        icon: <FontAwesome5 name="tiktok" size={24} color={selectedGoal === 'tiktok' ? theme.colors.primary : theme.colors.textSecondary} />
      },
      { 
        value: 'youtube', 
        label: 'YouTube',
        icon: <AntDesign name="youtube" size={24} color={selectedGoal === 'youtube' ? theme.colors.primary : theme.colors.textSecondary} />
      },
      { 
        value: 'google', 
        label: 'Google',
        icon: <AntDesign name="google" size={24} color={selectedGoal === 'google' ? theme.colors.primary : theme.colors.textSecondary} />
      },
      { 
        value: 'ads', 
        label: 'Ads',
        icon: <MaterialCommunityIcons name="advertisements" size={24} color={selectedGoal === 'ads' ? theme.colors.primary : theme.colors.textSecondary} />
      },
    ];
  };

  const referralOptions = getReferralOptions();

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
        Where did you hear about us?
      </Animated.Text>
      
      <View style={styles.optionsContainer}>
        {referralOptions.map((option, index) => (
          <Animated.View 
            key={option.value}
            entering={FadeIn.duration(400).delay(400 + index * 100)}
          >
            <TouchableOpacity
              style={[
                styles.option,
                selectedGoal === option.value && styles.selectedOption
              ]}
              onPress={() => onSelectGoal(option.value)}
              activeOpacity={0.7}
            >
              <View style={styles.optionContent}>
                {option.icon}
                <Text 
                  style={[
                    styles.optionText,
                    selectedGoal === option.value && styles.selectedOptionText
                  ]}
                >
                  {option.label}
                </Text>
              </View>
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
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
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