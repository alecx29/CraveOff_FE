import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, SafeAreaView } from 'react-native';
import { router } from 'expo-router';

import GoalsScreen from '@/src/screen-components/goals/GoalsScreen';
import { useTheme } from '@/src/context/ThemeProvider';
import { CustomAlert } from '@/src/components/alert';

export default function Goals() {
  const { theme } = useTheme();
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Add onComplete handler to navigate to subscription
  const handleComplete = () => {
    router.push('/(auth)/subscription');
  };
  
  // Error handling
  const handleError = (message: string) => {
    setErrorMessage(message);
    setShowError(true);
  };
  
  const handleCloseError = () => {
    setShowError(false);
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar style="auto" />
      <GoalsScreen onComplete={handleComplete} />
      
      {/* Error Alert - in caz că avem nevoie de un alt nivel de eroare pe ecran */}
      <CustomAlert
        visible={showError}
        title="Error"
        message={errorMessage}
        onClose={handleCloseError}
        type="error"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
}); 