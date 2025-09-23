import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/context/ThemeProvider';
import { LinearGradient } from 'expo-linear-gradient';

// Helper function to safely access theme colors
const getColor = (theme: any, colorName: string, fallbackColor: string): string => {
  const colors = theme.colors as Record<string, string>;
  if (colorName in colors) return colors[colorName];
  return fallbackColor;
};

// DayCircle component with proper types
interface DayCircleProps {
  day: string;
  text: string;
  isToday: boolean;
  logStatus: 'clean' | 'not-clean' | 'no-log';
  isFutureDay: boolean;
}

// Memoize DayCircle component to prevent unnecessary re-renders
const DayCircle = React.memo(({ day, text, isToday, logStatus, isFutureDay }: DayCircleProps) => {
  const { theme } = useTheme();
  
  // Component-specific styles
  const circleStyles = StyleSheet.create({
    dayContainer: {
      alignItems: 'center',
      flex: 1,
      paddingHorizontal: 2,
    },
    dayCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: getColor(theme, 'cardInteractive', '#F1F5F9'),
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 4,
    },
    dayText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.textPrimary,
    },
    dayLabel: {
      fontSize: 10,
      color: theme.colors.textMuted,
      textAlign: 'center',
    },
    todayCircle: {
      borderWidth: 2,
      borderColor: theme.colors.primary,
      backgroundColor: 'transparent',
    },
    futureCircle: {
      backgroundColor: getColor(theme, 'cardInteractive', '#F1F5F9'),
      opacity: 0.7,
    },
    checkmark: {
      color: theme.colors.primary,
      fontSize: 18,
      fontWeight: 'bold',
    },
    xMark: {
      color: '#e74c3c', // Subtle red color for X
      fontSize: 16,
    },
    noLog: {
      color: theme.colors.textMuted, // Gray for no log
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 5
    },
    futureText: {
      color: theme.colors.textMuted,
      opacity: 0.7,
    }
  });
  
  // Render the appropriate status indicator based on logStatus
  const renderStatusIndicator = () => {
    // Future days should always show the day number
    if (isFutureDay) {
      return <Text style={[circleStyles.dayText, circleStyles.futureText]}>{day}</Text>;
    }
    
    switch (logStatus) {
      case 'clean':
        return <Ionicons name="checkmark-sharp" size={18} style={circleStyles.checkmark} />;
      case 'not-clean':
        return <Ionicons name="close" size={16} style={circleStyles.xMark} />;
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
        isToday && circleStyles.todayCircle,
        isFutureDay && circleStyles.futureCircle
      ]}>
        {renderStatusIndicator()}
      </View>
      <Text style={[
        circleStyles.dayLabel, 
        isFutureDay && circleStyles.futureText
      ]} numberOfLines={1}>{text}</Text>
    </View>
  );
});

// Set display name for the memoized component
DayCircle.displayName = 'DayCircle';

// Type for a week of logs
type WeekLogs = Array<'clean' | 'not-clean' | 'no-log'>;

// Define week index type for better readability
type WeekIndex = 0 | 1 | 2; // 0 = current week, 1 = last week, 2 = two weeks ago

interface WeekBarProps {
  weekLogsStatus: WeekLogs;
  previousWeekLogsStatus?: WeekLogs;
  twoWeeksAgoLogsStatus?: WeekLogs;
}

const WeekBar = ({ 
  weekLogsStatus, 
  previousWeekLogsStatus: propsPreviousWeekStatus,
  twoWeeksAgoLogsStatus: propsTwoWeeksAgoStatus 
}: WeekBarProps) => {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  
  // State for previous weeks data
  const [previousWeekLogs, setPreviousWeekLogs] = useState<WeekLogs>([
    'no-log', 'no-log', 'no-log', 'no-log', 'no-log', 'no-log', 'no-log'
  ]);
  
  const [twoWeeksAgoLogs, setTwoWeeksAgoLogs] = useState<WeekLogs>([
    'no-log', 'no-log', 'no-log', 'no-log', 'no-log', 'no-log', 'no-log'
  ]);
  
  // State to track which week is currently shown (0 = current week, 1 = last week, 2 = two weeks ago)
  const [currentWeekIndex, setCurrentWeekIndex] = useState<WeekIndex>(0);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(1)).current;
  
  // Update previous weeks data when props change
  useEffect(() => {
    if (propsPreviousWeekStatus) {
      setPreviousWeekLogs(propsPreviousWeekStatus);
    }
    
    if (propsTwoWeeksAgoStatus) {
      setTwoWeeksAgoLogs(propsTwoWeeksAgoStatus);
    }
  }, [propsPreviousWeekStatus, propsTwoWeeksAgoStatus]);
  
  // Optimize animation configuration
  const animationConfig = useMemo(() => ({
    duration: Platform.OS === 'ios' ? 200 : 150, // Slightly longer duration on iOS for smoother animation
    useNativeDriver: true,
    isInteraction: false, // Reduce interaction tracking overhead
  }), []);
  
  // Animate between weeks when selection changes - optimized with useCallback
  const animateWeekChange = useCallback(() => {
    // Fade out
    Animated.timing(fadeAnim, {
      toValue: 0,
      ...animationConfig
    }).start(() => {
      // Fade back in
      Animated.timing(fadeAnim, {
        toValue: 1,
        ...animationConfig
      }).start();
    });
  }, [fadeAnim, animationConfig]);
  
  // Use effect to trigger animation only when week index changes
  useEffect(() => {
    animateWeekChange();
  }, [currentWeekIndex, animateWeekChange]);
  
  // Determine current day
  const today = useMemo(() => new Date(), []);
  const dayOfWeek = useMemo(() => today.getDay(), [today]); // 0 = Sunday, 1 = Monday, etc.
  
  // Determine if a date is today - memoized
  const isToday = useCallback((dayIndex: number, weekIndex: number) => {
    return dayIndex === dayOfWeek && weekIndex === 0; // Only current week can have "today"
  }, [dayOfWeek]);
  
  // Determine if a date is in the future - memoized
  const isFutureDay = useCallback((dayIndex: number, weekIndex: number) => {
    // Only applies to the current week
    if (weekIndex !== 0) return false;
    
    // Convert both to the same scale (0-6 where 0 is Sunday)
    // dayIndex is in Date.getDay() format where 0 is Sunday
    return dayIndex > dayOfWeek;
  }, [dayOfWeek]);
  
  // Array of day labels in correct order (Sunday to Saturday) - memoized
  const dayLabels = useMemo(() => [
    { short: "S", full: "Sun", index: 0 },
    { short: "M", full: "Mon", index: 1 },
    { short: "T", full: "Tue", index: 2 },
    { short: "W", full: "Wed", index: 3 },
    { short: "T", full: "Thu", index: 4 },
    { short: "F", full: "Fri", index: 5 },
    { short: "S", full: "Sat", index: 6 },
  ], []);
  
  // Handle week navigation - memoized
  const navigateToWeek = useCallback((direction: 'previous' | 'next') => {
    setCurrentWeekIndex(prevIndex => {
      if (direction === 'previous') {
        // Can't go further back than 2 weeks ago
        return prevIndex < 2 ? (prevIndex + 1) as WeekIndex : prevIndex;
      } else {
        // Can't go further forward than current week
        return prevIndex > 0 ? (prevIndex - 1) as WeekIndex : prevIndex;
      }
    });
  }, []);
  
  // Set specific week index directly - memoized
  const setSpecificWeek = useCallback((index: WeekIndex) => {
    setCurrentWeekIndex(index);
  }, []);
  
  // Get week title based on current index - memoized
  const weekTitle = useMemo(() => {
    switch (currentWeekIndex) {
      case 0:
        return "This Week";
      case 1:
        return "Last Week";
      case 2:
        return "2 Weeks Ago";
      default:
        return "This Week";
    }
  }, [currentWeekIndex]);
  
  // Get logs for current week index - memoized
  const currentWeekLogs = useMemo(() => {
    switch (currentWeekIndex) {
      case 0:
        return weekLogsStatus;
      case 1:
        return previousWeekLogs;
      case 2:
        return twoWeeksAgoLogs;
      default:
        return weekLogsStatus;
    }
  }, [currentWeekIndex, weekLogsStatus, previousWeekLogs, twoWeeksAgoLogs]);
  
  // Render days row for the selected week - memoized
  const daysRow = useMemo(() => (
    <View style={styles.daysRow}>
      {dayLabels.map((day) => {
        const dayIndex = day.index;
        const futureDay = isFutureDay(dayIndex, currentWeekIndex);
        
        // For future days, always show no-log
        const logStatus = futureDay ? 'no-log' : currentWeekLogs[dayIndex];
        
        return (
          <DayCircle 
            key={day.full}
            day={day.short} 
            text={day.full} 
            isToday={isToday(dayIndex, currentWeekIndex)} 
            logStatus={logStatus}
            isFutureDay={futureDay}
          />
        );
      })}
    </View>
  ), [dayLabels, currentWeekIndex, currentWeekLogs, isFutureDay, isToday, styles.daysRow]);
  
  // Memoize pagination dots
  const paginationDots = useMemo(() => (
    <View style={styles.paginationContainer}>
      <TouchableOpacity 
        onPress={() => setSpecificWeek(2)}
        style={[
          styles.paginationDot, 
          currentWeekIndex === 2 && styles.paginationDotActive
        ]}
      />
      <TouchableOpacity 
        onPress={() => setSpecificWeek(1)}
        style={[
          styles.paginationDot, 
          currentWeekIndex === 1 && styles.paginationDotActive
        ]}
      />
      <TouchableOpacity 
        onPress={() => setSpecificWeek(0)}
        style={[
          styles.paginationDot, 
          currentWeekIndex === 0 && styles.paginationDotActive
        ]}
      />
    </View>
  ), [currentWeekIndex, setSpecificWeek, styles]);
  
  // Memoize navigation buttons
  const navigationButtons = useMemo(() => (
    <View style={styles.navigationContainer}>
      <TouchableOpacity 
        style={[
          styles.navButton,
          currentWeekIndex === 2 && styles.navButtonDisabled
        ]}
        onPress={() => navigateToWeek('previous')}
        disabled={currentWeekIndex === 2}
        activeOpacity={0.7}
      >
        <Ionicons 
          name="chevron-back" 
          size={20} 
          color={currentWeekIndex < 2 ? theme.colors.primary : getColor(theme, 'textMuted', '#A0AEC0')} 
        />
        <Text style={[
          styles.navButtonText,
          currentWeekIndex === 2 && styles.navButtonTextDisabled
        ]}>Previous</Text>
      </TouchableOpacity>
      
      <View style={styles.navSeparator} />
      
      <TouchableOpacity 
        style={[
          styles.navButton,
          currentWeekIndex === 0 && styles.navButtonDisabled
        ]}
        onPress={() => navigateToWeek('next')}
        disabled={currentWeekIndex === 0}
        activeOpacity={0.7}
      >
        <Text style={[
          styles.navButtonText,
          currentWeekIndex === 0 && styles.navButtonTextDisabled
        ]}>Next</Text>
        <Ionicons 
          name="chevron-forward" 
          size={20} 
          color={currentWeekIndex > 0 ? theme.colors.primary : getColor(theme, 'textMuted', '#A0AEC0')} 
        />
      </TouchableOpacity>
    </View>
  ), [currentWeekIndex, navigateToWeek, styles, theme]);
  
  return (
    <View style={styles.weekCard}>
      <LinearGradient
        colors={['rgba(59, 130, 246, 0.13)', 'rgba(37, 99, 235, 0.09)']}
        style={styles.weekGradient}
      >
        <View style={styles.titleRow}>
          <Text style={styles.sectionTitle}>
            {weekTitle}
          </Text>
          
          {/* Pagination dots */}
          {paginationDots}
        </View>
        
        <Animated.View style={[
          styles.weekContentContainer,
          { opacity: fadeAnim }
        ]}>
          {daysRow}
        </Animated.View>
        
        {/* Navigation buttons */}
        {navigationButtons}
      </LinearGradient>
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  weekCard: {
    backgroundColor: 'transparent',
    borderRadius: theme.borderRadius.medium,
    marginBottom: 16,
    overflow: 'hidden',
    ...Platform.select({
      android: {
        elevation: 1, // Add slight elevation on Android for better performance
      },
      ios: {
        shadowColor: 'transparent', // Disable shadows on iOS for better performance
      }
    }),
  },
  weekGradient: {
    padding: 16,
    borderRadius: theme.borderRadius.medium,
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
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  paginationContainer: {
    flexDirection: 'row',
    height: 10,
  },
  paginationDot: {
    height: 8,
    width: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.textMuted,
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: theme.colors.primary,
    width: 12,
  },
  weekContentContainer: {
    width: '100%',
    marginBottom: 16,
    ...Platform.select({
      android: {
        // Hardware acceleration for Android
        renderToHardwareTextureAndroid: true,
      }
    }),
  },
  // Navigation buttons styles
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 16,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
    marginHorizontal: 4,
  },
  navButtonTextDisabled: {
    color: getColor(theme, 'textMuted', '#A0AEC0'),
  },
  navSeparator: {
    width: 1,
    height: 20,
    backgroundColor: getColor(theme, 'cardInteractive', '#F1F5F9'),
    marginHorizontal: 16,
  }
});

export default React.memo(WeekBar); 