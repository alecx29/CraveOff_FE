import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withRepeat, Easing, useAnimatedProps } from 'react-native-reanimated';
import { Svg, Circle, G } from 'react-native-svg';
import { LineChart } from 'react-native-chart-kit';
import { format, subDays, isAfter, parseISO, differenceInHours, differenceInMinutes } from 'date-fns';

import { useTheme } from '@/src/context/ThemeProvider';
import { useLogs, LogEntry } from '@/src/context/LogsContext';
import GradientBackground from '@/src/screen-components/gradient-background/GradientBackground';
import { useUser } from '@/src/context/UserContext';
import { apiClient } from '@/src/axios/apiClient';
import { BackendRoutes } from '@/src/axios/backendRoutes';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const screenWidth = Dimensions.get('window').width;

// Helper function to safely access theme colors
const getColor = (theme: any, colorName: string, fallbackColor: string): string => {
  const colors = theme.colors as Record<string, string>;
  if (colorName in colors) return colors[colorName];
  return fallbackColor;
};

export default function AnalyticsScreen() {
  const { theme } = useTheme();
  const { lastRelapseData, isLoading, logs, currentStreak } = useLogs();
  const { user } = useUser();
  const styles = createStyles(theme, getColor);

  // Helper function to safely access theme colors - component version
  const getComponentColor = (colorName: string, fallbackColor: string): string => {
    const colors = theme.colors as Record<string, string>;
    if (colorName in colors) return colors[colorName];
    return fallbackColor;
  };

  // State for clean days progress (derived from context currentStreak)
  const [cleanDays, setCleanDays] = useState(0);
  const [progressPercentage, setProgressPercentage] = useState(0);

  // Stats for streak statistics
  const [longestStreak, setLongestStreak] = useState(0);
  const [averageStreak, setAverageStreak] = useState(0);

  // Monthly progress stats
  const [monthlyCleanDays, setMonthlyCleanDays] = useState(0);
  const [daysInMonth, setDaysInMonth] = useState(0);
  const [monthlyProgressPercentage, setMonthlyProgressPercentage] = useState(0);

  // Pledge states
  const [canMakePledge, setCanMakePledge] = useState(true);
  const [activePledgeTimeRemaining, setActivePledgeTimeRemaining] = useState<string | null>(null);
  const [activePledgeStartTime, setActivePledgeStartTime] = useState<string | null>(null);
  const [activePledgeEndTime, setActivePledgeEndTime] = useState<string | null>(null);
  const [isCheckingPledge, setIsCheckingPledge] = useState(false);

  // Progress over time stats
  const [progressData, setProgressData] = useState({
    labels: ['', '', '', '', '', '', ''],
    datasets: [
      {
        data: [0, 0, 0, 0, 0, 0, 0],
        color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
        strokeWidth: 2
      }
    ],
    legend: ['Progress']
  });
  const [progressTrend, setProgressTrend] = useState({ value: 0, isPositive: true });

  // Animation value for circle progress
  const progressAnimation = useSharedValue(0);
  const progressGlow = useSharedValue(1);

  // Circle parameters
  const size = 200;
  const strokeWidth = 15;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  // Derive clean days from shared context currentStreak
  useEffect(() => {
    const diffDays = Number.isFinite(Number(currentStreak)) ? Number(currentStreak) : 0;
    setCleanDays(diffDays);
    const percentage = Math.min(100, Math.round((diffDays / 90) * 100));
    setProgressPercentage(percentage);
  }, [currentStreak]);

  // Calculate streak statistics from logs
  useEffect(() => {
    if (logs && logs.length > 0) {
      calculateStreakStats(logs);
      fetchBackendStreaks();
      calculateProgressOverTime(logs);
    }
  }, [logs]);

  // Always fetch backend-provided streaks on mount
  useEffect(() => {
    fetchBackendStreaks();
  }, []);

  // Check for active pledge when component mounts
  useEffect(() => {
    checkActivePledge();
  }, []);

  // Function to calculate streak statistics
  const calculateStreakStats = (logEntries: LogEntry[]) => {
    if (!logEntries || logEntries.length === 0) {
      setLongestStreak(0);
      setAverageStreak(0);
      return;
    }

    // Sort logs by date
    const sortedLogs = [...logEntries].sort((a, b) => {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

    // Initialize variables for streak calculation
    let currentStreak = 0;
    let maxStreak = 0;
    let streaks: number[] = [];
    let lastDate: Date | null = null;

    // Process each log entry
    sortedLogs.forEach(log => {
      const logDate = new Date(log.date);

      // If this is a clean day, increment the streak
      if (log.is_clean) {
        // Check if this is a consecutive day
        if (lastDate) {
          const dayDiff = Math.floor((logDate.getTime() - lastDate.getTime()) / (24 * 3600 * 1000));

          // If consecutive day or same day, continue streak
          if (dayDiff <= 1) {
            currentStreak++;
          } else {
            // Break in streak, record previous streak and start new one
            if (currentStreak > 0) {
              streaks.push(currentStreak);
            }
            currentStreak = 1;
          }
        } else {
          // First clean day
          currentStreak = 1;
        }

        // Update max streak
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        // Not a clean day, break the streak
        if (currentStreak > 0) {
          streaks.push(currentStreak);
        }
        currentStreak = 0;
      }

      // Update last date
      lastDate = logDate;
    });

    // Add the final streak if exists
    if (currentStreak > 0) {
      streaks.push(currentStreak);
    }

    // Calculate average streak
    const totalStreaks = streaks.length;
    const sumStreaks = streaks.reduce((sum, streak) => sum + streak, 0);
    const avgStreak = totalStreaks > 0 ? Math.round(sumStreaks / totalStreaks) : 0;

    // Update state
    setLongestStreak(maxStreak);
    setAverageStreak(avgStreak);

    console.log('Streak stats calculated:', { longestStreak: maxStreak, averageStreak: avgStreak, streaks });
  };

  // Fetch longest and average streak from backend
  const fetchBackendStreaks = async () => {
    try {
      const response = await apiClient.get(BackendRoutes.STREAKS);
      const data = response.data || {};
      // Support both potential key spellings
      const longest = data.longesStreak ?? data.longestStreak ?? data.longest ?? 0;
      const average = data.avgStreak ?? data.averageStreak ?? data.average ?? 0;
      if (Number.isFinite(Number(longest))) setLongestStreak(Number(longest));
      if (Number.isFinite(Number(average))) setAverageStreak(Number(average));
    } catch (error) {
      console.error('Failed to fetch backend streaks:', error);
      // Keep locally computed values as fallback
    }
  };

  // Function to calculate progress over time
  const calculateProgressOverTime = (logEntries: LogEntry[]) => {
    if (!logEntries || logEntries.length === 0) {
      return;
    }

    // Sort logs by date to find the earliest log
    const sortedLogs = [...logEntries].sort((a, b) =>
      parseISO(a.date).getTime() - parseISO(b.date).getTime()
    );

    // Find the earliest log date (app installation) and today
    const earliestLogDate = parseISO(sortedLogs[0].date);
    const today = new Date();

    // Calculate total days in the journey
    const totalDaysMs = today.getTime() - earliestLogDate.getTime();
    const totalDays = Math.max(1, Math.ceil(totalDaysMs / (24 * 3600 * 1000)));

    // Determine number of data points based on journey length
    // For shorter journeys (< 2 weeks): more frequent points
    // For medium journeys (2 weeks - 3 months): moderate spacing
    // For longer journeys (> 3 months): fewer points
    let numberOfPoints = 7; // default

    if (totalDays <= 14) {
      // Short journey: Up to 2 weeks - aim for daily or every other day
      numberOfPoints = Math.min(totalDays, 10);
    } else if (totalDays <= 90) {
      // Medium journey: 2 weeks to 3 months - aim for weekly points
      numberOfPoints = Math.min(Math.ceil(totalDays / 7) + 1, 12);
    } else {
      // Long journey: > 3 months - aim for key milestones and monthly points
      numberOfPoints = Math.min(Math.ceil(totalDays / 30) + 2, 15);
    }

    // Generate dates for our data points with meaningful intervals
    const datesToCalculate: Date[] = [];

    // Always include the start date
    datesToCalculate.push(new Date(earliestLogDate));

    // For longer journeys, ensure we include key milestone days if they exist in the logs
    // This ensures significant progress moments are captured in the visualization
    const keyMilestones = [3, 7, 14, 30, 60, 90, 180, 365]; // days

    if (totalDays > 14) {
      // Find dates for significant streaks or milestones
      let currentStreak = 0;
      let lastCleanDate: Date | null = null;
      let streakStartDate: Date | null = null;
      const milestoneReachedDates = new Map<number, Date>();

      // Track streak lengths and when milestones were reached
      for (const log of sortedLogs) {
        const logDate = parseISO(log.date);

        if (log.is_clean) {
          if (!lastCleanDate) {
            // Start of a new streak
            currentStreak = 1;
            streakStartDate = logDate;
          } else {
            const dayDiff = Math.round(
              (logDate.getTime() - lastCleanDate.getTime()) / (24 * 3600 * 1000)
            );

            if (dayDiff <= 1) {
              // Continuing streak
              currentStreak++;

              // Check if we've hit a milestone with this streak
              for (const milestone of keyMilestones) {
                if (currentStreak === milestone && !milestoneReachedDates.has(milestone)) {
                  milestoneReachedDates.set(milestone, new Date(logDate));
                }
              }
            } else {
              // Break in streak, reset
              currentStreak = 1;
              streakStartDate = logDate;
            }
          }

          lastCleanDate = logDate;
        } else {
          // Relapse - reset streak
          currentStreak = 0;
          lastCleanDate = null;
          streakStartDate = null;
        }
      }

      // Add milestone dates to our calculation points (if they exist)
      // Sort milestone dates chronologically
      const milestoneDates = Array.from(milestoneReachedDates.values())
        .sort((a, b) => a.getTime() - b.getTime());

      // Take up to 5 milestone dates to not overcrowd the chart
      milestoneDates.slice(0, 5).forEach(date => {
        if (!datesToCalculate.some(d =>
          Math.abs(d.getTime() - date.getTime()) < (24 * 3600 * 1000)
        )) {
          datesToCalculate.push(new Date(date));
        }
      });
    }

    // Calculate remaining points needed
    const remainingPoints = numberOfPoints - datesToCalculate.length - 1; // -1 for the today point we'll add

    if (remainingPoints > 0) {
      // Calculate interval between remaining regular points
      const timeRange = today.getTime() - earliestLogDate.getTime();
      const interval = timeRange / (remainingPoints + 1);

      // Add regular interval points
      for (let i = 1; i <= remainingPoints; i++) {
        const pointTime = earliestLogDate.getTime() + (interval * i);
        const pointDate = new Date(pointTime);

        // Check if we already have a date point close to this one
        if (!datesToCalculate.some(d =>
          Math.abs(d.getTime() - pointDate.getTime()) < (interval * 0.5)
        )) {
          datesToCalculate.push(pointDate);
        }
      }
    }

    // Always include today
    datesToCalculate.push(new Date(today));

    // Sort dates chronologically
    datesToCalculate.sort((a, b) => a.getTime() - b.getTime());

    // Ensure we don't have more than our target number of points
    if (datesToCalculate.length > numberOfPoints) {
      // Keep first, last, and distribute the rest
      const firstDate = datesToCalculate[0];
      const lastDate = datesToCalculate[datesToCalculate.length - 1];
      const middleDates = [];

      const middleInterval = (numberOfPoints - 2);
      const step = (datesToCalculate.length - 2) / middleInterval;

      for (let i = 0; i < middleInterval; i++) {
        const index = Math.min(Math.floor(1 + (i * step)), datesToCalculate.length - 2);
        middleDates.push(datesToCalculate[index]);
      }

      datesToCalculate.length = 0;
      datesToCalculate.push(firstDate);
      datesToCalculate.push(...middleDates);
      datesToCalculate.push(lastDate);
    }

    // Create labels: show first date, today, and milestone labels
    const dateLabels = Array(datesToCalculate.length).fill('');

    // First date label
    dateLabels[0] = 'Join date';

    // Last date label (today)
    dateLabels[dateLabels.length - 1] = 'Present';

    // All other labels are empty - no milestone labels
    for (let i = 1; i < datesToCalculate.length - 1; i++) {
      dateLabels[i] = '';
    }

    // Initialize progress scores for each point
    const progressScores = Array(datesToCalculate.length).fill(0);

    // Calculate progress for each point
    datesToCalculate.forEach((date, index) => {
      // For each point, look back to analyze progress
      // For earlier points, look back less time
      // For later points, look back more to capture overall journey
      const daysSinceStart = Math.max(1, Math.round(
        (date.getTime() - earliestLogDate.getTime()) / (24 * 3600 * 1000)
      ));

      // Adaptive lookback period - longer for later points
      const lookBackDays = Math.min(
        daysSinceStart,
        Math.max(7, Math.min(daysSinceStart, 30))
      );

      // Get logs for the period
      const logsForPeriod = logEntries.filter(log => {
        const logDate = parseISO(log.date);
        return isAfter(logDate, subDays(date, lookBackDays)) && !isAfter(logDate, date);
      });

      if (logsForPeriod.length === 0) {
        progressScores[index] = index > 0 ? progressScores[index - 1] : 0; // Maintain previous score if no data
        return;
      }

      // Calculate progress components

      // 1. Clean days percentage
      const cleanDaysCount = logsForPeriod.filter(log => log.is_clean).length;
      const cleanDaysPercentage = (cleanDaysCount / logsForPeriod.length) * 100;

      // 2. Current streak at this point
      let currentStreak = 0;
      let maxStreakAtPoint = 0;

      // Sort period logs
      const periodSortedLogs = [...logsForPeriod].sort((a, b) =>
        parseISO(a.date).getTime() - parseISO(b.date).getTime()
      );

      // Calculate streak
      let lastLogDate: Date | null = null;
      for (const log of periodSortedLogs) {
        const logDate = parseISO(log.date);

        if (isAfter(logDate, date)) {
          continue;
        }

        if (log.is_clean) {
          if (lastLogDate) {
            const dayDiff = Math.round(
              (logDate.getTime() - lastLogDate.getTime()) / (24 * 3600 * 1000)
            );

            if (dayDiff <= 1) {
              currentStreak++;
            } else {
              currentStreak = 1;
            }
          } else {
            currentStreak = 1;
          }

          maxStreakAtPoint = Math.max(maxStreakAtPoint, currentStreak);
        } else {
          currentStreak = 0;
        }

        lastLogDate = logDate;
      }

      // 3. Recovery phase weighting
      // The longer the journey, the more we value consistency over milestones
      let phaseWeight = 0;

      if (daysSinceStart <= 7) {
        // Early phase: value any progress highly (encouragement)
        phaseWeight = 10;
      } else if (daysSinceStart <= 30) {
        // Building phase: reward consistent progress
        phaseWeight = 15;
      } else if (daysSinceStart <= 90) {
        // Commitment phase: streak becomes more important
        phaseWeight = 20;
      } else {
        // Lifestyle phase: long-term habits most valued
        phaseWeight = 25;
      }

      // 4. Consistency measurement
      const uniqueDaysLogged = new Set(periodSortedLogs.map(log =>
        format(parseISO(log.date), 'yyyy-MM-dd')
      )).size;

      const consistencyScore = (uniqueDaysLogged / Math.min(lookBackDays, 30)) * 100;

      // 5. Relapse penalty - reduce score temporarily after relapses but allow recovery
      let relapsePenalty = 0;
      const recentRelapses = logsForPeriod.filter(log =>
        !log.is_clean &&
        isAfter(parseISO(log.date), subDays(date, 7))
      ).length;

      if (recentRelapses > 0) {
        // Penalty decreases as days since relapse increases
        relapsePenalty = Math.min(30, recentRelapses * 15);
      }

      // Calculate final score with adjusted weights
      const rawScore = (
        (cleanDaysPercentage * 0.4) +
        (Math.min(maxStreakAtPoint / 90, 1) * 100 * 0.3) +
        (consistencyScore * 0.15) +
        phaseWeight -
        relapsePenalty
      );

      // Ensure score is between 0 and 100
      // Add smoothing for better visualization (avoid dramatic drops)
      const previousScore = index > 0 ? progressScores[index - 1] : 0;
      const smoothedScore = (previousScore * 0.3) + (rawScore * 0.7);

      progressScores[index] = Math.min(Math.max(Math.round(smoothedScore), 0), 100);

      // Special case: first point shouldn't be too high to show progress
      if (index === 0 && progressScores[0] > 40) {
        progressScores[0] = 40;
      }

      // Special case: ensure last point reflects current progress accurately
      if (index === progressScores.length - 1) {
        // For the final point, calculate a more current-focused score
        const currentScore = (
          (cleanDaysPercentage * 0.5) +
          (Math.min(maxStreakAtPoint / 90, 1) * 100 * 0.4) +
          (consistencyScore * 0.1)
        );

        progressScores[index] = Math.min(Math.max(Math.round(currentScore), 0), 100);
      }
    });

    // Create chart data object with validation to prevent bugs
    const validProgressScores = progressScores.map(score => {
      // Ensure all values are valid numbers
      if (isNaN(score) || score === null || score === undefined) {
        return 0;
      }
      return Math.min(Math.max(Math.round(score), 0), 100);
    });

    // Ensure we have enough valid labels
    const validLabels = dateLabels.length >= validProgressScores.length
      ? dateLabels
      : [...dateLabels, ...Array(validProgressScores.length - dateLabels.length).fill('')];

    const chartData = {
      labels: validLabels,
      datasets: [
        {
          data: validProgressScores,
          color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
          strokeWidth: 2
        }
      ],
      legend: ['Progress']
    };

    setProgressData(chartData);

    // Calculate trend: overall journey progress
    const firstPoint = progressScores[0];
    const lastPoint = progressScores[progressScores.length - 1];
    const trend = lastPoint - firstPoint;

    setProgressTrend({
      value: Math.abs(Math.round(trend)),
      isPositive: trend >= 0
    });

    console.log('Progress calculated:', {
      totalDays,
      points: datesToCalculate.length,
      labels: dateLabels,
      scores: progressScores,
      trend
    });
  };

  // Update animated values when progress percentage changes
  useEffect(() => {
    progressAnimation.value = withTiming(progressPercentage / 100, {
      duration: 1500,
      easing: Easing.bezierFn(0.25, 0.1, 0.25, 1),
    });

    // Add pulsing glow effect
    progressGlow.value = withRepeat(
      withTiming(1.3, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [progressPercentage]);

  // Animated props for the circle
  const animatedProps = useAnimatedProps(() => {
    const strokeDashoffset = circumference * (1 - progressAnimation.value);
    return {
      strokeDashoffset
    };
  });

  // Animated style for glow effect
  const glowStyle = useAnimatedStyle(() => {
    return {
      opacity: 0.8 + (progressGlow.value * 0.2),
    };
  });

  // Calculate days remaining to reach 90 days
  const daysRemaining = 90 - cleanDays > 0 ? 90 - cleanDays : 0;

  // Calculate monthly progress
  useEffect(() => {
    if (logs && logs.length > 0) {
      calculateMonthlyProgress(logs);
    }
  }, [logs]);

  // Function to calculate monthly progress
  const calculateMonthlyProgress = (logEntries: LogEntry[]) => {
    if (!logEntries || logEntries.length === 0) {
      setMonthlyCleanDays(0);
      setMonthlyProgressPercentage(0);
      return;
    }

    // Get current month and year
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Calculate days in current month
    const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    setDaysInMonth(daysInCurrentMonth);

    // Filter logs for current month
    const currentMonthLogs = logEntries.filter(log => {
      const logDate = new Date(log.date);
      return logDate.getMonth() === currentMonth && logDate.getFullYear() === currentYear;
    });

    // Count clean days in current month
    const cleanDaysInMonth = currentMonthLogs.filter(log => log.is_clean).length;
    setMonthlyCleanDays(cleanDaysInMonth);

    // Calculate percentage
    const percentage = Math.round((cleanDaysInMonth / daysInCurrentMonth) * 100);
    setMonthlyProgressPercentage(percentage);

    console.log('Monthly progress calculated:', {
      month: currentMonth + 1,
      year: currentYear,
      daysInMonth: daysInCurrentMonth,
      cleanDays: cleanDaysInMonth,
      percentage
    });
  };

  // Chart configuration
  const chartConfig = {
    backgroundGradientFrom: theme.colors.cardBackground,
    backgroundGradientTo: theme.colors.cardBackground,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
    labelColor: (opacity = 1) => theme.colors.textSecondary,
    style: {
      borderRadius: 16
    },
    propsForDots: {
      r: "4",
      strokeWidth: "2",
      stroke: theme.colors.cardBackground
    },
    strokeWidth: 3,
    propsForBackgroundLines: {
      strokeDasharray: "", // solid background lines
      strokeWidth: 1,
      stroke: `${theme.colors.textSecondary}20` // transparent lines
    },
    propsForLabels: {
      fontSize: 10,
      fontWeight: "bold"
    }
  };

  // Check if user has an active pledge
  const checkActivePledge = async () => {
    try {
      setIsCheckingPledge(true);
      // Get the user's most recent pledge
      const response = await apiClient.get(BackendRoutes.PLEDGE_HISTORY);

      if (response.data && response.data.pledges && response.data.pledges.length > 0) {
        // Sort pledges by date (newest first)
        const sortedPledges = [...response.data.pledges].sort((a, b) =>
          new Date(b.check_in_at).getTime() - new Date(a.check_in_at).getTime()
        );

        // Check if the most recent pledge is within 24 hours
        const latestPledge = sortedPledges[0];
        const pledgeDate = new Date(latestPledge.check_in_at);
        const now = new Date();

        const diffHours = differenceInHours(now, pledgeDate);

        if (diffHours < 24) {
          // User has an active pledge
          setCanMakePledge(false);

          // Calculate remaining time
          const remainingHours = 24 - diffHours;
          const remainingMinutes = 60 - differenceInMinutes(now, pledgeDate) % 60;

          setActivePledgeTimeRemaining(`${Math.floor(remainingHours)}h ${remainingMinutes}m`);

          // Format pledge times
          setActivePledgeStartTime(formatPledgeTime(pledgeDate));

          const endDate = new Date(pledgeDate.getTime() + (24 * 60 * 60 * 1000));
          setActivePledgeEndTime(formatPledgeTime(endDate));
        } else {
          setCanMakePledge(true);
          setActivePledgeTimeRemaining(null);
        }
      } else {
        setCanMakePledge(true);
        setActivePledgeTimeRemaining(null);
      }
    } catch (error) {
      console.error('Error checking pledge status:', error);
      setCanMakePledge(true);
    } finally {
      setIsCheckingPledge(false);
    }
  };

  // Format pledge time in a user-friendly way
  const formatPledgeTime = (date: Date): string => {
    return date.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <GradientBackground>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustContentInsets={false}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.screenTitle}>Analytics</Text>
        <Text style={styles.screenSubtitle}>Track your progress and insights</Text>

        {/* Main progress circle */}
        <View style={styles.circleProgressCard}>
          <LinearGradient
            colors={['rgba(0, 0, 0, 0.35)', 'rgba(76, 62, 98, 0.28)']}
            style={styles.circleProgressGradient}
          >
            <Text style={styles.circleTitle}>Days Until Clean</Text>
            <View style={styles.circleContainer}>
              <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                {/* Background Circle */}
                <Circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke={'rgba(255, 255, 255, 0.16)'}
                  strokeWidth={strokeWidth}
                  fill="transparent"
                />

                {/* Progress Circle */}
                <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
                  <AnimatedCircle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="rgba(34, 197, 94, 0.3)"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    strokeDasharray={[circumference, circumference]}
                    animatedProps={animatedProps}
                    strokeLinecap="round"
                  />
                </G>
              </Svg>

              <Animated.View style={[styles.progressTextContainer]}>
                <Text style={styles.recoveryText}>RECOVERY</Text>
                <Text style={styles.percentageText}>{progressPercentage}%</Text>
              </Animated.View>
            </View>
            <Text style={styles.goalText}>Goal: 90 days porn-free</Text>
          </LinearGradient>
        </View>

        {/* Streak Stats */}
        <View style={styles.card}>
          <LinearGradient
            colors={['rgba(76, 62, 98, 0.25)', 'rgba(76, 62, 98, 0.38)']}
            style={styles.cardGradient}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Streak Statistics</Text>
              <Ionicons name="stats-chart" size={22} color={theme.colors.primary} />
            </View>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{longestStreak}</Text>
                <Text style={styles.statLabel}>Longest Streak</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{cleanDays}</Text>
                <Text style={styles.statLabel}>Current Streak</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{averageStreak}</Text>
                <Text style={styles.statLabel}>Avg. Streak</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Monthly Progress */}
        <View style={styles.card}>
          <LinearGradient
            colors={['rgba(76, 62, 98, 0.25)', 'rgba(76, 62, 98, 0.38)']}
            style={styles.cardGradient}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Monthly Progress</Text>
              <Ionicons name="calendar" size={22} color={theme.colors.primary} />
            </View>
            <View style={styles.progressContainer}>
              <Text style={styles.progressText}>Clean days this month 🔥: {monthlyCleanDays}/{daysInMonth}</Text>
              <View style={[styles.progressBar, { backgroundColor: 'rgba(255, 255, 255, 0.16)' }]}>
                <View style={[styles.progressFillContainer, { width: `${monthlyProgressPercentage}%` }]}>
                  <LinearGradient
                    colors={["#fde047", "#fb923c", "#ef4444"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.progressFillGradient}
                  />
                  <LinearGradient
                    colors={["#00000000", "#00000022", "#00000000"]}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={styles.progressEdgeGlow}
                  />
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Progress Over Time */}
        <View style={styles.card}>
          <LinearGradient
            colors={['rgba(76, 62, 98, 0.25)', 'rgba(76, 62, 98, 0.38)']}
            style={styles.cardGradient}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>
                <Ionicons name="trending-up" size={18} color={theme.colors.primary} /> Progress Over Time
              </Text>
              {progressTrend.value > 0 && (
                <View style={styles.trendContainer}>
                  <Ionicons
                    name={progressTrend.isPositive ? "arrow-up" : "arrow-down"}
                    size={16}
                    color={progressTrend.isPositive ? "#22C55E" : "#EF4444"}
                  />
                  <Text
                    style={[
                      styles.trendText,
                      { color: progressTrend.isPositive ? "#22C55E" : "#EF4444" }
                    ]}
                  >
                    {progressTrend.value}%
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.chartContainer}>
              {progressData.datasets[0].data.length > 0 ? (
                <>
                  <LineChart
                    data={{
                      ...progressData,
                      labels: ['', ''] // Ascundem etichetele originale
                    }}
                    width={screenWidth - 70}
                    height={240}
                    chartConfig={chartConfig}
                    bezier
                    style={styles.chart}
                    withInnerLines={true}
                    withVerticalLines={true}
                    withHorizontalLabels={true}
                    withVerticalLabels={false} // Dezactivăm etichetele verticale originale
                    withDots={true}
                    formatYLabel={(value) => `${value}%`}
                    yAxisInterval={25}
                    yAxisSuffix="%"
                    segments={4}
                    fromZero
                    withOuterLines={false}
                  />
                  <View style={styles.chartLabelContainer}>
                    <Text style={styles.chartLabel}>Join date</Text>
                    <Text style={styles.chartLabel}>Present</Text>
                  </View>
                </>
              ) : (
                <View style={styles.noDataContainer}>
                  <Text style={styles.noDataText}>Not enough data to display the chart</Text>
                </View>
              )}
            </View>

            <Text style={styles.chartDescription}>
              Recovery progress since app installation, with indicators reflecting your journey milestones and important moments in your recovery.
            </Text>
          </LinearGradient>
        </View>

        {/* 90 Day Challenge Banner - moved to the bottom */}
        <View style={styles.challengeBanner}>
          <LinearGradient
            colors={['rgba(76, 62, 98, 0.25)', 'rgba(76, 62, 98, 0.38)']}
            style={styles.challengeBannerGradient}
          >
            <View style={styles.challengeHeader}>
              <View style={styles.challengeTitleContainer}>
                <Text style={styles.challengeTitle}>90 Day Challenge</Text>
                <Text style={styles.challengeSubtitle}>Rewire your brain</Text>
              </View>
              <View style={styles.challengeBadge}>
                <Text style={styles.challengeBadgeText}>{progressPercentage}%</Text>
              </View>
            </View>

            <View style={styles.challengeContent}>
              <View style={styles.challengeStats}>
                <Text style={styles.challengeDaysCount}>{cleanDays}</Text>
                <Text style={styles.challengeDaysLabel}>days clean</Text>
              </View>

              <View style={styles.challengeInfoContainer}>
                <Text style={styles.challengeInfo}>
                  Studies show it takes about 90 days to rewire your brain and break free from addiction.
                  Stay consistent and track your progress here.
                </Text>

                <View style={styles.milestoneContainer}>
                  <View style={styles.milestone}>
                    <View style={[styles.milestoneMarker, cleanDays >= 30 ? styles.milestoneCompleted : {}]}>
                      {cleanDays >= 30 && <Ionicons name="checkmark" size={12} color="#fff" />}
                    </View>
                    <Text style={styles.milestoneText}>30 days 🔥</Text>
                  </View>

                  <View style={styles.milestone}>
                    <View style={[styles.milestoneMarker, cleanDays >= 60 ? styles.milestoneCompleted : {}]}>
                      {cleanDays >= 60 && <Ionicons name="checkmark" size={12} color="#fff" />}
                    </View>
                    <Text style={styles.milestoneText}>60 days 🚀</Text>
                  </View>

                  <View style={styles.milestone}>
                    <View style={[styles.milestoneMarker, cleanDays >= 90 ? styles.milestoneCompleted : {}]}>
                      {cleanDays >= 90 && <Ionicons name="checkmark" size={12} color="#fff" />}
                    </View>
                    <Text style={styles.milestoneText}>90 days 🏆</Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.challengeProgressBarContainer}>
              <View style={styles.challengeProgressBar}>
                <View style={[styles.challengeFillContainer, { width: `${progressPercentage}%` }]}>
                  <LinearGradient
                    colors={["#fde047", "#fb923c", "#ef4444"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.challengeProgressGradient}
                  />
                  <LinearGradient
                    colors={["#00000000", "#00000022", "#00000000"]}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={styles.challengeEdgeGlow}
                  />
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>

      </ScrollView>
    </GradientBackground>
  );
}

const createStyles = (theme: any, getColor: (theme: any, colorName: string, fallbackColor: string) => string) => StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
    backgroundColor: 'transparent',
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 8,
  },
  screenSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 20,
  },
  circleProgressCard: {
    backgroundColor: 'transparent',
    borderRadius: theme.borderRadius.medium,
    padding: 0,
    marginBottom: 16,
    alignItems: 'center',
    overflow: 'hidden',
  },
  circleProgressGradient: {
    padding: 16,
    borderRadius: theme.borderRadius.medium,
    width: '100%',
    alignItems: 'center',
  },
  circleTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 16,
  },
  circleContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 12,
  },
  progressTextContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    elevation: 0,
    zIndex: 10,
  },
  recoveryText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    letterSpacing: 1,
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  percentageText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
    backgroundColor: 'transparent',
  },
  daysRemainingText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  daysRemainingLabel: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginTop: -5,
  },
  progressPercentText: {
    fontSize: 14,
    color: theme.colors.textMuted,
    marginTop: 8,
  },
  goalText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 8,
  },
  card: {
    backgroundColor: 'transparent',
    borderRadius: theme.borderRadius.medium,
    padding: 0,
    marginBottom: 16,
    overflow: 'hidden',
  },
  cardGradient: {
    padding: 16,
    borderRadius: theme.borderRadius.medium,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  progressContainer: {
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    color: theme.colors.textPrimary,
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: getColor(theme, 'cardInteractive', '#F1F5F9'),
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 4,
  },
  progressFillGradient: {
    height: '100%',
    borderRadius: 4,
  },
  progressEdgeGlow: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  progressFillContainer: {
    height: '100%',
  },
  chartContainer: {
    alignItems: 'center',
    marginTop: 0,
    marginBottom: 10,
    paddingHorizontal: 10,
    paddingVertical: 0,
    backgroundColor: 'transparent',
  },
  chart: {
    borderRadius: theme.borderRadius.medium,
    paddingRight: 12,
    paddingLeft: 0,
    marginLeft: 0,
    marginBottom: -10,
  },
  chartDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    padding: 4,
    backgroundColor: 'transparent',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: getColor(theme, 'cardInteractive', '#F1F5F9'),
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  trendText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  activePledgeBanner: {
    flexDirection: 'row',
    backgroundColor: getColor(theme, 'success', '#4ade80'),
    borderRadius: 12,
    marginHorizontal: 0,
    marginBottom: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activePledgeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activePledgeContent: {
    flex: 1,
  },
  activePledgeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  activePledgeText: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 6,
  },
  activePledgeTimerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activePledgeTimerIcon: {
    marginRight: 4,
  },
  activePledgeTimerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  contentContainer: {
    paddingBottom: 60,
    paddingTop: 8,
  },
  noDataContainer: {
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    padding: 20,
  },
  noDataText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  chartLabelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 15,
    marginTop: -10,
    marginBottom: 0,
  },
  chartLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.colors.textSecondary,
  },
  // 90 Day Challenge Banner styles
  challengeBanner: {
    backgroundColor: 'transparent',
    borderRadius: theme.borderRadius.medium,
    padding: 0,
    marginBottom: 16,
    overflow: 'hidden',
  },
  challengeBannerGradient: {
    padding: 16,
    borderRadius: theme.borderRadius.medium,
  },
  challengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  challengeTitleContainer: {
    flex: 1,
  },
  challengeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  challengeSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  challengeBadge: {
    backgroundColor: ((theme.colors as any).success || '#22c55e') + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  challengeBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: (theme.colors as any).success || '#22c55e',
  },
  challengeContent: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  challengeStats: {
    alignItems: 'center',
    marginRight: 16,
  },
  challengeDaysCount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: (theme.colors as any).success || '#22c55e',
  },
  challengeDaysLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  challengeInfoContainer: {
    flex: 1,
  },
  challengeInfo: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  milestoneContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  milestone: {
    alignItems: 'center',
  },
  milestoneMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    marginBottom: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  milestoneCompleted: {
    backgroundColor: theme.colors.success || '#22c55e',
  },
  milestoneText: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  challengeProgressBarContainer: {
    marginTop: 8,
  },
  challengeProgressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  challengeProgress: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 3,
  },
  challengeProgressGradient: {
    height: '100%',
    borderRadius: 3,
  },
  challengeEdgeGlow: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  challengeFillContainer: {
    height: '100%',
  },
});

