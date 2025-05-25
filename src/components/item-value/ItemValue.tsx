import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useMemo, useRef } from 'react';
import { StyleSheet, Text, TextInputProps, View, TouchableOpacity, Dimensions } from 'react-native';
import { Swipeable, GestureHandlerRootView } from 'react-native-gesture-handler';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string | any;
  quantity?: string | any;
  protein?: string | any;
  fats?: string | any;
  carbs?: string | any;
  data?: string | any;
  time?: string | any;
  value: string | any;
  onDelete?: () => void;
  onEdit?: () => void;
  index?: number;
}

const ItemValue: React.FC<InputProps> = ({
  label,
  error,
  value,
  quantity,
  data,
  protein,
  fats,
  carbs,
  time,
  onDelete,
  onEdit,
  index,
}) => {
  const showedTime = useMemo(
    () => new Date(time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    [time],
  );

  const swipeableRef = useRef<Swipeable>(null);
  const buttonWidth = width * 0.2;

  const renderRightActions = (progress: any, dragX: any) => {
    return (
      <View style={[styles.rightActionsContainer, { width: buttonWidth }]}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => {
            if (onDelete) {
              onDelete();
              swipeableRef.current?.close();
            }
          }}
        >
          <MaterialCommunityIcons name="delete" size={24} color="#fff" />
          <Text style={styles.actionText}>Delete</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <Swipeable
        ref={swipeableRef}
        renderRightActions={renderRightActions}
        friction={1}
        rightThreshold={buttonWidth}
        overshootRight={false}
        enableTrackpadTwoFingerGesture
        onSwipeableRightOpen={() => {
          if (onDelete) {
            onDelete();
          }
        }}
      >
        <TouchableOpacity 
          activeOpacity={0.7}
          onPress={() => {
            if (onEdit) {
              onEdit();
            }
          }}
        >
          <View style={[styles.valueContainer, value.length >= 35 ? styles.height90 : null]}>
            <View style={[styles.maxWidth75]}>
              <View style={styles.titleQuantityContainer}>
                <Text style={styles.foodTitle}>{value}</Text>
                <Text style={styles.foodDescrption}>{'(' + quantity + ')'}</Text>
              </View>

              <View style={styles.macrosContainer}>
                <MaterialCommunityIcons name="food-drumstick" size={12} color="#B5523A" />
                <Text style={styles.foodMacros}>{protein}g</Text>

                <MaterialCommunityIcons name="corn" size={12} color="#E3B448" />
                <Text style={styles.foodMacros}>{carbs}g</Text>

                <MaterialCommunityIcons name="peanut-outline" size={12} color="#A3B18A" />
                <Text style={styles.foodMacros}>{fats}g</Text>
              </View>
            </View>
            <View>
              <View style={styles.flexRow}>
                <MaterialCommunityIcons name="fire" size={12} style={styles.flameIcon} color="orange" />
                <Text style={styles.calories}>{data}</Text>
              </View>
              <Text style={[styles.foodMacros, styles.time]}>{showedTime}</Text>
            </View>
          </View>
        </TouchableOpacity>
      </Swipeable>
      {error && <Text style={styles.textError}>{error}</Text>}
    </GestureHandlerRootView>
  );
};

export default ItemValue;

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    width: '100%',
    // boxShadow:'0px 2px 4px rgba(0, 0, 0, 0.20)'
  },
  label: {
    marginBottom: 4,
    // color: '#333',
    color: '#fff',
    fontSize: 12,
  },
  valueContainer: {
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.20)',
    height: 70,
    borderWidth: 0,
    borderRadius: 12,
    paddingHorizontal: 12,
    // backgroundColor: 'rgba(58, 63, 71, 1.00)',
    backgroundColor: 'rgba(37, 41, 46, 0.90)',
    fontSize: 16,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    color: '#fff',
  },
  titleQuantityContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    textAlign: 'left',
    marginBottom: 5,
  },
  foodTitle: {
    color: '#fff',
    fontWeight: 400,
  },
  calories: {
    color: '#fff',
    fontWeight: 600,
  },
  macrosContainer: {
    display: 'flex',
    flexDirection: 'row',
  },
  foodDescrption: {
    color: '#ababab',
    fontSize: 12,
  },
  foodMacros: {
    color: '#fff',
    fontWeight: 400,
    fontSize: 10,
    marginHorizontal: 2,
    marginRight: 8,
  },
  time: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
  foodData: {
    color: '#fff',
  },
  inputError: {
    borderColor: '#FF4D4F',
  },
  textError: {
    color: '#FF4D4F',
    marginTop: 4,
    fontSize: 14,
  },
  flexRow: {
    display: 'flex',
    flexDirection: 'row',
    marginRight: 5,
  },
  flameIcon: {
    display: 'flex',
    flexDirection: 'row',
    textAlign: 'center',
    alignItems: 'center',
    marginRight: 5,
  },
  maxWidth75: {
    maxWidth: '70%',
  },
  height90: {
    height: 90,
  },
  rightActionsContainer: {
    flexDirection: 'row',
    height: '100%',
    marginRight: -1,
    position: 'absolute',
    right: 0,
    backgroundColor: 'transparent',
  },
  actionButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
  deleteButton: {
    backgroundColor: '#E53935',
  },
  actionText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
  },
});
