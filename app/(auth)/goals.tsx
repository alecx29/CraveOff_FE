import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, SafeAreaView, View, Image } from 'react-native';
import { router } from 'expo-router';

import GoalsScreen from '@/src/screen-components/goals/GoalsScreen';
import { useTheme } from '@/src/context/ThemeProvider';
import { CustomAlert } from '@/src/components/alert';
import { LinearGradient } from 'expo-linear-gradient';

export default function Goals() {
  const { theme } = useTheme();
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
  
  // Gradient identical cu rating screen
  const colorsMap = theme.colors as Record<string, string>;
  const topPurple = (colorsMap && (colorsMap as any)['primaryDark']) || theme.colors.primary;

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={[topPurple || '#4f46e5', '#2a2654', '#0f0f17', '#000000']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Image
        source={require('@/assets/images/star_background.png')}
        style={styles.starBackground}
        resizeMode="cover"
        pointerEvents="none"
      />
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  starBackground: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.65,
  },
}); 