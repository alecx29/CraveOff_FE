import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface MacroProps {
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}

const dayStartValues = {
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
};

const MacroSummary: React.FC<MacroProps> = ({ calories, protein, carbs, fat }) => {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.label}>Calories</Text>
        <Text style={styles.value}>{calories ?? dayStartValues.calories}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>Protein</Text>
        <Text style={styles.value}>{protein ?? dayStartValues.protein + 'g'}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>Carbs</Text>
        <Text style={styles.value}>{carbs ?? dayStartValues.carbs + 'g'}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>Fat</Text>
        <Text style={styles.value}>{fat ?? dayStartValues.fat + 'g'}</Text>
      </View>
    </View>
  );
};

export default MacroSummary;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    // backgroundColor: '#25292e',
    borderRadius: 10,
    marginVertical: 10,
  },
  card: {
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#3a3f47',
    borderRadius: 8,
    width: '23%',
  },
  label: {
    fontSize: 14,
    color: '#ffd33d',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  value: {
    fontSize: 16,
    color: '#fff',
  },
});
