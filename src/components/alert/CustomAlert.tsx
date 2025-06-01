import React, { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSequence,
  withDelay,
  Easing,
  runOnJS,
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
    let timeoutId: NodeJS.Timeout;
    
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
  const getBackgroundColor = () => {
    switch (type) {
      case 'error':
        return theme.colors.error || '#FF3B30';
      case 'success':
        return theme.colors.success || '#34C759';
      case 'warning':
        return theme.colors.warning || '#FF9500';
      case 'info':
        return theme.colors.info || '#007AFF';
      default:
        return theme.colors.error || '#FF3B30';
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