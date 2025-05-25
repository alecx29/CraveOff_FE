import React from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity } from 'react-native';

const DayButton = ({ day, onPress, isSelected, isToday, dayOfTheMonth }: any) => {
  const scale = new Animated.Value(1);

  const animateScale = (newScale: any) => {
    Animated.spring(scale, {
      toValue: newScale,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={() => animateScale(1.2)}
      onPressOut={() => animateScale(1)}
      style={styles.dayButton}>
      <Animated.View style={[{ transform: [{ scale }] }, styles.animatedContainer]}>
        <Text style={[styles.dot, isSelected && styles.selectedDot, isToday && styles.todayDot]}>
          {day}
        </Text>
        <Text style={[styles.dayOfTheMonth, isToday && styles.todayDot]}>{dayOfTheMonth}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  dayButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  animatedContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: 'grey',
    justifyContent: 'center', // Centers content vertically (Only works for View)
    alignItems: 'center', // Centers content horizontally (Only works for View)
    textAlign: 'center', // Center the text
    lineHeight: 30, // Ensures vertical centering inside the circle
    color: '#fff',
  },
  selectedDot: {
    color: '#ffd33d',
  },
  todayDot: {
    fontWeight: 700,
  },
  dayOfTheMonth: {
    color: '#fff',
    fontSize: 13,
    marginTop: 5,
    fontWeight: 400,
  },
});

export default DayButton;
