import { Ionicons } from '@expo/vector-icons';
import { Tabs, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

export default function TabLayout() {
  const router = useRouter();

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#ffd33d',
          headerShown: false,
          tabBarStyle: {
            height: 90,
            paddingBottom: 12,
            paddingLeft: 12,
            paddingTop: 5,
            backgroundColor: '#25292e',
            paddingRight: 90
          },
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '600',
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'home-sharp' : 'home-outline'} color={color} size={24} />
            ),
          }}
        />
        <Tabs.Screen
          name="analytics"
          options={{
            title: 'Old Screen',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'newspaper' : 'newspaper-outline'} color={color} size={24}/>
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'settings' : 'settings-outline'} color={color} size={24}/>
            ),
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({});