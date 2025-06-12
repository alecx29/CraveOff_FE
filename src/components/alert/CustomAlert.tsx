import React, { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { 
  Easing,
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutUp
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/src/context/ThemeProvider';

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
  autoClose?: boolean;
  duration?: number;
  type?: 'error' | 'success' | 'warning' | 'info';
}

const CustomAlert = ({
  visible,
  title,
  message,
  onClose,
  autoClose = true,
  duration = 5000,
  type = 'error'
}: CustomAlertProps) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  
  // Close the alert automatically after duration
  useEffect(() => {
    let timeoutId: number;
    
    if (visible && autoClose) {
      timeoutId = setTimeout(() => {
        onClose();
      }, duration);
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [visible, autoClose, duration, onClose]);
  
  // Don't render if not visible
  if (!visible) return null;
  
  // Get icon based on alert type
  const getIcon = () => {
    switch (type) {
      case 'error':
        return <Ionicons name="alert-circle" size={24} color="white" />;
      case 'success':
        return <Ionicons name="checkmark-circle" size={24} color="white" />;
      case 'warning':
        return <Ionicons name="warning" size={24} color="white" />;
      case 'info':
        return <Ionicons name="information-circle" size={24} color="white" />;
      default:
        return <Ionicons name="alert-circle" size={24} color="white" />;
    }
  };
  
  // Get background color based on alert type
  const getBackgroundColor = (): string => {
    const defaultColors = {
      error: '#FF3B30',
      success: '#34C759',
      warning: '#FF9500',
      info: '#007AFF'
    };
    
    // Safe property check function
    const getThemeColor = (keys: string[]): string => {
      for (const key of keys) {
        if (key in theme.colors) {
          return (theme.colors as any)[key] as string;
        }
      }
      return type === 'error' ? defaultColors.error : 
             type === 'success' ? defaultColors.success :
             type === 'warning' ? defaultColors.warning : 
             defaultColors.info;
    };
    
    switch (type) {
      case 'error':
        return getThemeColor(['buttonEmergency', 'emergency', 'error']);
      case 'success':
        return getThemeColor(['success', 'primary']);
      case 'warning':
        return getThemeColor(['warning', 'accentOrange', 'accent']);
      case 'info':
        return getThemeColor(['info', 'accentBlue', 'accent']);
      default:
        return getThemeColor(['buttonEmergency', 'emergency', 'error']);
    }
  };
  
  return (
    <Animated.View 
      style={[
        styles.overlay,
        { backgroundColor: 'rgba(0,0,0,0.5)' }
      ]}
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(300)}
    >
      <Animated.View 
        style={[
          styles.container,
          { backgroundColor: getBackgroundColor() }
        ]}
        entering={SlideInDown.duration(400).easing(Easing.bezier(0.22, 1, 0.36, 1))}
        exiting={SlideOutUp.duration(300).easing(Easing.bezier(0.22, 1, 0.36, 1))}
      >
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            {getIcon()}
          </View>
          
          <View style={styles.textContainer}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Animated.View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  container: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  content: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    color: 'white',
    opacity: 0.9,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CustomAlert; 