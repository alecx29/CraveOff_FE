import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, PanResponder, Animated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/context/ThemeProvider';

// DayCircle component with proper types
interface DayCircleProps {
  day: string;
  text: string;
  isToday: boolean;
  logStatus: 'clean' | 'not-clean' | 'no-log';
}

const DayCircle = ({ day, text, isToday, logStatus }: DayCircleProps) => {
  const { theme } = useTheme();
  
  // Component-specific styles
  const circleStyles = StyleSheet.create({
    dayContainer: {
      alignItems: 'center',
    },
    dayCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.colors.cardInteractive,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 4,
    },
    dayText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.textPrimary,
    },
    dayLabel: {
      fontSize: 12,
      color: theme.colors.textMuted,
    },
    todayCircle: {
      borderWidth: 2,
      borderColor: theme.colors.primary,
      backgroundColor: 'transparent',
    },
    checkmark: {
      color: theme.colors.primary,
      fontSize: 20,
      fontWeight: 'bold',
    },
    xMark: {
      color: '#e74c3c', // Subtle red color for X
      fontSize: 18,
    },
    noLog: {
      color: theme.colors.textMuted, // Gray for no log
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 5
    }
  });
  
  // Render the appropriate status indicator based on logStatus
  const renderStatusIndicator = () => {
    switch (logStatus) {
      case 'clean':
        return <Ionicons name="checkmark-sharp" size={20} style={circleStyles.checkmark} />;
      case 'not-clean':
        return <Ionicons name="close" style={circleStyles.xMark} />;
      case 'no-log':
        return <Text style={circleStyles.noLog}>-</Text>;
      default:
        return <Text style={circleStyles.dayText}>{day}</Text>;
    }
  };
  
  return (
    <View style={circleStyles.dayContainer}>
      <View style={[
        circleStyles.dayCircle,
        isToday && circleStyles.todayCircle
      ]}>
        {renderStatusIndicator()}
      </View>
      <Text style={circleStyles.dayLabel}>{text}</Text>
    </View>
  );
};

// Helper function to get the date string for a specific day of the week and offset weeks
const getDateStringForDay = (dayIndex: number, weekOffset: number = 0): string => {
  const today = new Date();
  const currentDayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  // Calculate the difference between the target day and current day
  // Add weekOffset * 7 to move to previous/next weeks
  const diff = dayIndex - currentDayOfWeek + (weekOffset * 7);
  
  // Create a new date by adding the difference
  const targetDate = new Date(today);
  targetDate.setDate(today.getDate() + diff);
  
  // Format the date as YYYY-MM-DD
  return targetDate.toISOString().split('T')[0];
};

interface WeekBarProps {
  weekLogsStatus: Array<'clean' | 'not-clean' | 'no-log'>;
  previousWeekLogsStatus?: Array<'clean' | 'not-clean' | 'no-log'>;
}

const WeekBar = ({ weekLogsStatus, previousWeekLogsStatus: propsPreviousWeekStatus }: WeekBarProps) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  
  // State to track current week offset (0 = current week, -1 = previous week)
  const [weekOffset, setWeekOffset] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Stare pentru a controla ce element este în față
  const [frontElement, setFrontElement] = useState<'current' | 'previous'>('current');
  
  // State for previous week data
  const [previousWeekLogsStatus, setPreviousWeekLogsStatus] = useState<Array<'clean' | 'not-clean' | 'no-log'>>([
    'no-log', 'no-log', 'no-log', 'no-log', 'no-log', 'no-log', 'no-log'
  ]);
  
  // Update previousWeekLogsStatus when props change
  useEffect(() => {
    if (propsPreviousWeekStatus) {
      setPreviousWeekLogsStatus(propsPreviousWeekStatus);
    }
  }, [propsPreviousWeekStatus]);
  
  // Animated values for current week and previous week positioning
  const currentWeekPosition = useRef(new Animated.Value(0)).current;
  const previousWeekPosition = useRef(new Animated.Value(-400)).current; // Start off-screen left
  
  // Animated value for title opacity
  const titleOpacity = useRef(new Animated.Value(1)).current;
  
  // Translation value for gesture tracking (temporary during swipe)
  const gestureTranslation = useRef(new Animated.Value(0)).current;
  
  // Animații pentru opacitate
  const currentWeekOpacity = useRef(new Animated.Value(1)).current;
  const previousWeekOpacity = useRef(new Animated.Value(0)).current;
  
  // Debug log pentru a vedea state-ul
  useEffect(() => {
    console.log(`WeekBar weekOffset: ${weekOffset}`);
  }, [weekOffset]);
  
  // Folosită pentru a schimba elementul din față
  useEffect(() => {
    if (weekOffset === 0) {
      setFrontElement('current');
    } else if (weekOffset === -1) {
      setFrontElement('previous');
    }
  }, [weekOffset]);
  
  // Create PanResponder for handling swipe gestures
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        if (isAnimating) return false;
        
        // Only capture horizontal movements that are significant
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 2 && 
               Math.abs(gestureState.dx) > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        // Apply gesture translation directly
        gestureTranslation.setValue(gestureState.dx);
        
        // Ajustează opacitatea în funcție de direcția gestului și de weekOffset
        if (weekOffset === 0 && gestureState.dx > 0) {
          // Către săptămâna anterioară: facem fade-in săptămânii anterioare
          const progress = Math.min(1, Math.abs(gestureState.dx) / 200);
          previousWeekOpacity.setValue(progress);
          currentWeekOpacity.setValue(1 - progress * 0.3);
        } else if (weekOffset === -1 && gestureState.dx < 0) {
          // Către săptămâna curentă: facem fade-in săptămânii curente
          const progress = Math.min(1, Math.abs(gestureState.dx) / 200);
          currentWeekOpacity.setValue(progress);
          previousWeekOpacity.setValue(1 - progress * 0.3);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        // Reset gesture translation
        gestureTranslation.setValue(0);
        
        if (isAnimating) return;
        
        // Determine if swipe was significant enough to trigger week change
        const velocityThreshold = 0.3; // Minimum velocity to trigger
        const distanceThreshold = 60; // Distance threshold
        
        const isSignificantSwipe = 
          Math.abs(gestureState.dx) > distanceThreshold || 
          Math.abs(gestureState.vx) > velocityThreshold;
        
        console.log(`PanResponder released: dx=${gestureState.dx}, vx=${gestureState.vx}, weekOffset=${weekOffset}, significant=${isSignificantSwipe}`);
        
        // Atunci când weekOffset este 0 (săptămâna curentă), și swipe-ul este spre dreapta (dx > 0)
        // Trebuie să mergem la săptămâna anterioară (-1)
        if (gestureState.dx > 0 && weekOffset === 0 && isSignificantSwipe) {
          console.log("Triggering animation to last week");
          animateToLastWeek();
        } 
        // Atunci când weekOffset este -1 (săptămâna anterioară), și swipe-ul este spre stânga (dx < 0)
        // Trebuie să revenim la săptămâna curentă (0)
        else if (gestureState.dx < 0 && weekOffset === -1 && isSignificantSwipe) {
          console.log("Triggering animation to current week");
          animateToCurrentWeek();
        } else {
          // Reset current positions
          if (weekOffset === 0) {
            // Revenim la săptămâna curentă
            Animated.parallel([
              Animated.spring(currentWeekPosition, {
                toValue: 0,
                friction: 5,
                tension: 40,
                useNativeDriver: true
              }),
              Animated.timing(currentWeekOpacity, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true
              }),
              Animated.timing(previousWeekOpacity, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true
              })
            ]).start();
          } else {
            // Revenim la săptămâna anterioară
            Animated.parallel([
              Animated.spring(previousWeekPosition, {
                toValue: 0,
                friction: 5,
                tension: 40,
                useNativeDriver: true
              }),
              Animated.timing(previousWeekOpacity, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true
              }),
              Animated.timing(currentWeekOpacity, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true
              })
            ]).start();
          }
        }
      }
    })
  ).current;
  
  // Function to animate to previous week
  const animateToLastWeek = () => {
    setIsAnimating(true);
    console.log("animateToLastWeek executing");
    
    // Asigură-te că săptămâna anterioară este pregătită pentru a intra din stânga
    previousWeekPosition.setValue(-400);
    
    // Asigură-te că săptămâna anterioară este vizibilă înainte de animație
    previousWeekOpacity.setValue(1);
    
    // Pregătim animațiile
    const titleFadeOut = Animated.timing(titleOpacity, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true
    });
    
    const currentWeekExit = Animated.timing(currentWeekPosition, {
      toValue: 400, // Move off-screen right
      duration: 250,
      useNativeDriver: true
    });
    
    const currentWeekFadeOut = Animated.timing(currentWeekOpacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true
    });
    
    const previousWeekEnter = Animated.spring(previousWeekPosition, {
      toValue: 0, // Move to center
      friction: 8,
      tension: 40,
      useNativeDriver: true
    });
    
    // Executăm primele animații în paralel
    Animated.parallel([
      titleFadeOut,
      currentWeekExit,
      currentWeekFadeOut
    ]).start(() => {
      // Actualizăm offset-ul și facem animația de intrare
      setWeekOffset(-1);
      
      // Facem animația de fade-in pentru titlu
      Animated.timing(titleOpacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true
      }).start();
      
      // Aducem săptămâna anterioară în prim-plan
      previousWeekEnter.start(() => {
        setIsAnimating(false);
      });
    });
  };
  
  // Function to animate back to current week
  const animateToCurrentWeek = () => {
    setIsAnimating(true);
    console.log("animateToCurrentWeek executing");
    
    // Pregătește poziția inițială a săptămânii curente pentru animație
    currentWeekPosition.setValue(400); // Start off-screen right
    
    // Asigură-te că săptămâna curentă este vizibilă înainte de animație
    currentWeekOpacity.setValue(1);
    
    // Pregătim animațiile
    const titleFadeOut = Animated.timing(titleOpacity, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true
    });
    
    const previousWeekExit = Animated.timing(previousWeekPosition, {
      toValue: -400, // Move off-screen left
      duration: 250,
      useNativeDriver: true
    });
    
    const previousWeekFadeOut = Animated.timing(previousWeekOpacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true
    });
    
    const currentWeekEnter = Animated.spring(currentWeekPosition, {
      toValue: 0, // Move to center
      friction: 8,
      tension: 40,
      useNativeDriver: true
    });
    
    // Executăm primele animații în paralel
    Animated.parallel([
      titleFadeOut,
      previousWeekExit,
      previousWeekFadeOut
    ]).start(() => {
      // Actualizăm offset-ul și facem animația de intrare
      setWeekOffset(0);
      
      // Facem animația de fade-in pentru titlu
      Animated.timing(titleOpacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true
      }).start();
      
      // Aducem săptămâna curentă în prim-plan
      currentWeekEnter.start(() => {
        setIsAnimating(false);
      });
    });
  };
  
  // Reset animation values on mount
  useEffect(() => {
    // Setăm valorile inițiale
    currentWeekPosition.setValue(0);
    previousWeekPosition.setValue(-400);
    titleOpacity.setValue(1);
    gestureTranslation.setValue(0);
    currentWeekOpacity.setValue(1);
    previousWeekOpacity.setValue(0);
    
    // Asigurăm că ștergem orice animație în curs
    return () => {
      // Folosim oprire corectă pentru animații
      if (Platform.OS !== 'web') {
        currentWeekPosition.stopAnimation();
        previousWeekPosition.stopAnimation();
        titleOpacity.stopAnimation();
        gestureTranslation.stopAnimation();
        currentWeekOpacity.stopAnimation();
        previousWeekOpacity.stopAnimation();
      }
    };
  }, []);
  
  // Determine current day
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  // Asigură-te că ambele seturi de date sunt vizibile în funcție de weekOffset
  const currentWeekStyle = {
    position: 'absolute' as const,
    width: '100%' as const,
    top: 0,
    left: 0,
    right: 0,
    zIndex: frontElement === 'current' ? 2 : 1
  };
  
  const previousWeekStyle = {
    position: 'absolute' as const,
    width: '100%' as const,
    top: 0,
    left: 0,
    right: 0,
    zIndex: frontElement === 'previous' ? 2 : 1
  };
  
  // Compute current week position with gesture offset
  const currentWeekAnimatedStyle = {
    transform: [
      { 
        translateX: Animated.add(
          currentWeekPosition,
          weekOffset === 0 ? gestureTranslation : new Animated.Value(0)
        ) 
      }
    ],
    opacity: currentWeekOpacity,
    ...currentWeekStyle
  };
  
  // Compute previous week position with gesture offset
  const previousWeekAnimatedStyle = {
    transform: [
      { 
        translateX: Animated.add(
          previousWeekPosition,
          weekOffset === -1 ? gestureTranslation : new Animated.Value(0)
        ) 
      }
    ],
    opacity: previousWeekOpacity,
    ...previousWeekStyle
  };
  
  // Determine if a date is today
  const isToday = (dayIndex: number) => {
    return dayIndex === dayOfWeek;
  };
  
  return (
    <View style={styles.weekCard}>
      <View style={styles.titleRow}>
        <Animated.Text style={[styles.sectionTitle, { opacity: titleOpacity }]}>
          {weekOffset === 0 ? "This Week" : "Last Week"}
        </Animated.Text>
        
        {weekOffset === 0 && (
          <Animated.View style={[styles.swipeHint, { opacity: weekOffset === 0 ? 0.7 : 0 }]}>
            <Text style={styles.swipeHintText}>Swipe to see last week</Text>
            <Ionicons name="chevron-back" size={16} color={theme.colors.textMuted} />
          </Animated.View>
        )}
        
        {weekOffset === -1 && (
          <Animated.View style={[styles.swipeHint, { opacity: weekOffset === -1 ? 0.7 : 0 }]}>
            <Ionicons name="chevron-forward" size={16} color={theme.colors.textMuted} />
            <Text style={styles.swipeHintText}>Swipe to see this week</Text>
          </Animated.View>
        )}
      </View>
      
      <View style={styles.daysContainer} {...panResponder.panHandlers}>
        {/* Current week */}
        <Animated.View style={[styles.daysRow, currentWeekAnimatedStyle]}>
          <DayCircle day="S" text="Sun" isToday={isToday(0)} logStatus={weekLogsStatus[0]} />
          <DayCircle day="M" text="Mon" isToday={isToday(1)} logStatus={weekLogsStatus[1]} />
          <DayCircle day="T" text="Tue" isToday={isToday(2)} logStatus={weekLogsStatus[2]} />
          <DayCircle day="W" text="Wed" isToday={isToday(3)} logStatus={weekLogsStatus[3]} />
          <DayCircle day="T" text="Thu" isToday={isToday(4)} logStatus={weekLogsStatus[4]} />
          <DayCircle day="F" text="Fri" isToday={isToday(5)} logStatus={weekLogsStatus[5]} />
          <DayCircle day="S" text="Sat" isToday={isToday(6)} logStatus={weekLogsStatus[6]} />
        </Animated.View>
        
        {/* Previous week */}
        <Animated.View style={[styles.daysRow, previousWeekAnimatedStyle]}>
          <DayCircle day="S" text="Sun" isToday={false} logStatus={previousWeekLogsStatus[0]} />
          <DayCircle day="M" text="Mon" isToday={false} logStatus={previousWeekLogsStatus[1]} />
          <DayCircle day="T" text="Tue" isToday={false} logStatus={previousWeekLogsStatus[2]} />
          <DayCircle day="W" text="Wed" isToday={false} logStatus={previousWeekLogsStatus[3]} />
          <DayCircle day="T" text="Thu" isToday={false} logStatus={previousWeekLogsStatus[4]} />
          <DayCircle day="F" text="Fri" isToday={false} logStatus={previousWeekLogsStatus[5]} />
          <DayCircle day="S" text="Sat" isToday={false} logStatus={previousWeekLogsStatus[6]} />
        </Animated.View>
      </View>
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  weekCard: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.medium,
    padding: 16,
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  daysContainer: {
    position: 'relative',
    height: 60, // Make sure this is tall enough for the day circles
    overflow: 'hidden'
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  swipeHint: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  swipeHintText: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginHorizontal: 4,
  }
});

export default WeekBar; 