import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/src/context/ThemeProvider';

export default function TabLayout() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  
  // Helper function to safely access theme colors
  const getColor = (colorName: string, fallbackColor: string): string => {
    const colors = theme.colors as Record<string, string>;
    if (colorName in colors) return colors[colorName];
    return fallbackColor;
  };
  
  // Calculate bottom padding based on platform and insets
  const bottomPadding = Platform.OS === 'android' ? Math.max(16, insets.bottom + 8) : 16 + insets.bottom;
  const tabBarHeight = Platform.OS === 'android' ? 80 + Math.max(insets.bottom, 8) : 80 + insets.bottom;
  
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        headerShown: false,
        tabBarStyle: {
          height: tabBarHeight,
          paddingBottom: bottomPadding,
          paddingTop: 8,
          backgroundColor: getColor('backgroundDeep', theme.colors.background),
          borderTopWidth: 1,
          borderTopColor: getColor('borderLight', '#e2e8f0'),
          ...theme.shadows.medium
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginTop: 3,
          marginBottom: 2,
          paddingBottom: 2,
        },
        tabBarLabelPosition: 'below-icon',
        tabBarInactiveTintColor: theme.colors.textMuted,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} color={color} size={22} />
          ),
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Analytics',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'bar-chart' : 'bar-chart-outline'} color={color} size={22} />
          ),
        }}
      />
      <Tabs.Screen
        name="journal"
        options={{
          title: 'Journal',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'book' : 'book-outline'} color={color} size={22}/>
          ),
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: 'Community',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'people' : 'people-outline'} color={color} size={22}/>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} color={color} size={22}/>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({});