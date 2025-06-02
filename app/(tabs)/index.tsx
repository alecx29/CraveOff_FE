import { Feather, Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withSequence, withTiming, Easing, useAnimatedScrollHandler, useAnimatedRef, runOnJS, withRepeat } from 'react-native-reanimated';

import { useTheme } from '@/src/context/ThemeProvider';
import { useUser } from '@/src/context/UserContext';
import { useLogs, LogEntry } from '@/src/context/LogsContext';
import GradientBackground from '@/src/screen-components/gradient-background/GradientBackground';
import PledgeModal from '@/src/components/PledgeModal';
import PanicModal from '@/src/components/PanicModal';
import ReflectionModal from '@/src/components/ReflectionModal';
import RelapsedModal from '@/src/components/RelapsedModal';
import { apiClient } from '@/src/axios/apiClient';
import { BackendRoutes } from '@/src/axios/backendRoutes';
import WeekBar from '@/src/components/WeekBar';

// Helper function to format time with more precision
const formatTime = (seconds: number) => {
  // Ensure we're working with a positive number
  seconds = Math.max(0, seconds);
  
  const days = Math.floor(seconds / (3600 * 24));
  const hours = Math.floor((seconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  
  return {
    days,
    hours,
    minutes,
    seconds: remainingSeconds
  };
};

// Helper to determine which time units to display
const getVisibleTimeUnits = (time: ReturnType<typeof formatTime>) => {
  if (time.days > 0) {
    // If we have days, show days and hours
    return { showDays: true, showHours: true, showMinutes: true, showSeconds: false };
  } else if (time.hours > 0) {
    // If we have hours but no days, show hours, minutes and seconds
    return { showDays: false, showHours: true, showMinutes: true, showSeconds: true };
  } else {
    // If we only have minutes or seconds, show both
    return { showDays: false, showHours: false, showMinutes: true, showSeconds: true };
  }
};

// Get the largest time unit to display at the top
const getLargestTimeUnit = (time: ReturnType<typeof formatTime>) => {
  if (time.days > 0) {
    return { 
      unit: 'days', 
      value: time.days, 
      formattedText: `${time.days} ${time.days === 1 ? 'Day' : 'Days'}`
    };
  } else if (time.hours > 0) {
    return { 
      unit: 'hours', 
      value: time.hours, 
      formattedText: `${time.hours} ${time.hours === 1 ? 'Hour' : 'Hours'}`
    };
  } else if (time.minutes > 0) {
    return { 
      unit: 'minutes', 
      value: time.minutes, 
      formattedText: `${time.minutes} ${time.minutes === 1 ? 'Minute' : 'Minutes'}`
    };
  } else {
    return { 
      unit: 'seconds', 
      value: time.seconds, 
      formattedText: `${time.seconds} ${time.seconds === 1 ? 'Second' : 'Seconds'}`
    };
  }
};

// Get smaller time units to display in the bubble
const getSmallerTimeUnits = (time: ReturnType<typeof formatTime>, largestUnit: string) => {
  const units = [];
  
  if (largestUnit !== 'days' && time.days > 0) {
    units.push(`${time.days} ${time.days === 1 ? 'Day' : 'Days'}`);
  }
  
  if (largestUnit !== 'hours' && time.hours > 0) {
    units.push(`${time.hours.toString().padStart(2, '0')}hr`);
  }
  
  if (largestUnit !== 'minutes' && time.minutes > 0) {
    units.push(`${time.minutes.toString().padStart(2, '0')}m`);
  }
  
  if (largestUnit !== 'seconds' && time.seconds > 0) {
    units.push(`${time.seconds.toString().padStart(2, '0')}s`);
  }
  
  return units;
};

// Helper function to get the date string for a specific day of the week
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

export default function HomeScreen() {
  const { theme } = useTheme();
  const { user } = useUser();
  const { logs, lastRelapseData, fetchLogs, isLoading } = useLogs();
  const styles = createStyles(theme);
  const screenWidth = Dimensions.get('window').width;
  
  // State for showing the pledge modal
  const [showPledgeModal, setShowPledgeModal] = useState(false);
  
  // State for showing the panic modal
  const [showPanicModal, setShowPanicModal] = useState(false);
  
  // State for showing the reflection modal
  const [showReflectionModal, setShowReflectionModal] = useState(false);
  
  // State for showing the relapsed modal
  const [showRelapsedModal, setShowRelapsedModal] = useState(false);
  
  // State for week logs status
  const [weekLogsStatus, setWeekLogsStatus] = useState<Array<'clean' | 'not-clean' | 'no-log'>>([
    'no-log', 'no-log', 'no-log', 'no-log', 'no-log', 'no-log', 'no-log'
  ]);
  
  // State for previous week's logs status
  const [previousWeekLogsStatus, setPreviousWeekLogsStatus] = useState<Array<'clean' | 'not-clean' | 'no-log'>>([
    'no-log', 'no-log', 'no-log', 'no-log', 'no-log', 'no-log', 'no-log'
  ]);
  
  // State for clean days - updated based on last relapse
  const [cleanDays, setCleanDays] = useState(0);
  
  // State for timer - updated based on last relapse
  const [timerSeconds, setTimerSeconds] = useState(0);
  const formattedTime = formatTime(timerSeconds);
  
  // Log the formatted time for debugging
  useEffect(() => {
    console.log('Formatted time for display:', formattedTime);
  }, [formattedTime]);
  
  // Calculate clean days and timer based on last relapse date
  useEffect(() => {
    console.log('lastRelapseData in timer calculation:', JSON.stringify(lastRelapseData, null, 2));
    
    if (lastRelapseData && lastRelapseData.last_relapse_date) {
      try {
        console.log('Processing last_relapse_date:', lastRelapseData.last_relapse_date);
        
        // Parse the relapse date which comes in UTC format
        const relapseDateTime = new Date(lastRelapseData.last_relapse_date);
        
        // Check if the date is valid
        if (isNaN(relapseDateTime.getTime())) {
          console.error('Invalid date format:', lastRelapseData.last_relapse_date);
          setCleanDays(0);
          setTimerSeconds(0);
          return;
        }
        
        // Log date information
        console.log('Relapse date (UTC):', relapseDateTime.toISOString());
        console.log('Relapse date (Local):', relapseDateTime.toString());
        
        // Get current time
        const now = new Date();
        console.log('Current time (UTC):', now.toISOString());
        console.log('Current time (Local):', now.toString());
        
        // Calculate the time difference in milliseconds using UTC time values to avoid timezone issues
        // This works because both Date objects know their UTC time regardless of local timezone
        const diffTimeMs = now.getTime() - relapseDateTime.getTime();
        console.log('Time difference in ms:', diffTimeMs);
        console.log('Time difference in hours:', diffTimeMs / (1000 * 60 * 60));
        
        // Only proceed if the relapse date is in the past
        if (diffTimeMs > 0) {
          // Calculate seconds since relapse
          const diffSeconds = Math.floor(diffTimeMs / 1000);
          
          // Calculate days based on seconds (1 day = 24 hours = 86400 seconds)
          const diffDays = Math.floor(diffSeconds / (24 * 3600));
          
          console.log(`Setting timer: ${diffDays} days, ${diffSeconds} seconds`);
          setCleanDays(diffDays);
          setTimerSeconds(diffSeconds);
          
          console.log(`Last relapse was on ${relapseDateTime.toLocaleString()} (${diffDays} days, ${diffSeconds} seconds ago)`);
        } else {
          console.log('Last relapse date is in the future, resetting to 0');
          setCleanDays(0);
          setTimerSeconds(0);
        }
      } catch (e) {
        console.error('Error parsing or calculating time from last_relapse_date:', e);
        setCleanDays(0);
        setTimerSeconds(0);
      }
    } else {
      console.log('No last relapse date available');
      setCleanDays(0);
      setTimerSeconds(0);
    }
  }, [lastRelapseData]);
  
  // Update timer continuously based on the last relapse date
  useEffect(() => {
    if (lastRelapseData && lastRelapseData.last_relapse_date) {
      try {
        // Parse the relapse date (in UTC format)
        const relapseDateTime = new Date(lastRelapseData.last_relapse_date);
        
        // Check if the date is valid
        if (isNaN(relapseDateTime.getTime())) {
          console.error('Invalid date format in timer update:', lastRelapseData.last_relapse_date);
          return;
        }
        
        console.log('Setting up continuous timer with relapse date (UTC):', relapseDateTime.toISOString());
        
        // Update every second
        const interval = setInterval(() => {
          // Get current time
          const now = new Date();
          
          // Calculate the time difference in milliseconds using UTC time values
          const diffTimeMs = now.getTime() - relapseDateTime.getTime();
          
          // Only update if the relapse date is in the past
          if (diffTimeMs > 0) {
            // Calculate seconds since relapse
            const diffSeconds = Math.floor(diffTimeMs / 1000);
            setTimerSeconds(diffSeconds);
            
            // Calculate days based on seconds (1 day = 24 hours = 86400 seconds)
            const diffDays = Math.floor(diffSeconds / (24 * 3600));
            setCleanDays(diffDays);
          }
        }, 1000);
        
        return () => clearInterval(interval);
      } catch (e) {
        console.error('Error in timer update effect:', e);
        
        // Fall back to manual increment
        const interval = setInterval(() => {
          setTimerSeconds(prev => prev + 1);
        }, 1000);
        
        return () => clearInterval(interval);
      }
    } else {
      // If no last relapse data, increment timer manually
      const interval = setInterval(() => {
        setTimerSeconds(prev => prev + 1);
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [lastRelapseData]);
  
  // Determine current day
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  // State pentru quote motivațional
  const [quote, setQuote] = useState("Progress, not perfection, is the goal.");
  
  // State pentru widget activ
  const [activeWidgetIndex, setActiveWidgetIndex] = useState(0);
  const scrollX = useSharedValue(0);
  const flatListRef = useAnimatedRef<Animated.ScrollView>();
  
  // Animație pentru butonul cu animăluț
  const petScale = useSharedValue(1);
  const petRotate = useSharedValue(0);
  
  const animatePet = () => {
    // Animație de scale
    petScale.value = withSequence(
      withSpring(1.3, { damping: 2, stiffness: 80 }),
      withSpring(1, { damping: 4, stiffness: 100 })
    );
    
    // Animație de rotație
    petRotate.value = withSequence(
      withTiming(-36, { duration: 100, easing: Easing.ease }),
      withTiming(36, { duration: 200, easing: Easing.ease }),
      withTiming(-18, { duration: 150, easing: Easing.ease }),
      withTiming(0, { duration: 100, easing: Easing.ease })
    );
  };
  
  const petAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: petScale.value },
        { rotate: `${petRotate.value}deg` }
      ]
    };
  });
  
  const onScrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
      // Calculate current index based on scroll position
      const currentIndex = Math.round(event.contentOffset.x / screenWidth);
      if (currentIndex !== activeWidgetIndex) {
        runOnJS(setActiveWidgetIndex)(currentIndex);
      }
    },
    onMomentumEnd: (event) => {
      const index = Math.round(event.contentOffset.x / screenWidth);
      runOnJS(setActiveWidgetIndex)(index);
    },
  });
  
  // Process logs to determine week status
  useEffect(() => {
    console.log('Logs data received:', logs);
    if (!logs || !Array.isArray(logs) || logs.length === 0) {
      console.log('No valid logs data available, using default empty status');
      return;
    }
    
    // Create a map of dates to their log status
    const logMap = new Map<string, boolean>();
    logs.forEach((log: LogEntry) => {
      // Handle datetime string (extract just the date part)
      const dateStr = log.date.split('T')[0]; // Extract YYYY-MM-DD from datetime
      logMap.set(dateStr, log.is_clean);
    });
    
    console.log('Processed log map:', Object.fromEntries(logMap));
    
    // Update week status based on logs
    const newWeekStatus = Array(7).fill('no-log').map((_, index) => {
      const dateStr = getDateStringForDay(index);
      if (!logMap.has(dateStr)) return 'no-log';
      return logMap.get(dateStr) ? 'clean' : 'not-clean';
    });
    
    // Calculate previous week's status
    const previousWeekStatus = Array(7).fill('no-log').map((_, index) => {
      const dateStr = getDateStringForDay(index, -1); // -1 week offset
      if (!logMap.has(dateStr)) return 'no-log';
      return logMap.get(dateStr) ? 'clean' : 'not-clean';
    });
    
    console.log('New week status:', newWeekStatus);
    console.log('Previous week status:', previousWeekStatus);
    
    setWeekLogsStatus(newWeekStatus as Array<'clean' | 'not-clean' | 'no-log'>);
    setPreviousWeekLogsStatus(previousWeekStatus as Array<'clean' | 'not-clean' | 'no-log'>);
  }, [logs]);
  
  // Effects
  useEffect(() => {
    // Fetch logs when the home screen mounts
    fetchLogs();
  }, []);
  
  // Widget indicators style
  const getIndicatorStyle = (index: number) => {
    return {
      ...styles.indicator,
      backgroundColor: index === activeWidgetIndex 
        ? theme.colors.primary 
        : theme.colors.textMuted,
      width: index === activeWidgetIndex ? 24 : 8,
    };
  };
  
  // Navigate to specific widget
  const navigateToWidget = (index: number) => {
    flatListRef.current?.scrollTo({ x: index * screenWidth, animated: true });
    setActiveWidgetIndex(index);
  };
  
  // Calculate brain rewiring progress (percentage towards 21 days)
  const calculateBrainRewiring = () => {
    const GOAL_HOURS = 21 * 24; // 21 days in hours
    const currentHours = timerSeconds / 3600; // Convert seconds to hours
    
    // Calculate percentage (0 to 100)
    const percentage = Math.min(100, Math.round((currentHours / GOAL_HOURS) * 100));
    
    return {
      percentage,
      width: `${percentage}%`
    };
  };
  
  // Calculate brain rewiring progress whenever timerSeconds changes
  const [brainRewiring, setBrainRewiring] = useState({ percentage: 0, width: '0%' });
  
  useEffect(() => {
    setBrainRewiring(calculateBrainRewiring());
  }, [timerSeconds]);
  
  // Animație pentru progress bar
  const progressWidth = useSharedValue(0);
  const progressShimmer = useSharedValue(0);
  const growingGlow = useSharedValue(0);
  const movingDot = useSharedValue(0);
  
  useEffect(() => {
    // Update the animated value for progress width
    progressWidth.value = withTiming(parseFloat(brainRewiring.width) / 100, { 
      duration: 800, 
      easing: Easing.bezier(0.25, 0.1, 0.25, 1) 
    });
    
    // Setează animația de shimmer
    progressShimmer.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    
    // Add animation for the growing indicator glow effect
    growingGlow.value = withRepeat(
      withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    
    // Add animation for the moving dot in the progress bar
    movingDot.value = withRepeat(
      withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
      -1,
      false // Don't reverse - will reset to 0 and start again
    );
  }, [brainRewiring]);
  
  // Animated pulse effect for progress bar
  const pulseAnim = useSharedValue(1);
  
  useEffect(() => {
    // Create a subtle pulsing effect for the progress bar
    pulseAnim.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);
  
  const progressAnimatedStyle = useAnimatedStyle(() => {
    return {
      width: `${progressWidth.value * 100}%`,
      opacity: 0.7 + (progressShimmer.value * 0.3),
      transform: [{ scaleY: pulseAnim.value }],
    };
  });
  
  const shimmerAnimatedStyle = useAnimatedStyle(() => {
    // Improved shimmer animation that moves across the entire progress bar
    return {
      transform: [{ translateX: movingDot.value * 100 }],
      opacity: 0.5 + (progressShimmer.value * 0.3),
      left: -40, // Start off-screen
      width: 40, // Make it a visible dot
    };
  });
  
  // Active growing indicator - small dot at the end of the progress bar
  const growingIndicatorStyle = useAnimatedStyle(() => {
    const shadowOpacityValue = 0.5 + (growingGlow.value * 0.5);
    const shadowRadiusValue = 4 + (growingGlow.value * 4);
    const elevationValue = 2 + (growingGlow.value * 3);
    
    return {
      opacity: 0.7 + (growingGlow.value * 0.3),
      transform: [
        { scale: 0.9 + (growingGlow.value * 0.4) }
      ],
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: shadowOpacityValue,
      shadowRadius: shadowRadiusValue,
      elevation: elevationValue,
    };
  });

  // Handle relapse and reset counter
  const handleResetCounter = () => {
    // Call API to record a relapse
    apiClient.patch('/profile/last-relapse', { 
      last_relapse_date: new Date().toISOString() 
    })
      .then(response => {
        console.log('Relapse recorded:', response.data);
        // Refresh logs and counters
        fetchLogs();
      })
      .catch(error => {
        console.error('Error recording relapse:', error);
      });
  };

  return (
    <GradientBackground>
      <ScrollView style={styles.container}>
        {/* Header cu salut */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image 
              source={require('@/assets/images/logo.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.subGreeting}>Stay strong today</Text>
          </View>
          
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.petButton}
              onPress={animatePet}
              activeOpacity={0.8}
            >
              <Animated.View style={petAnimatedStyle}>
                <Text style={styles.petEmoji}>🐶</Text>
              </Animated.View>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Calendar săptămânal */}
        <WeekBar 
          weekLogsStatus={weekLogsStatus} 
          previousWeekLogsStatus={previousWeekLogsStatus} 
        />
        
        {/* Widgets container */}
        <View style={styles.widgetsContainer}>
          <Animated.ScrollView
            ref={flatListRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={onScrollHandler}
            scrollEventThrottle={16}
            style={styles.widgetsScrollView}
          >
            {/* Card timer */}
            <View style={[styles.widgetCard, { width: screenWidth - 40 }]}>
              <View style={styles.timerContainer}>
                <View style={styles.timerRow}>
                  {/* Display only the largest time unit */}
                  {(() => {
                    const largestUnit = getLargestTimeUnit(formattedTime);
                    const smallerUnits = getSmallerTimeUnits(formattedTime, largestUnit.unit);
                    
                    return (
                      <>
                        <Text style={styles.timerNumber}>{largestUnit.formattedText}</Text>
                        
                        {/* Bubble for smaller time units */}
                        {smallerUnits.length > 0 && (
                          <View style={styles.timerBubble}>
                            <Text style={styles.timerBubbleText}>
                              {smallerUnits.join(' ')}
                            </Text>
                          </View>
                        )}
                      </>
                    );
                  })()}
                </View>
              </View>
              
              <Text style={styles.cleanDaysText}>Porn-Free Time</Text>
            </View>
            
            {/* Card zile curate */}
            <View style={[styles.widgetCard, { width: screenWidth - 40 }]}>
              <View style={styles.cleanDaysContent}>
                <Text style={styles.cleanDaysNumber}>{cleanDays}</Text>
                <Ionicons name="flame" size={28} color={theme.colors.flame} style={styles.flameIcon} />
              </View>
              <Text style={styles.cleanDaysText}>Clean Days</Text>
              {cleanDays === 0 ? (
                <Text style={styles.cleanDaysSubtext}>Keep going! Enter the streak</Text>
              ) : (
                <Text style={styles.cleanDaysSubtext}>Keep going! You&apos;re on fire <Ionicons name="flame" size={14} color={theme.colors.flame} /></Text>
              )}
            </View>
          </Animated.ScrollView>
          
          {/* Widget indicators */}
          <View style={styles.indicatorsContainer}>
            <TouchableOpacity onPress={() => navigateToWidget(0)}>
              <View style={getIndicatorStyle(0)} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigateToWidget(1)}>
              <View style={getIndicatorStyle(1)} />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Brain Rewiring Progress */}
        <View style={styles.brainRewireContainer}>
          <View style={styles.brainRewireHeader}>
            <Text style={styles.brainRewireText}>Brain Rewiring</Text>
            <View style={styles.brainRewirePercentContainer}>
              <Text style={styles.brainRewirePercent}>{brainRewiring.percentage}%</Text>
              {/* Active status indicator */}
              <View style={styles.activeIndicator}>
                <View style={styles.activeIndicatorDot} />
                <Text style={styles.activeIndicatorText}>Growing</Text>
              </View>
            </View>
          </View>
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBackground}>
              <Animated.View style={[styles.progressBarFill, progressAnimatedStyle]}>
                {/* Moving dot in the progress bar */}
                <Animated.View style={[styles.progressBarShimmer, shimmerAnimatedStyle]} />
                {/* Growing indicator at the end of the progress bar */}
                {brainRewiring.percentage > 0 && (
                  <Animated.View style={[styles.growingIndicator, growingIndicatorStyle]} />
                )}
              </Animated.View>
            </View>
          </View>
          <Text style={styles.brainRewireGoalText}>Goal: 21 days porn-free</Text>
        </View>
        
        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => setShowPledgeModal(true)}
          >
            <Ionicons name="hand-left-outline" size={24} color={theme.colors.textPrimary} />
            <Text style={styles.actionButtonLabel}>Pledge</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="sparkles-outline" size={22} color={theme.colors.textPrimary} />
            <Text style={styles.actionButtonLabel}>Oria AI</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => setShowReflectionModal(true)}
          >
            <Ionicons name="flower-outline" size={22} color={theme.colors.textPrimary} />
            <Text style={styles.actionButtonLabel}>Meditate</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => setShowRelapsedModal(true)}
          >
            <Ionicons name="refresh-outline" size={22} color={theme.colors.textPrimary} />
            <Text style={styles.actionButtonLabel}>Reset</Text>
          </TouchableOpacity>
        </View>
        
        {/* Buton Panic (fost CraveOff Mode) */}
        <TouchableOpacity 
          style={styles.panicButton}
          onPress={() => setShowPanicModal(true)}
        >
          <Feather name="shield" size={20} color="#fff" />
          <Text style={styles.panicButtonText}>Panic Button</Text>
        </TouchableOpacity>
        
        {/* Chenare 21 Day Challenge și Pet */}
        <View style={styles.challengeRow}>
          <TouchableOpacity style={styles.challengeCard}>
            <View style={styles.challengeContent}>
              <Text style={styles.challengeNumber}>21</Text>
              <View style={styles.challengeTextContainer}>
                <Text style={styles.challengeTitle}>Day Challenge</Text>
                <Text style={styles.challengeSubtext}>Day 0</Text>
              </View>
            </View>
            <View style={styles.challengeProgressBar}>
              <View style={[styles.challengeProgress, { width: '0%' }]} />
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.petCard}>
            <Text style={styles.petEmoji}>🐶</Text>
            <Text style={styles.petCardText}>Your buddy</Text>
          </TouchableOpacity>
        </View>
        
        {/* Card motivațional */}
        <View style={styles.motivationCard}>
          <Text style={styles.sectionTitle}>Daily Motivation</Text>
          <Text style={styles.quoteText}>&quot;{quote}&quot;</Text>
        </View>
      </ScrollView>
      
      {/* Pledge Modal */}
      <PledgeModal 
        visible={showPledgeModal}
        onClose={() => setShowPledgeModal(false)}
        onPledge={() => {
          // Handle pledge success by making API call to /api/pledge with current timestamp
          apiClient.post(BackendRoutes.PLEDGE, { 
            check_in_at: new Date().toISOString() 
          })
            .then(response => {
              console.log('Pledge successful:', response.data);
              // You can add additional logic here, like showing a success message
            })
            .catch(error => {
              console.error('Error during pledge:', error);
              // You can add error handling here
            });
        }}
      />
      
      {/* Panic Modal */}
      <PanicModal 
        visible={showPanicModal}
        onClose={() => setShowPanicModal(false)}
      />
      
      {/* Reflection Modal */}
      <ReflectionModal
        visible={showReflectionModal}
        onClose={() => setShowReflectionModal(false)}
      />
      
      {/* Relapsed Modal */}
      <RelapsedModal
        visible={showRelapsedModal}
        onClose={() => setShowRelapsedModal(false)}
        onResetCounter={handleResetCounter}
      />
    </GradientBackground>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  logoContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  logo: {
    width: 150,
    height: 50,
    marginBottom: 6,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  subGreeting: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  cleanDaysCard: {
    backgroundColor: theme.colors.backgroundDeep,
    borderRadius: theme.borderRadius.medium,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: 16,
  },
  cleanDaysContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cleanDaysNumber: {
    fontSize: 60,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginRight: 8,
  },
  flameIcon: {
    marginTop: 4,
  },
  cleanDaysText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  cleanDaysSubtext: {
    fontSize: 14,
    color: theme.colors.textMuted,
  },
  craveOffButton: {
    backgroundColor: theme.colors.emergency,
    borderRadius: theme.borderRadius.medium,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    ...theme.shadows.redGlow,
  },
  craveOffText: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  motivationCard: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.medium,
    padding: 16,
    marginBottom: 80,
  },
  quoteText: {
    fontSize: 16,
    fontStyle: 'italic',
    color: theme.colors.textPrimary,
    lineHeight: 24,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  petButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: theme.colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.light,
  },
  petEmoji: {
    fontSize: 26,
  },
  widgetsContainer: {
    marginBottom: 16,
  },
  widgetsScrollView: {
    overflow: 'visible',
  },
  widgetCard: {
    backgroundColor: theme.colors.backgroundDeep,
    borderRadius: theme.borderRadius.medium,
    padding: 24,
    alignItems: 'center',
  },
  indicatorsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  indicator: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  timerContainer: {
    marginBottom: 8,
    alignItems: 'center',
  },
  timerRow: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerNumber: {
    fontSize: 46,
    fontWeight: 'bold',
    color: theme.colors.primary,
    textAlign: 'center',
  },
  timerBubble: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 12,
    alignSelf: 'center',
    ...theme.shadows.light,
  },
  timerBubbleText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  brainRewireContainer: {
    marginBottom: 12,
  },
  brainRewireHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  brainRewireText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  brainRewirePercentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brainRewirePercent: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  activeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  activeIndicatorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.primary,
    marginRight: 4,
  },
  activeIndicatorText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  progressBarContainer: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarBackground: {
    flex: 1,
    backgroundColor: theme.colors.cardBackground,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 3,
    position: 'relative',
  },
  progressBarShimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
  },
  growingIndicator: {
    position: 'absolute',
    right: -4,
    top: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.primary,
    zIndex: 2,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingHorizontal: 10,
  },
  actionButton: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: theme.colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.light,
  },
  actionButtonLabel: {
    fontSize: 10,
    marginTop: 4,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  panicButton: {
    backgroundColor: 'rgba(216, 85, 85, 0.85)', // Roșu mai atenuat
    borderRadius: theme.borderRadius.medium,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    // Umbră mai subtilă
    shadowColor: '#d85555',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  panicButtonText: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  challengeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  challengeCard: {
    flex: 2,
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.medium,
    padding: 16,
    marginRight: 8,
  },
  challengeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  challengeNumber: {
    fontSize: 36,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginRight: 12,
  },
  challengeTextContainer: {
    flex: 1,
  },
  challengeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  challengeSubtext: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  challengeProgressBar: {
    height: 4,
    backgroundColor: theme.colors.cardInteractive,
    borderRadius: 2,
    overflow: 'hidden',
  },
  challengeProgress: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 2,
  },
  petCard: {
    flex: 1,
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.medium,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  petCardText: {
    fontSize: 12,
    marginTop: 6,
    color: theme.colors.textSecondary,
  },
  brainRewireGoalText: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 8,
  },
});
