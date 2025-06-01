import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
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

// Helper function to get the date string for a specific day of the week
const getDateStringForDay = (dayIndex: number): string => {
  const today = new Date();
  const currentDayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  // Calculate the difference between the target day and current day
  const diff = dayIndex - currentDayOfWeek;
  
  // Create a new date by adding the difference
  const targetDate = new Date(today);
  targetDate.setDate(today.getDate() + diff);
  
  // Format the date as YYYY-MM-DD
  return targetDate.toISOString().split('T')[0];
};

interface WeekBarProps {
  weekLogsStatus: Array<'clean' | 'not-clean' | 'no-log'>;
}

const WeekBar = ({ weekLogsStatus }: WeekBarProps) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  
  // Determine current day
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  return (
    <View style={styles.weekCard}>
      <Text style={styles.sectionTitle}>This Week</Text>
      
      <View style={styles.daysRow}>
        {/* Days of week with log status */}
        <DayCircle day="S" text="Sun" isToday={dayOfWeek === 0} logStatus={weekLogsStatus[0]} />
        <DayCircle day="M" text="Mon" isToday={dayOfWeek === 1} logStatus={weekLogsStatus[1]} />
        <DayCircle day="T" text="Tue" isToday={dayOfWeek === 2} logStatus={weekLogsStatus[2]} />
        <DayCircle day="W" text="Wed" isToday={dayOfWeek === 3} logStatus={weekLogsStatus[3]} />
        <DayCircle day="T" text="Thu" isToday={dayOfWeek === 4} logStatus={weekLogsStatus[4]} />
        <DayCircle day="F" text="Fri" isToday={dayOfWeek === 5} logStatus={weekLogsStatus[5]} />
        <DayCircle day="S" text="Sat" isToday={dayOfWeek === 6} logStatus={weekLogsStatus[6]} />
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: 16,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});

export default WeekBar; 