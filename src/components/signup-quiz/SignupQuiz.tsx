import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withTiming 
} from 'react-native-reanimated';

import { useTheme } from '@/src/context/ThemeProvider';
import { 
  QuizWelcome, 
  QuizGender, 
  QuizActivity, 
  QuizGoals, 
  QuizExtreme, 
  QuizDuration, 
  QuizArousal, 
  QuizCoping,
  QuizStress,
  QuizBoredom,
  QuizSpending,
  QuizPersonal
} from './questions';
import type { PersonalInfo } from './questions/QuizPersonal';

// Define quiz step types
export type QuizStep = 
  | 'welcome'
  | 'gender'
  | 'activity'
  | 'goals'
  | 'extreme'
  | 'duration'
  | 'arousal'
  | 'coping'
  | 'stress'
  | 'boredom'
  | 'spending'
  | 'personal';

// User data interface
export interface QuizData {
  gender: string;
  pornFrequency: string;
  referralSource: string;
  extremeContent: string;
  struggleDuration: string;
  arousalDifficulty: string;
  copingUse: string;
  stressUse: string;
  boredomUse: string;
  spentMoney: string;
  personalInfo: PersonalInfo;
}

interface SignupQuizProps {
  onComplete?: (data: QuizData) => void;
  isLoading?: boolean;
}

const SignupQuiz = ({ onComplete, isLoading = false }: SignupQuizProps) => {
  const { theme } = useTheme();
  const router = useRouter();
  const styles = createStyles(theme);
  
  // Quiz state
  const [currentStep, setCurrentStep] = useState<QuizStep>('welcome');
  const [quizData, setQuizData] = useState<QuizData>({
    gender: '',
    pornFrequency: '',
    referralSource: '',
    extremeContent: '',
    struggleDuration: '',
    arousalDifficulty: '',
    copingUse: '',
    stressUse: '',
    boredomUse: '',
    spentMoney: '',
    personalInfo: {
      name: '',
      age: ''
    },
  });
  
  // Progress animation
  const progressValue = useSharedValue(0);
  
  // Update progress based on current step
  useEffect(() => {
    const steps: QuizStep[] = ['welcome', 'gender', 'activity', 'goals', 'extreme', 'duration', 'arousal', 'coping', 'stress', 'boredom', 'spending', 'personal'];
    const currentIndex = steps.indexOf(currentStep);
    
    // Don't count welcome screen in progress calculation
    const progress = currentStep === 'welcome' 
      ? 0 
      : (currentIndex) / (steps.length - 1);
    
    progressValue.value = withTiming(progress, { duration: 600 });
    
    // If we're at the spending step, progress to personal info
    if (currentStep === 'spending' && quizData.spentMoney) {
      const timer = setTimeout(() => {
        setCurrentStep('personal');
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [currentStep, quizData]);
  
  // Animated progress style
  const progressAnimatedStyle = useAnimatedStyle(() => {
    return {
      width: `${progressValue.value * 100}%`,
    };
  });
  
  // Handle welcome screen continuation
  const handleWelcomeContinue = () => {
    setCurrentStep('gender');
  };
  
  // Handle data updates and automatic progression
  const handleDataUpdate = (step: QuizStep, value: string) => {
    // Map steps to the corresponding data property names
    const dataMapping: Record<QuizStep, keyof QuizData> = {
      welcome: 'gender', // Not used but needed for type safety
      gender: 'gender',
      activity: 'pornFrequency',
      goals: 'referralSource',
      extreme: 'extremeContent',
      duration: 'struggleDuration',
      arousal: 'arousalDifficulty',
      coping: 'copingUse',
      stress: 'stressUse',
      boredom: 'boredomUse',
      spending: 'spentMoney',
      personal: 'personalInfo',
    };

    // Update the relevant property in quizData
    const propertyToUpdate = dataMapping[step];
    const newQuizData = { ...quizData, [propertyToUpdate]: value };
    setQuizData(newQuizData);
    
    // Automatically progress to next step after selection
    const steps: QuizStep[] = ['welcome', 'gender', 'activity', 'goals', 'extreme', 'duration', 'arousal', 'coping', 'stress', 'boredom', 'spending', 'personal'];
    const currentIndex = steps.indexOf(step);
    
    if (currentIndex < steps.length - 1) {
      // Add a small delay for a better visual experience
      setTimeout(() => {
        setCurrentStep(steps[currentIndex + 1]);
      }, 500);
    }
  };
  
  // Handle going back
  const handleBack = () => {
    const steps: QuizStep[] = ['welcome', 'gender', 'activity', 'goals', 'extreme', 'duration', 'arousal', 'coping', 'stress', 'boredom', 'spending', 'personal'];
    const currentIndex = steps.indexOf(currentStep);
    
    if (currentIndex > 1) { // Don't go back to welcome screen
      setCurrentStep(steps[currentIndex - 1]);
    }
  };
  
  // Handle quiz completion
  const handleQuizComplete = (data: QuizData) => {
    if (onComplete && !isLoading) {
      onComplete(data);
    }
  };
  
  // Render the current step
  const renderStep = () => {
    switch (currentStep) {
      case 'welcome':
        return (
          <View style={styles.stepContainer}>
            <QuizWelcome
              onContinue={handleWelcomeContinue}
            />
          </View>
        );
        
      case 'gender':
        return (
          <View style={styles.stepContainer}>
            <QuizGender 
              selectedGender={quizData.gender}
              onSelectGender={(gender: string) => handleDataUpdate('gender', gender)} 
              questionNumber={1}
            />
          </View>
        );
        
      case 'activity':
        return (
          <View style={styles.stepContainer}>
            <QuizActivity 
              selectedActivity={quizData.pornFrequency}
              onSelectActivity={(activity: string) => handleDataUpdate('activity', activity)} 
              questionNumber={2}
            />
          </View>
        );
        
      case 'goals':
        return (
          <View style={styles.stepContainer}>
            <QuizGoals 
              selectedGoal={quizData.referralSource}
              onSelectGoal={(goal: string) => handleDataUpdate('goals', goal)} 
              questionNumber={3}
            />
          </View>
        );
        
      case 'extreme':
        return (
          <View style={styles.stepContainer}>
            <QuizExtreme 
              selectedOption={quizData.extremeContent}
              onSelectOption={(option: string) => handleDataUpdate('extreme', option)} 
              questionNumber={4}
            />
          </View>
        );
        
      case 'duration':
        return (
          <View style={styles.stepContainer}>
            <QuizDuration 
              selectedDuration={quizData.struggleDuration}
              onSelectDuration={(duration: string) => handleDataUpdate('duration', duration)} 
              questionNumber={5}
            />
          </View>
        );
        
      case 'arousal':
        return (
          <View style={styles.stepContainer}>
            <QuizArousal 
              selectedOption={quizData.arousalDifficulty}
              onSelectOption={(option: string) => handleDataUpdate('arousal', option)} 
              questionNumber={6}
            />
          </View>
        );
        
      case 'coping':
        return (
          <View style={styles.stepContainer}>
            <QuizCoping 
              selectedOption={quizData.copingUse}
              onSelectOption={(option: string) => handleDataUpdate('coping', option)} 
              questionNumber={7}
            />
          </View>
        );
        
      case 'stress':
        return (
          <View style={styles.stepContainer}>
            <QuizStress 
              selectedOption={quizData.stressUse}
              onSelectOption={(option: string) => handleDataUpdate('stress', option)} 
              questionNumber={8}
            />
          </View>
        );
        
      case 'boredom':
        return (
          <View style={styles.stepContainer}>
            <QuizBoredom 
              selectedOption={quizData.boredomUse}
              onSelectOption={(option: string) => handleDataUpdate('boredom', option)} 
              questionNumber={9}
            />
          </View>
        );
        
      case 'spending':
        return (
          <View style={styles.stepContainer}>
            <QuizSpending 
              selectedOption={quizData.spentMoney}
              onSelectOption={(option: string) => handleDataUpdate('spending', option)} 
              questionNumber={10}
            />
          </View>
        );
        
      case 'personal':
        return (
          <View style={styles.stepContainer}>
            <QuizPersonal 
              personalInfo={quizData.personalInfo}
              onUpdateInfo={(info: PersonalInfo) => {
                const newQuizData = { ...quizData, personalInfo: info };
                setQuizData(newQuizData);
              }} 
              onComplete={() => handleQuizComplete(quizData)}
              isLoading={isLoading}
            />
          </View>
        );
        
      default:
        return null;
    }
  };
  
  // Calculate current step number for display
  const getStepInfo = () => {
    // Welcome is not counted as a question
    if (currentStep === 'welcome') {
      return { current: 0, total: 11 }; // Show 0/11 during welcome
    } else if (currentStep === 'gender') {
      return { current: 1, total: 11 };
    } else if (currentStep === 'activity') {
      return { current: 2, total: 11 };
    } else if (currentStep === 'goals') {
      return { current: 3, total: 11 };
    } else if (currentStep === 'extreme') {
      return { current: 4, total: 11 };
    } else if (currentStep === 'duration') {
      return { current: 5, total: 11 };
    } else if (currentStep === 'arousal') {
      return { current: 6, total: 11 };
    } else if (currentStep === 'coping') {
      return { current: 7, total: 11 };
    } else if (currentStep === 'stress') {
      return { current: 8, total: 11 };
    } else if (currentStep === 'boredom') {
      return { current: 9, total: 11 };
    } else if (currentStep === 'spending') {
      return { current: 10, total: 11 };
    } else if (currentStep === 'personal') {
      return { current: 11, total: 11 };
    }
    return { current: 0, total: 11 };
  };

  const { current, total } = getStepInfo();
  
  return (
    <View style={styles.container}>
      {/* Progress bar with language selector */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBarContainer}>
          <Animated.View style={[styles.progressBar, progressAnimatedStyle]} />
        </View>
        <TouchableOpacity style={styles.languageSelector}>
          <Text style={styles.flagIcon}>🇺🇸</Text>
          <Text style={styles.languageText}>EN</Text>
        </TouchableOpacity>
      </View>
      
      {/* Back button or login link - hide during welcome screen */}
      {currentStep !== 'welcome' && (
        <View style={styles.navigationRow}>
          {currentStep !== 'gender' ? (
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Ionicons name="arrow-back" size={20} color={theme.colors.primary} />
            </TouchableOpacity>
          ) : (
            <Link href="/login" asChild>
              <TouchableOpacity style={styles.backButton}>
                <Ionicons name="log-in-outline" size={20} color={theme.colors.primary} />
              </TouchableOpacity>
            </Link>
          )}

        </View>
      )}
      
      {/* Main content */}
      <View style={styles.contentContainer}>
        {renderStep()}
      </View>
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  contentContainer: {
    flex: 1,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingTop: 8,
  },
  progressBarContainer: {
    flex: 1,
    height: 6,
    backgroundColor: theme.colors.cardInteractive,
    borderRadius: 3,
    overflow: 'hidden',
    marginRight: 12,
  },
  progressBar: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 3,
  },
  languageSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 70,
    height: 28,
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.small,
    paddingHorizontal: 8,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    ...theme.shadows.light,
  },
  flagIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  languageText: {
    color: theme.colors.textPrimary,
    fontWeight: '600',
    fontSize: 12,
  },
  stepContainer: {
    flex: 1,
    marginBottom: 20, // Add bottom margin to ensure content isn't cut off
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.circle,
    backgroundColor: theme.colors.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.light,
  },
  navigationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepIndicator: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
});

export default SignupQuiz; 