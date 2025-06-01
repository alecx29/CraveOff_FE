import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useMemo, useRef } from 'react';
import { StyleSheet, Text, TextInputProps, View, TouchableOpacity, Dimensions } from 'react-native';
import { Swipeable, GestureHandlerRootView } from 'react-native-gesture-handler';

import { useTheme } from '@/src/context/ThemeProvider';

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
  const { theme } = useTheme();
  const styles = createStyles(theme);
  
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
          <MaterialCommunityIcons name="delete" size={24} color={theme.colors.textPrimary} />
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
                <MaterialCommunityIcons name="fire" size={12} style={styles.flameIcon} color={theme.colors.flame} />
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

const createStyles = (theme) => StyleSheet.create({
  container: {
    marginVertical: theme.spacing.sm,
    width: '100%',
  },
  label: {
    marginBottom: theme.spacing.xs,
    color: theme.colors.textSecondary,
    fontSize: theme.typography.tiny,
    fontWeight: theme.typography.weightMedium,
  },
  valueContainer: {
    ...theme.shadows.medium,
    height: 70,
    borderWidth: 0,
    borderRadius: theme.borderRadius.medium,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.cardInteractive,
    fontSize: theme.typography.body,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    color: theme.colors.textPrimary,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
  },
  titleQuantityContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    textAlign: 'left',
    marginBottom: theme.spacing.xs,
  },
  foodTitle: {
    color: theme.colors.textPrimary,
    fontWeight: theme.typography.weightMedium,
    fontSize: theme.typography.body,
  },
  calories: {
    color: theme.colors.flame,
    fontWeight: theme.typography.weightSemiBold,
  },
  macrosContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  foodDescrption: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.tiny,
  },
  foodMacros: {
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.weightNormal,
    fontSize: theme.typography.tiny,
    marginHorizontal: theme.spacing.xxs,
    marginRight: theme.spacing.sm,
  },
  time: {
    display: 'flex',
    justifyContent: 'flex-end',
    color: theme.colors.textMuted,
  },
  foodData: {
    color: theme.colors.textPrimary,
  },
  inputError: {
    borderColor: theme.colors.buttonEmergency,
  },
  textError: {
    color: theme.colors.buttonEmergency,
    marginTop: theme.spacing.xs,
    fontSize: theme.typography.small,
    fontWeight: theme.typography.weightMedium,
  },
  flexRow: {
    display: 'flex',
    flexDirection: 'row',
    marginRight: theme.spacing.xs,
    alignItems: 'center',
  },
  flameIcon: {
    display: 'flex',
    flexDirection: 'row',
    textAlign: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.xs,
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
    borderTopRightRadius: theme.borderRadius.medium,
    borderBottomRightRadius: theme.borderRadius.medium,
  },
  deleteButton: {
    backgroundColor: theme.colors.buttonEmergency,
  },
  actionText: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.tiny,
    marginTop: theme.spacing.xs,
    fontWeight: theme.typography.weightMedium,
  },
});
