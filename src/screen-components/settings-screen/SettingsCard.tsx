import { AntDesign, Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View, Text, Switch, StyleSheet, TouchableOpacity } from 'react-native';

interface SettingCardProps {
  icon: any
  title: string;
  value?: string;
  onPress?: () => void;
  showSwitch?: boolean;
  isActive?: boolean;
  onToggle?: (value: boolean) => void;
  type?: 'ant-design' | 'ion-icons'
}

const SettingCard: React.FC<SettingCardProps> = ({
  icon,
  title,
  value,
  onPress,
  showSwitch,
  isActive,
  onToggle,
  type = 'ion-icons'
}) => (
  <TouchableOpacity 
    style={styles.card} 
    onPress={onPress}
    disabled={showSwitch}
  >
    <View style={styles.cardContent}>
      <View style={styles.cardIcon}>
        {type === 'ion-icons'
          ? <Ionicons name={icon} size={24} color="#FFD33D" />
          : <AntDesign name="delete" size={24} color="#FFD33D" />
        }
      </View>
      <View style={styles.cardTextContainer}>
        <Text style={styles.cardTitle}>{title}</Text>
        {value && <Text style={styles.cardValue}>{value}</Text>}
      </View>
      {showSwitch ? (
        <Switch
          value={isActive}
          onValueChange={onToggle}
          trackColor={{ false: '#4A4A4A', true: '#FFD33D10' }}
          thumbColor={isActive ? '#FFD33D' : '#FFFFFF'}
          style={styles.switch}
        />
      ) : (
        <Ionicons name="chevron-forward" size={20} color="#6C6C6C" />
      )}
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  card: {
    // backgroundColor: '#2C2C2E',
    // backgroundColor: 'rgba(58, 63, 71, 1.00)',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 56
  },
  cardIcon: {
    width: 40,
    // height: 20,
    borderRadius: 20,
    backgroundColor: '#3A3A3C',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cardValue: {
    fontSize: 13,
    color: '#6C6C6C',
    marginTop: 2,
  },
  switch: {
    transform: [{ scale: 0.8 }],
  },
});

export default SettingCard;
