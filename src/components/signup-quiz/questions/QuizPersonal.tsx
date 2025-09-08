import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View, ScrollView, ActivityIndicator, Switch, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import { getExpoPushTokenAsync, registerDeviceWithBackend } from '@/src/services/pushService';

import { useTheme } from '@/src/context/ThemeProvider';

export interface PersonalInfo {
  name: string;
  age: string;
}

interface QuizPersonalProps {
  personalInfo: PersonalInfo;
  onUpdateInfo: (info: PersonalInfo) => void;
  onComplete: () => void;
  isLoading?: boolean;
}

const QuizPersonal = ({ personalInfo, onUpdateInfo, onComplete, isLoading = false }: QuizPersonalProps) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  
  // Reference for the age input field
  const ageInputRef = useRef<TextInput>(null);
  
  // Local state for form validation and focus
  const [isFormValid, setIsFormValid] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(false);
  const [checkingPermission, setCheckingPermission] = useState<boolean>(true);
  const [toggling, setToggling] = useState<boolean>(false);
  
  // Update info and check validation
  const handleInfoChange = (field: keyof PersonalInfo, value: string) => {
    const updatedInfo = { ...personalInfo, [field]: value };
    onUpdateInfo(updatedInfo);
    
    // Simple validation - name not empty and age is a number
    const nameValid = updatedInfo.name.trim().length > 0;
    const ageValid = /^\d+$/.test(updatedInfo.age) && Number(updatedInfo.age) > 0;
    
    setIsFormValid(nameValid && ageValid);
  };

  // Prompt for notifications permission on mount of this step
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setCheckingPermission(true);
        const { status } = await Notifications.getPermissionsAsync();
        console.log('[QuizPersonal] Initial permission status:', status);
        if (status !== 'granted') {
          // Triggers OS prompt
          console.log('[QuizPersonal] Requesting permission and token...');
          await getExpoPushTokenAsync();
        }
        const { status: finalStatus } = await Notifications.getPermissionsAsync();
        const granted = finalStatus === 'granted';
        console.log('[QuizPersonal] Final permission status:', finalStatus);
        if (isMounted) setNotificationsEnabled(granted);
        if (granted) {
          // Attempt to register device with backend; ignore result if unauthenticated yet
          try { 
            console.log('[QuizPersonal] Registering device after grant (mount)');
            await registerDeviceWithBackend({ silent: true }); 
          } catch {}
        }
      } catch {}
      finally {
        if (isMounted) setCheckingPermission(false);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  const handleToggleNotifications = async (value: boolean) => {
    if (toggling) return;
    setToggling(true);
    console.log('[QuizPersonal] Toggle notifications ->', value ? 'enable' : 'disable');
    try {
      if (value) {
        // Check/request OS permission first; toggle reflects OS permission status
        const { status } = await Notifications.getPermissionsAsync();
        let finalStatus = status;
        if (status !== 'granted') {
          const req = await Notifications.requestPermissionsAsync();
          finalStatus = req.status;
        }
        const grantedNow = finalStatus === 'granted';
        setNotificationsEnabled(grantedNow);
        if (grantedNow) {
          console.log('[QuizPersonal] Registering device after toggle enable');
          const ok = await registerDeviceWithBackend({ silent: true });
          if (!ok) {
            console.log('[QuizPersonal] Registration attempt failed after enable');
          }
        } else {
          Alert.alert('Enable notifications', 'Please allow notifications in the system prompt or device Settings.');
        }
      } else {
        // Cannot revoke OS permission programmatically
        setNotificationsEnabled(false);
        Alert.alert('Notifications disabled', 'You can re-enable notifications anytime from Settings.');
      }
    } finally {
      setToggling(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.finalLabel}>
        Finally
      </Text>
      
      <Text style={styles.title}>
        A little more about you
      </Text>
      
      <View style={styles.formContainer}>
        <View>
          <Text style={styles.inputLabel}>Full Name</Text>
          <TextInput
            style={[
              styles.textInput,
              focusedField === 'name' && styles.focusedInput
            ]}
            value={personalInfo.name}
            onChangeText={(text) => handleInfoChange('name', text)}
            placeholder="Your full name"
            placeholderTextColor={theme.colors.textSecondary + '80'}
            onFocus={() => setFocusedField('name')}
            onBlur={() => setFocusedField(null)}
            returnKeyType="next"
            onSubmitEditing={() => ageInputRef.current?.focus()}
            blurOnSubmit={false}
          />
        </View>
        
        <View>
          <Text style={styles.inputLabel}>Age</Text>
          <TextInput
            ref={ageInputRef}
            style={[
              styles.textInput,
              focusedField === 'age' && styles.focusedInput
            ]}
            value={personalInfo.age}
            onChangeText={(text) => handleInfoChange('age', text)}
            placeholder="Your age"
            placeholderTextColor={theme.colors.textSecondary + '80'}
            keyboardType="number-pad"
            onFocus={() => setFocusedField('age')}
            onBlur={() => setFocusedField(null)}
            returnKeyType="done"
            onSubmitEditing={() => isFormValid && onComplete()}
          />
        </View>
      </View>
      
      <View style={styles.notificationsRow}>
        <View style={styles.notificationsTextContainer}>
          <Text style={styles.notificationsTitle}>Allow notifications</Text>
          <Text style={styles.notificationsSubtitle}>Get gentle reminders and progress updates</Text>
        </View>
        <Switch
          value={notificationsEnabled}
          onValueChange={handleToggleNotifications}
          thumbColor={notificationsEnabled ? theme.colors.primary : theme.colors.cardBackground}
          trackColor={{ false: theme.colors.textSecondary + '40', true: theme.colors.primary + '80' }}
          disabled={checkingPermission || toggling}
        />
      </View>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.completeButton,
            (!isFormValid || isLoading) && styles.disabledButton
          ]}
          onPress={onComplete}
          disabled={!isFormValid || isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={theme.colors.cardBackground} />
          ) : (
            <Text style={styles.completeButtonText}>Complete Quiz</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 60,
  },
  finalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 32,
    lineHeight: 30,
  },
  formContainer: {
    marginTop: 16,
    gap: 24,
  },
  notificationsRow: {
    marginTop: 24,
    padding: 16,
    backgroundColor: theme.colors.cardBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...theme.shadows.light,
  },
  notificationsTextContainer: {
    flex: 1,
    paddingRight: 12,
  },
  notificationsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  notificationsSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.textPrimary,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: theme.colors.textPrimary,
    ...theme.shadows.light,
    outlineStyle: 'none',
    outlineWidth: 0,
  },
  focusedInput: {
    borderColor: theme.colors.borderLight,
    borderWidth: 1,
    ...theme.shadows.medium,
  },
  buttonContainer: {
    marginTop: 40,
  },
  completeButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.medium,
  },
  disabledButton: {
    backgroundColor: theme.colors.primary + '80',
    ...theme.shadows.light,
  },
  completeButtonText: {
    color: theme.colors.cardBackground,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default QuizPersonal; 