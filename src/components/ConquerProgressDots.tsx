import React from 'react';
import { View, StyleSheet } from 'react-native';

interface Props {
  activeIndex: number; // 0-based
}

export default function ConquerProgressDots({ activeIndex }: Props) {
  return (
    <View style={styles.container}>
      {[0, 1, 2].map((i) => (
        <View
          key={i}
          style={[styles.dot, i === activeIndex ? styles.activeDot : styles.inactiveDot]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  activeDot: {
    backgroundColor: '#fff',
  },
  inactiveDot: {
    backgroundColor: '#bdbdbd',
  },
}); 