import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, SafeAreaView } from 'react-native';
import { router } from 'expo-router';

import GoalsScreen from '@/src/screen-components/goals/GoalsScreen';
import { useTheme } from '@/src/context/ThemeProvider';
import { CustomAlert } from '@/src/components/alert';
import GradientBackground from '@/src/screen-components/gradient-background/GradientBackground';

export default function Goals() {
  useTheme();
  const [showError, setShowError] = useState(false);
  const [errorMessage] = useState('');
  
  // After goals, go to rating screen
  const handleComplete = () => {
    router.push('/conquer/rating');
  };
  
  // Note: handleError kept for potential future inline errors
  
  const handleCloseError = () => {
    setShowError(false);
  };
  
  return (
    <GradientBackground>
      <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]}>
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
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
}); 