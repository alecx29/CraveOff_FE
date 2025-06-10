import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withRepeat, Easing, useAnimatedProps } from 'react-native-reanimated';
import { Svg, Circle, G } from 'react-native-svg';
import { LineChart } from 'react-native-chart-kit';
import { format, subDays, isAfter, parseISO } from 'date-fns';

import { useTheme } from '@/src/context/ThemeProvider';
import { useLogs, LogEntry } from '@/src/context/LogsContext';
import GradientBackground from '@/src/screen-components/gradient-background/GradientBackground';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const screenWidth = Dimensions.get('window').width;

export default function AnalyticsScreen() {
  const { theme } = useTheme();
  const { lastRelapseData, fetchLogs, isLoading, logs } = useLogs();
  const styles = createStyles(theme);
  
  // State for clean days progress
  const [cleanDays, setCleanDays] = useState(0);
  const [progressPercentage, setProgressPercentage] = useState(0);
  
  // Stats for streak statistics
  const [longestStreak, setLongestStreak] = useState(0);
  const [averageStreak, setAverageStreak] = useState(0);
  
  // Monthly progress stats
  const [monthlyCleanDays, setMonthlyCleanDays] = useState(0);
  const [daysInMonth, setDaysInMonth] = useState(0);
  const [monthlyProgressPercentage, setMonthlyProgressPercentage] = useState(0);
  
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
  
  // Calculate clean days and progress percentage based on last relapse date
  useEffect(() => {
    fetchLogs();
  }, []);
  
  // Calculate streak statistics from logs
  useEffect(() => {
    if (logs && logs.length > 0) {
      calculateStreakStats(logs);
      calculateProgressOverTime(logs);
    }
  }, [logs]);
  
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
    dateLabels[0] = format(datesToCalculate[0], 'dd/MM/yy');
    
    // Last date label (today)
    dateLabels[dateLabels.length - 1] = 'Acum';
    
    // For milestone points, add a short label
    if (datesToCalculate.length > 3) {
      for (let i = 1; i < datesToCalculate.length - 1; i++) {
        // Check for key milestone days from the start date
        const daysSinceStart = Math.round(
          (datesToCalculate[i].getTime() - earliestLogDate.getTime()) / (24 * 3600 * 1000)
        );
        
        if (keyMilestones.includes(daysSinceStart)) {
          // For key milestones, show the day number
          dateLabels[i] = `Z${daysSinceStart}`;
        } else if (i % 2 === 0 && dateLabels.length > 7) {
          // For longer charts, add some date markers
          dateLabels[i] = format(datesToCalculate[i], 'dd/MM');
        }
      }
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
        progressScores[index] = index > 0 ? progressScores[index-1] : 0; // Maintain previous score if no data
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
      const previousScore = index > 0 ? progressScores[index-1] : 0;
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
    
    // Create chart data object
    const chartData = {
      labels: dateLabels,
      datasets: [
        {
          data: progressScores,
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
  
  useEffect(() => {
    if (lastRelapseData && lastRelapseData.last_relapse_date) {
      try {
        // Parse the relapse date (in UTC format)
        const relapseDateTime = new Date(lastRelapseData.last_relapse_date);
        
        // Check if the date is valid
        if (isNaN(relapseDateTime.getTime())) {
          console.error('Invalid date format:', lastRelapseData.last_relapse_date);
          setCleanDays(0);
          setProgressPercentage(0);
          return;
        }
        
        // Get current time
        const now = new Date();
        
        // Calculate the time difference in milliseconds
        const diffTimeMs = now.getTime() - relapseDateTime.getTime();
        
        // Only proceed if the relapse date is in the past
        if (diffTimeMs > 0) {
          // Calculate days since relapse
          const diffDays = Math.floor(diffTimeMs / (24 * 3600 * 1000));
          
          // Goal is 90 days
          const GOAL_DAYS = 90;
          // Calculate percentage (0 to 100)
          const percentage = Math.min(100, Math.round((diffDays / GOAL_DAYS) * 100));
          
          setCleanDays(diffDays);
          setProgressPercentage(percentage);
        } else {
          setCleanDays(0);
          setProgressPercentage(0);
        }
      } catch (e) {
        console.error('Error calculating clean days:', e);
        setCleanDays(0);
        setProgressPercentage(0);
      }
    } else {
      setCleanDays(0);
      setProgressPercentage(0);
    }
  }, [lastRelapseData]);
  
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
      r: "6",
      strokeWidth: "2",
      stroke: theme.colors.cardBackground
    }
  };

  return (
    <GradientBackground>
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Analytics</Text>
        <Text style={styles.subtitle}>Track your progress and insights</Text>
        
        {/* Days Until Clean Circle Progress */}
        <View style={styles.circleProgressCard}>
          <Text style={styles.circleTitle}>Days Until Clean</Text>
          <View style={styles.circleContainer}>
            <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
              {/* Background Circle */}
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={theme.colors.cardInteractive}
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
        </View>
        
        {/* Streak Stats */}
        <View style={styles.card}>
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
        </View>
        
        {/* Monthly Progress */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Monthly Progress</Text>
            <Ionicons name="calendar" size={22} color={theme.colors.primary} />
          </View>
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>Clean days this month: {monthlyCleanDays}/{daysInMonth}</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${monthlyProgressPercentage}%` }]} />
            </View>
          </View>
        </View>
        
        {/* Progress Over Time */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>
              <Ionicons name="trending-up" size={18} color={theme.colors.primary} /> Evoluția în timp
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
                    {color: progressTrend.isPositive ? "#22C55E" : "#EF4444"}
                  ]}
                >
                  {progressTrend.value}%
                </Text>
              </View>
            )}
          </View>
          
          <View style={styles.chartContainer}>
            <LineChart
              data={progressData}
              width={screenWidth - 70}
              height={180}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
              withInnerLines={false}
              withVerticalLines={false}
              withHorizontalLabels={true}
              withVerticalLabels={true}
              withDots={true}
              formatYLabel={(value) => `${value}%`}
              fromZero
            />
          </View>
          
          <Text style={styles.chartDescription}>
            Evoluția recuperării de la instalarea aplicației, cu indicatori care reflectă progresul în timp, adaptată la streakuri și momente importante din călătoria ta.
          </Text>
        </View>
      </ScrollView>
    </GradientBackground>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginBottom: 24,
  },
  circleProgressCard: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.medium,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    ...theme.shadows.medium,
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
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.medium,
    padding: 16,
    marginBottom: 16,
    ...theme.shadows.light,
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
    backgroundColor: theme.colors.cardInteractive,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 4,
  },
  chartContainer: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  chart: {
    borderRadius: theme.borderRadius.medium,
    paddingRight: 12,
  },
  chartDescription: {
    fontSize: 12,
    color: theme.colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.cardInteractive,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  trendText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 2,
  },
});
