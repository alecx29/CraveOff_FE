import React, { useState, useRef } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View, ScrollView, ActivityIndicator } from 'react-native';

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
  
  // Update info and check validation
  const handleInfoChange = (field: keyof PersonalInfo, value: string) => {
    const updatedInfo = { ...personalInfo, [field]: value };
    onUpdateInfo(updatedInfo);
    
    // Simple validation - name not empty and age is a number
    const nameValid = updatedInfo.name.trim().length > 0;
    const ageValid = /^\d+$/.test(updatedInfo.age) && Number(updatedInfo.age) > 0;
    
    setIsFormValid(nameValid && ageValid);
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