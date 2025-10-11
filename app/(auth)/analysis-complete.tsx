import React from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, SlideInRight } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/src/context/ThemeProvider';
import GradientBackground from '@/src/screen-components/gradient-background/GradientBackground';
import FixedBottomButton from '@/src/components/FixedBottomButton';

export default function AnalysisComplete() {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  
  // Helper functions to safely access theme colors
  const getColor = (colorName: string, fallbackColor: string): string => {
    const colors = theme.colors as Record<string, string>;
    if (colorName in colors) return colors[colorName];
    return fallbackColor;
  };
  
  // Data for the graph
  const userDependencyLevel = 53; // Over 50%
  const averageDependencyLevel = 23; // Average is 23%
  
  // Handle continue button press
  const handleContinue = () => {
    router.push('/(auth)/symptoms');
  };
  
  return (
    <GradientBackground>
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <StatusBar style="auto" />
        
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View 
            style={styles.contentContainer}
            entering={FadeIn.duration(500)}
          >
            {/* Title with checkmark */}
            <View style={styles.titleContainer}>
              <Animated.Text 
                style={styles.title}
                entering={SlideInRight.duration(500).delay(200)}
              >
                Analysis Complete
              </Animated.Text>
              <Ionicons 
                name="checkmark-circle" 
                size={24} 
                color={getColor('success', '#34C759')} 
                style={styles.checkmarkIcon}
              />
            </View>
            
            {/* Description */}
            <Animated.Text 
              style={styles.description}
              entering={SlideInRight.duration(500).delay(300)}
            >
              We&apos;ve got some news to break to you...
            </Animated.Text>
            
            {/* Graph visualization */}
            <Animated.View 
              style={styles.graphContainer}
              entering={FadeIn.duration(800).delay(400)}
            >
              <Text style={styles.graphTitle}>Your responses indicate a clear dependence on internet porn</Text>
              
              <View style={styles.graphContent}>
                {/* User column */}
                <View style={styles.graphColumn}>
                  <View style={styles.graphLabels}>
                    <View style={[
                      styles.bar, 
                      { 
                        height: `${userDependencyLevel}%`,
                        backgroundColor: getColor('error', '#FF3B30')
                      }
                    ]}>
                      <Text style={styles.barPercentage}>{userDependencyLevel}%</Text>
                    </View>
                  </View>
                  <Text style={styles.graphLabel}>Your level</Text>
                </View>
                
                {/* Average column */}
                <View style={styles.graphColumn}>
                  <View style={styles.graphLabels}>
                    <View style={[
                      styles.bar, 
                      { 
                        height: `${averageDependencyLevel}%`,
                        backgroundColor: getColor('cardInteractive', '#F1F5F9')
                      }
                    ]}>
                      <Text style={styles.barPercentage}>{averageDependencyLevel}%</Text>
                    </View>
                  </View>
                  <Text style={styles.graphLabel}>Average</Text>
                </View>
              </View>
            </Animated.View>
            
            {/* Insight message */}
            <Animated.Text 
              style={styles.insight}
              entering={SlideInRight.duration(500).delay(700)}
            >
              This is an informative result, not a medical diagnosis. If you&apos;re concerned, we encourage you to speak with a medical professional.
            </Animated.Text>
            
            {/* Add padding at the bottom to ensure content is not hidden behind the fixed button */}
            <View style={styles.bottomPadding} />
          </Animated.View>
        </ScrollView>
        
        {/* Fixed bottom button - invisible style */}
        <FixedBottomButton
          title="Check Your Symptoms"
          onPress={handleContinue}
          icon="arrow-forward"
          customStyle={{ 
            backgroundColor: 'transparent', 
            borderTopWidth: 0,
            elevation: 0,
            shadowOpacity: 0
          }}
          buttonStyle={{ backgroundColor: theme.colors.primary }}
          extendUnderIOSBottom={false}
        />
      </SafeAreaView>
    </GradientBackground>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  contentContainer: {
    alignItems: 'center',
    width: '100%',
    paddingBottom: 20,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    marginTop: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  checkmarkIcon: {
    marginLeft: 8,
  },
  description: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
    paddingHorizontal: 4,
  },
  graphContainer: {
    width: '100%',
    marginBottom: 24,
  },
  graphTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 20,
    textAlign: 'center',
  },
  graphContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    height: 180, // Reduced height for small screens
    marginBottom: 16,
    paddingHorizontal: 0,
  },
  graphColumn: {
    alignItems: 'center',
    width: '30%',
  },
  graphLabels: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
  },
  bar: {
    width: '65%',
    borderRadius: 8,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 8,
    minHeight: 40,
    overflow: 'hidden',
  },
  barPercentage: {
    fontSize: 15,
    fontWeight: 'bold',
    color: 'white',
  },
  graphLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.textPrimary,
    marginTop: 8,
  },
  insight: {
    fontSize: 15,
    fontStyle: 'italic',
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
    paddingHorizontal: 8,
    paddingVertical: 16,
  },
  bottomPadding: {
    height: 130, // Further increased padding at the bottom
  },
}); 