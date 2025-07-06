import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity 
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/src/context/ThemeProvider';

interface HeaderProps {
  title: string;
  titleColor?: string;
  onClose?: () => void;
  backgroundColor?: string;
}

const Header: React.FC<HeaderProps> = ({ 
  title, 
  titleColor, 
  onClose,
  backgroundColor
}) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  
  // Adjust for safe areas
  const topPadding = Math.max(insets.top, 20);
  
  const styles = createStyles(theme, topPadding, titleColor, backgroundColor);
  
  return (
    <View style={styles.fixedHeader}>
      <Text style={styles.headerTitle}>{title}</Text>
      {onClose && (
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={onClose}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const createStyles = (theme: any, topPadding: number, titleColor?: string, backgroundColor?: string) => StyleSheet.create({
  fixedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: topPadding + 14,
    paddingBottom: 10,
    paddingHorizontal: 20,
    backgroundColor: backgroundColor || theme.colors.backgroundDeep || '#121212',
    position: 'relative',
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: titleColor || theme.colors.textPrimary || '#fff',
    textAlign: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: topPadding + 10,
    right: 20,
    padding: 5,
    zIndex: 10,
    borderRadius: 20,
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
});

export default Header;
