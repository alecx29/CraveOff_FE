import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import DayButton from './DayButton'; // Adjust the path as necessary

import { useFood } from '@/src/context/FoodProvider';

export interface WeekDayData {
  date: string;
  dayOfTheWeek: string;
  dayOfTheMonth: number;
}

const WeeklyBar = () => {
  const [currentDay, setCurrentDay] = useState<WeekDayData | null>(null);
  const [rollingWeek, setRollingWeek] = useState([]);
  const { selectedDay, updateSelectedDay } = useFood();

  const getRollingWeekDates = () => {
    const today = new Date();
    let week = [];
    let todayFormatted = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    let todayObject = null;

    for (let i = -5; i <= 1; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);

      const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const day = {
        date: formattedDate,
        dayOfTheWeek: date.toLocaleDateString('en-us', { weekday: 'narrow' }),
        dayOfTheMonth: date.getDate(),
      };

      week.push(day);
      if (formattedDate === todayFormatted) {
        todayObject = day;
      }
    }

    return { week, todayObject };
  };

  useEffect(() => {
    const { week, todayObject } = getRollingWeekDates();
    setRollingWeek(week as any);
    setCurrentDay(todayObject);
    updateSelectedDay(todayObject?.date || '');
  }, []);

  return (
    <View style={styles.container}>
      {rollingWeek.map((dayData: WeekDayData, index) => (
        <DayButton
          key={index + dayData.date}
          day={dayData.dayOfTheWeek}
          dayOfTheMonth={dayData.dayOfTheMonth}
          onPress={() => updateSelectedDay(dayData.date)}
          isSelected={dayData.date === selectedDay}
          isToday={currentDay?.date === dayData.date}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
});

export default WeeklyBar;
