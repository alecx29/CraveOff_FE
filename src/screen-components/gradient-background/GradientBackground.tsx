import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { View, StyleSheet } from 'react-native';

// background-image: linear-gradient(rgba(22 23 24, 1), rgba(37, 41, 46, 0.89));

// colors={['rgba(37, 41, 46, 1.00)', 'rgba(37, 41, 46, 0.89)']}

const GradientBackground = ({ children }: any) => {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(22, 23, 24, 0.99)', 'rgba(37, 41, 46, 0.91)']}
        style={StyleSheet.absoluteFill} // Covers full screen
      />
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
});

export default GradientBackground;
