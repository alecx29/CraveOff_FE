import { MaterialCommunityIcons } from '@expo/vector-icons';
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
  const numberTrunc = (number?: number) => Math.trunc(number || 0);

  return (
    <View style={styles.container}>
      <View style={stylesSmall.paddingAround}>
        <View style={styles.caloriesContainer}>
          <View style={styles.caloriesCard}>
            <Text style={styles.label}>Calories left</Text>
            <Text style={styles.bigValue}>{numberTrunc(calories) ?? dayStartValues.calories}</Text>
          </View>
          <View style={stylesSmall.ProgressCircle}>
            <View>
              <MaterialCommunityIcons name="fire" size={18} color="#000" />
            </View>
          </View>
        </View>
      </View>
      <View style={styles.macroContainer}>
        <View style={styles.macroCard}>
          <View>
            <Text style={styles.value}>
              {(numberTrunc(protein) ?? dayStartValues.protein) + 'g'}
            </Text>
            <Text style={styles.label}>Protein left</Text>
          </View>
          <View style={stylesSmall.ProgressCircleSmall}>
            <View>
              <MaterialCommunityIcons name="food-drumstick" size={18} color="#B5523A" />
            </View>
          </View>
        </View>
        <View style={styles.macroCard}>
          <View>
            <Text style={styles.value}>{(numberTrunc(carbs) ?? dayStartValues.carbs) + 'g'}</Text>
            <Text style={styles.label}>Carbs left</Text>
          </View>
          <View style={stylesSmall.ProgressCircleSmall}>
            <View>
              <MaterialCommunityIcons name="corn" size={18} color="#E3B448" />
            </View>
          </View>
        </View>
        <View style={styles.macroCard}>
          <View>
            <Text style={styles.value}>{(numberTrunc(fat) ?? dayStartValues.fat) + 'g'}</Text>
            <Text style={styles.label}>Fat left</Text>
          </View>
          <View style={stylesSmall.ProgressCircleSmall}>
            <View>
              <MaterialCommunityIcons name="peanut-outline" size={18} color="#A3B18A" />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

export default MacroSummary;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    paddingHorizontal: 16,
    borderRadius: 10,
    position: 'relative',
    marginVertical: 10,
  },
  caloriesContainer: {
    flexDirection: 'row',
    paddingHorizontal: 50,
    borderRadius: 10,
    backgroundColor: '#3a3f47',
    paddingVertical: 10,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',

    padding: 10,

    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3, // Shadow for Android
  },

  caloriesCard: {
    display: 'flex',
    flexDirection: 'column',
  },
  macroContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderRadius: 10,
    paddingVertical: 10,
  },
  macroCard: {
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#3a3f47',
    borderRadius: 8,
    width: '31%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3, // Shadow for Android
  },
  caloriesCardTitleAndnumber: {
    display: 'flex',
    alignItems: 'center',
  },
  label: {
    fontSize: 12,
    color: '#ffd33d',
    marginBottom: 5,
  },
  value: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 600,
  },
  bigValue: {
    fontSize: 38,
    color: '#fff',
    fontWeight: 'bold',
  },
});

const stylesSmall = StyleSheet.create({
  ProgressCircle: {
    width: 75,
    height: 75,
    // backgroundColor: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 40,
    borderWidth: 5,
    borderColor: '#bbc',
  },
  ProgressCircleSmall: {
    marginTop: 15,
    width: 50,
    height: 50,
    // backgroundColor: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 40,
    borderWidth: 5,
    borderColor: '#bbc',
  },
  paddingAround: {
    padding: 16,
  },
});
