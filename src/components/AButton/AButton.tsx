import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, TextStyle, TouchableOpacity, ViewStyle } from 'react-native';

interface AButtonProps {
  onPress: () => void;
  title?: string;
  color?: string; // Default color
  customStyles?: {
    button?: ViewStyle;
    text?: TextStyle;
  };
  disabled?: boolean;
  gradient?: any;
  leftChildren?: any;
  children?: React.ReactNode; // Support for icons, images, or custom content
}

const AButton: React.FC<AButtonProps> = ({
  title,
  onPress,
  color,
  customStyles,
  disabled,
  children,
  leftChildren,
  gradient,
}) => {
  return (
    <TouchableOpacity onPress={!disabled ? onPress : () => {}}>
      <LinearGradient
        colors={gradient || ['#3A4047', '#2A2F37']} // Lighter to darker shades of dark silver
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[{ backgroundColor: color }, styles.button, customStyles?.button]}>
        {children && leftChildren ? children : null}
        {title ? <Text style={[styles.buttonText, customStyles?.text]}>{title}</Text> : null}
        {children && !leftChildren ? children : null}
      </LinearGradient>
    </TouchableOpacity>
  );
};
// transition-duration: 0s;
//     background-image: linear-gradient(to bottom, rgba(255, 221, 85, 1), rgba(255, 200, 0, 1));
//     color: white;
const styles = StyleSheet.create({
  button: {
    display: 'flex',
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(58,63,71,1.00)',

    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3, // Android shadow
  },
  buttonText: {
    fontSize: 14,
    fontWeight: 600,
    display: 'flex',
    color: '#ffd33d', // Default text color
    marginHorizontal: 8,
  },
  icon: {
    width: 24,
    height: 24,
  },
});

export default AButton;
