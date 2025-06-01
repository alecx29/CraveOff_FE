'use client';

import { router } from 'expo-router';
import { useCallback, useContext, useState } from 'react';
import { StyleSheet, SafeAreaView } from 'react-native';

import { apiClient } from '@/src/axios/apiClient';
import { BackendRoutes } from '@/src/axios/backendRoutes';
import { CustomAlert } from '@/src/components/alert';
import { CustomPlanLoadingScreen } from '@/src/components/loading-screen';
import { AuthContext } from '@/src/context/AuthContext';
import { useTheme } from '@/src/context/ThemeProvider';
import { SignupQuiz, QuizData } from '@/src/components/signup-quiz';
import GradientBackground from '@/src/screen-components/gradient-background/GradientBackground';

// Personal info interface based on the correct definition
interface PersonalInfo {
  name: string;
  age: string;
}

// Extended user data interface
interface UserData extends QuizData {
  height?: number;
  weight?: number;
  birthdate?: string;
  obstacles?: string[];
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
}

export default function Signup() {
  const { theme } = useTheme();
  const { signUp } = useContext(AuthContext);
  const styles = createStyles(theme);
  
  // State for user data
  const [userData, setUserData] = useState<UserData>({
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
    }
  });
  
  // State to track if quiz is completed
  const [quizCompleted, setQuizCompleted] = useState(false);
  // State to track if analysis is loading
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  // State for error alert
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [errorTitle, setErrorTitle] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  // Function to close the error alert
  const handleCloseAlert = () => {
    setShowErrorAlert(false);
  };
  
  // Handle quiz completion
  const handleQuizComplete = async (quizData: QuizData) => {
    const updatedUserData = {
      ...userData,
      ...quizData
    };
    
    setUserData(updatedUserData);
    setQuizCompleted(true);
    
    try {
      // Set analyzing state to true
      setIsAnalyzing(true);
      
      // Make POST call for analysis with quiz data
      // JWT va fi atașat automat de către interceptorul apiClient dacă există
      const response = await apiClient.post(BackendRoutes.SIGNUP_ANALYSIS, quizData);
      
      // Pentru debugging - verifică dacă cererea include JWT
      console.log('Analysis request completed. JWT should be attached automatically if user is authenticated.');
      
      // Simulate analysis processing time (minimum 4 seconds)
      await new Promise(resolve => setTimeout(resolve, 4000));
      
      // Analysis completed, navigate to analysis-complete screen
      router.push('/(auth)/analysis-complete');
    } catch (error) {
      console.error('Error analyzing quiz data:', error);
      setErrorTitle('Analysis Error');
      setErrorMessage('There was an error analyzing your responses. Please try again.');
      setShowErrorAlert(true);
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  // Handle registration
  const handleRegister = useCallback(
    async (idToken?: string): Promise<void> => {
      try {
        // For now, we'll just log the data and navigate to home
        console.log('Registration data:', userData);
        
        // In a real implementation, you would send this to your API
        // const response = await apiClient.post(BackendRoutes.REGISTER, payload);
        
        // For demo purposes, we'll just navigate to home
        router.push('/');
      } catch (error: any) {
        console.error('Register error:', error);
        setErrorTitle('Registration Error');
        setErrorMessage('There was an error during registration. Please try again.');
        setShowErrorAlert(true);
      }
    },
    [userData, router],
  );

  return (
    <GradientBackground>
      <SafeAreaView style={styles.container}>
        {/* First part: Quiz flow */}
        {!isAnalyzing && <SignupQuiz onComplete={handleQuizComplete} isLoading={isAnalyzing} />}
        
        {/* Loading screen while analyzing */}
        <CustomPlanLoadingScreen visible={isAnalyzing} />
        
        {/* Error Alert */}
        <CustomAlert
          visible={showErrorAlert}
          title={errorTitle}
          message={errorMessage}
          onClose={handleCloseAlert}
          type="error"
        />
        
        {/* We would normally show additional registration steps here 
            after quiz completion */}
      </SafeAreaView>
    </GradientBackground>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
});
