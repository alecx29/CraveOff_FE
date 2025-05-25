'use client';


import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Slider from '@react-native-community/slider';
import { router } from 'expo-router';
import { useCallback, useContext, useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View, Alert } from 'react-native';
import Animated, { FadeInRight, FadeOutLeft } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { apiClient } from '@/src/axios/apiClient';
import { BackendRoutes } from '@/src/axios/backendRoutes';
import AButton from '@/src/components/AButton/AButton';
import Input from '@/src/components/Input';
import { AuthContext } from '@/src/context/AuthContext';

type RegisterStep =
  | 'gender'
  | 'activity'
  | 'goals'
  | 'results'
  | 'measurements'
  | 'birthdate'
  | 'obstacles'
  | 'notifications'
  | 'create-account';

interface UserData {
  gender: string;
  workoutsPerWeek: string;
  goals: string;
  height: number;
  weight: number;
  birthdate: string;
  obstacles: string[];
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export default function Signup() {
  const [currentStep, setCurrentStep] = useState<RegisterStep>('gender');
  const [userData, setUserData] = useState<UserData>({
    gender: '',
    workoutsPerWeek: '',
    goals: '',
    height: 170,
    weight: 70,
    birthdate: '',
    obstacles: [],
    email: '',
    password: '',
  });
  const [isMetric, setIsMetric] = useState(true);
  const { signUp } = useContext(AuthContext);

  const handleNext = () => {
    const steps: RegisterStep[] = [
      'gender',
      'activity',
      'goals',
      'results',
      'measurements',
      'birthdate',
      'obstacles',
      'notifications',
      'create-account',
    ];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const handleBack = () => {
    const steps: RegisterStep[] = [
      'gender',
      'activity',
      'goals',
      'results',
      'measurements',
      'birthdate',
      'obstacles',
      'notifications',
      'create-account',
    ];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  const handleRegister = useCallback(
    async (idToken?: string): Promise<void> => {
      try {
        // Determină payload-ul în funcție de metoda de autentificare
        let payload;
        
        if (idToken) {
          // Dacă avem idToken, se folosește Google auth
          // Nu trimitem email și parolă în acest caz
          const { email, password, ...userDataWithoutCredentials } = userData;
          payload = { 
            ...userDataWithoutCredentials, 
            provider: 'GOOGLE', 
            idToken 
          };
        } else {
          // Se folosește email/password
          payload = { 
            ...userData, 
            provider: 'LOCAL' 
          };
        }
        
        // Trimite datele la API
        const response = await apiClient.post(BackendRoutes.REGISTER, payload);

        console.log('Register successful:', response.data);
        const { accessToken, refreshToken, user } = response.data;

        // Salvează tokenurile și informațiile utilizatorului
        signUp({ accessToken, refreshToken });
        await AsyncStorage.setItem('user', JSON.stringify(user));
        
        console.log('User authenticated:', user);
        
        // Navighează direct la pagina principală, nu la login
        router.push('/');
      } catch (error: any) {
        console.error('Register error:', error.response?.data || error.message);
        Alert.alert(
          'Eroare la înregistrare', 
          error.response?.data?.message || 'A apărut o eroare la înregistrare. Încearcă din nou.'
        );
      }
    },
    [userData, apiClient, router, signUp],
  );

  const getStepNumber = () => {
    const steps: RegisterStep[] = [
      'gender',
      'activity',
      'goals',
      'results',
      'measurements',
      'birthdate',
      'obstacles',
      'notifications',
      'create-account',
    ];
    return steps.indexOf(currentStep) + 1;
  };

  const totalSteps = 9;
  const progress = (getStepNumber() / totalSteps) * 100;

  const renderStep = () => {
    switch (currentStep) {
    case 'gender':
      return (
        <Animated.View entering={FadeInRight} exiting={FadeOutLeft} style={styles.stepContainer}>
          <Text style={styles.title}>Choose your gender</Text>
          <Text style={styles.subtitle}>This will be used to calibrate your custom plan.</Text>
          {['Male', 'Female', 'Other'].map(gender => (
            <TouchableOpacity
              key={gender}
              style={[styles.card, userData.gender === gender && styles.selectedCard]}
              onPress={() => setUserData({ ...userData, gender })}>
              <Text
                style={[styles.cardText, userData.gender === gender && styles.selectedCardText]}>
                {gender}
              </Text>
            </TouchableOpacity>
          ))}
        </Animated.View>
      );

    case 'activity':
      return (
        <Animated.View entering={FadeInRight} exiting={FadeOutLeft} style={styles.stepContainer}>
          <Text style={styles.title}>How many workouts do you do per week?</Text>
          <Text style={styles.subtitle}>This will be used to calibrate your custom plan.</Text>
          {[
            { label: '0-2', subtitle: 'Workouts now and then' },
            { label: '3-5', subtitle: 'A few workouts per week' },
            { label: '6+', subtitle: 'Dedicated athlete' },
          ].map(option => (
            <TouchableOpacity
              key={option.label}
              style={[
                styles.card,
                userData.workoutsPerWeek === option.label && styles.selectedCard,
              ]}
              onPress={() => setUserData({ ...userData, workoutsPerWeek: option.label })}>
              <Text
                style={[
                  styles.cardText,
                  userData.workoutsPerWeek === option.label && styles.selectedCardText,
                ]}>
                {option.label}
              </Text>
              <Text style={styles.cardSubtext}>{option.subtitle}</Text>
            </TouchableOpacity>
          ))}
        </Animated.View>
      );

    case 'goals':
      return (
        <Animated.View entering={FadeInRight} exiting={FadeOutLeft} style={styles.stepContainer}>
          <Text style={styles.title}>What is your goal?</Text>
          <Text style={styles.subtitle}>
              This helps us generate a plan for your calorie intake.
          </Text>
          {[
            { value: 'Lose weight', icon: 'trending-down' },
            { value: 'Maintain', icon: 'fitness' },
            { value: 'Gain weight', icon: 'trending-up' },
          ].map(goal => (
            <TouchableOpacity
              key={goal.value}
              style={[styles.card, userData.goals === goal.value && styles.selectedCard]}
              onPress={() => setUserData({ ...userData, goals: goal.value })}>
              <View style={styles.cardContent}>
                <Ionicons
                  name={goal.icon as any}
                  size={24}
                  color={userData.goals === goal.value ? 'rgba(255,211,61,1.00)' : '#A0A0A0'}
                />
                <Text
                  style={[
                    styles.cardText,
                    userData.goals === goal.value && styles.selectedCardText,
                  ]}>
                  {goal.value}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </Animated.View>
      );

    case 'results':
      return (
        <Animated.View entering={FadeInRight} exiting={FadeOutLeft} style={styles.stepContainer}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>
                MacroBuddy is designed for long-term results
              <Ionicons name="diamond" size={22} color="#FFD33D" style={{marginLeft: 8}} />
            </Text>
          </View>
          <Text style={styles.subtitle}>
              Our AI-powered approach is designed for lasting success
          </Text>
            
          <View style={styles.graphContainer}>
            <View style={styles.graphHeader}>
              <Text style={styles.weightLabel}>Your Weight</Text>
            </View>
              
            <View style={styles.graph}>
              {/* Graph Background Grid */}
              <View style={styles.gridLine} />
              <View style={[styles.gridLine, {top: '50%'}]} />
              <View style={[styles.gridLine, {top: '75%'}]} />
                
              {/* Common starting point */}
              <View style={[styles.circlePoint, {left: 10, top: '10%'}]} />
                
              {/* Traditional Diet Line - Red */}
              <View style={styles.traditionalLine} />
              <View style={styles.traditionalFill} />
                
              {/* MacroBuddy Line - Black */}
              <View style={styles.macroBuddyLine} />
                
              {/* End Point */}
              <View style={[styles.circlePoint, {right: 10, bottom: 24}]} />
                
              {/* Legend */}
              <View style={styles.graphLegend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendIcon, {backgroundColor: '#FFD33D'}]} />
                  <Text style={styles.legendText}>MacroBuddy</Text>
                </View>
                <View style={styles.legendItem}>
                  <Text style={styles.legendText}>Traditional Diet</Text>
                  <View style={[styles.legendIcon, {backgroundColor: '#FF6B6B'}]} />
                </View>
              </View>
                
              {/* X-Axis Labels */}
              <View style={styles.xAxisLabels}>
                <Text style={styles.axisLabel}>Month 1</Text>
                <Text style={styles.axisLabel}>Month 6</Text>
              </View>
            </View>
              
            <Text style={styles.resultsStat}>
                80% of MacroBuddy users maintain their weight loss even 6 months later
            </Text>
          </View>
        </Animated.View>
      );

    case 'measurements':
      return (
        <Animated.View entering={FadeInRight} exiting={FadeOutLeft} style={styles.stepContainer}>
          <Text style={styles.title}>Height & weight</Text>
          <Text style={styles.subtitle}>This will be used to calibrate your custom plan.</Text>

          <View style={styles.unitToggle}>
            <Text style={[styles.unitText, !isMetric && styles.activeUnitText]}>Imperial</Text>
            <Switch
              value={isMetric}
              onValueChange={setIsMetric}
              trackColor={{ false: '#4A4A4A', true: '#FFD33D10' }}
              thumbColor={isMetric ? '#FFD33D' : '#FFFFFF'}
            />
            <Text style={[styles.unitText, isMetric && styles.activeUnitText]}>Metric</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.sliderContainer}>
              <Text style={styles.sliderLabel}>Height</Text>
              <Slider
                style={styles.slider}
                minimumValue={120}
                maximumValue={260}
                step={1}
                thumbTintColor="#FFD33D"
                value={userData.height}
                onValueChange={value => setUserData({ ...userData, height: value })}
                minimumTrackTintColor="#FFFFFF"
                maximumTrackTintColor="#000000"
              />
              <Text style={styles.sliderValue}>
                {isMetric ? `${userData.height} cm` : `${Math.floor(userData.height / 2.54)} in`}
              </Text>
            </View>

            <View style={styles.sliderContainer}>
              <Text style={styles.sliderLabel}>Weight</Text>
              <Slider
                style={styles.slider}
                minimumValue={20}
                maximumValue={300}
                step={1}
                thumbTintColor="#FFD33D"
                value={userData.weight}
                onValueChange={value => setUserData({ ...userData, weight: value })}
                minimumTrackTintColor="#FFFFFF"
                maximumTrackTintColor="#000000"
              />
              <Text style={styles.sliderValue}>
                {isMetric
                  ? `${userData.weight} kg`
                  : `${Math.floor(userData.weight * 2.205)} lbs`}
              </Text>
            </View>
          </View>
        </Animated.View>
      );

    case 'birthdate':
      return (
        <Animated.View entering={FadeInRight} exiting={FadeOutLeft} style={styles.stepContainer}>
          <Text style={styles.title}>When were you born?</Text>
          <Text style={styles.subtitle}>This will be used to calibrate your custom plan.</Text>

          <View style={styles.card}>
            <View style={styles.datePickerContainer}>
              <ScrollView style={styles.datePicker} showsVerticalScrollIndicator={false}>
                {[
                  'January',
                  'February',
                  'March',
                  'April',
                  'May',
                  'June',
                  'July',
                  'August',
                  'September',
                  'October',
                  'November',
                  'December',
                ].map(month => (
                  <TouchableOpacity
                    key={month}
                    style={[
                      styles.datePickerItem,
                      userData.birthdate.includes(month) && styles.selectedDatePickerItem,
                    ]}
                    onPress={() => {
                      const [_, day, year] = userData.birthdate.split(' ');
                      setUserData({
                        ...userData,
                        birthdate: `${month} ${day || ''} ${year || ''}`,
                      });
                    }}>
                    <Text style={styles.datePickerText}>{month}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <ScrollView style={styles.datePicker} showsVerticalScrollIndicator={false}>
                {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                  <TouchableOpacity
                    key={day}
                    style={[
                      styles.datePickerItem,
                      userData.birthdate.includes(` ${day} `) && styles.selectedDatePickerItem,
                    ]}
                    onPress={() => {
                      const [month, _, year] = userData.birthdate.split(' ');
                      setUserData({
                        ...userData,
                        birthdate: `${month || ''} ${day} ${year || ''}`,
                      });
                    }}>
                    <Text style={styles.datePickerText}>{day}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <ScrollView style={styles.datePicker} showsVerticalScrollIndicator={false}>
                {Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i).map(year => (
                  <TouchableOpacity
                    key={year}
                    style={[
                      styles.datePickerItem,
                      userData.birthdate.includes(year.toString()) &&
                          styles.selectedDatePickerItem,
                    ]}
                    onPress={() => {
                      const [month, day] = userData.birthdate.split(' ');
                      setUserData({
                        ...userData,
                        birthdate: `${month || ''} ${day || ''} ${year}`,
                      });
                    }}>
                    <Text style={styles.datePickerText}>{year}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Animated.View>
      );

    case 'obstacles':
      return (
        <Animated.View entering={FadeInRight} exiting={FadeOutLeft} style={styles.stepContainer}>
          <Text style={styles.title}>Whats stopping you from reaching your goals?</Text>
          <Text style={styles.subtitle}>Select all that apply.</Text>

          {[
            { id: 'consistency', label: 'Lack of consistency', icon: 'stats-chart' },
            { id: 'eating', label: 'Unhealthy eating habits', icon: 'fast-food' },
            { id: 'support', label: 'Lack of support', icon: 'people' },
            { id: 'schedule', label: 'Busy schedule', icon: 'calendar' },
            { id: 'inspiration', label: 'Lack of meal inspiration', icon: 'restaurant' },
          ].map(obstacle => (
            <TouchableOpacity
              key={obstacle.id}
              style={[
                styles.card,
                userData.obstacles.includes(obstacle.id) && styles.selectedCard,
              ]}
              onPress={() => {
                const newObstacles = userData.obstacles.includes(obstacle.id)
                  ? userData.obstacles.filter(id => id !== obstacle.id)
                  : [...userData.obstacles, obstacle.id];
                setUserData({ ...userData, obstacles: newObstacles });
              }}>
              <View style={styles.cardContent}>
                <Ionicons
                  name={obstacle.icon as any}
                  size={24}
                  color={
                    userData.obstacles.includes(obstacle.id) ? 'rgba(255,211,61,1.00)' : '#fff'
                  }
                />
                <Text
                  style={[
                    styles.cardText,
                    userData.obstacles.includes(obstacle.id) && styles.selectedCardText,
                  ]}>
                  {obstacle.label}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </Animated.View>
      );

    case 'notifications':
      return (
        <Animated.View entering={FadeInRight} exiting={FadeOutLeft} style={styles.stepContainer}>
          <View style={styles.notificationsContainer}>
            <Text style={styles.title}>Reach your goals with notifications</Text>
            <Text style={styles.subtitle}>MacroBuddy would like to send you notifications</Text>
              
            <View style={styles.notificationCard}>
              <Text style={styles.notificationCardTitle}>MacroBuddy would like to send you notifications</Text>
                
              <View style={styles.notificationButtonsContainer}>
                <TouchableOpacity 
                  style={styles.notificationButton}
                  onPress={handleNext}
                >
                  <Text style={styles.notificationButtonText}>Dont Allow</Text>
                </TouchableOpacity>
                  
                <TouchableOpacity 
                  style={[styles.notificationButton, styles.notificationAllowButton]}
                  onPress={handleNext}
                >
                  <Text style={styles.notificationAllowButtonText}>Allow</Text>
                </TouchableOpacity>
              </View>
            </View>
              
            <View style={styles.pointingFingerContainer}>
              <Text style={styles.pointingFinger}>👆</Text>
            </View>
          </View>
        </Animated.View>
      );

    case 'create-account':
      return (
        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>Create your account</Text>
          <Text style={styles.stepDescription}>Enter your details to get started</Text>
            
          <View style={styles.inputContainer}>
            <Input
              label="First Name"
              placeholder="Enter your first name"
              value={userData.firstName || ''}
              onChangeText={(text: string) => setUserData({...userData, firstName: text})}
            />
          </View>

          <View style={styles.inputContainer}>
            <Input
              label="Last Name"
              placeholder="Enter your last name"
              value={userData.lastName || ''}
              onChangeText={(text: string) => setUserData({...userData, lastName: text})}
            />
          </View>

          <View style={styles.inputContainer}>
            <Input
              label="Email"
              placeholder="Enter your email"
              value={userData.email || ''}
              onChangeText={(text: string) => setUserData({...userData, email: text})}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            {/* <PasswordInput
              label="Password"
              placeholder="Enter your password"
              value={userData.password || ''}
              onChangeText={(text: string) => setUserData({...userData, password: text})}
            /> */}
          </View>

          <View style={styles.buttonContainer}>
            <AButton title="Back" onPress={handleBack} />
            <AButton title="Create Account" onPress={handleRegister} />
          </View>
        </View>
      );

    default:
      return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Progress bar */}
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${progress}%` }]} />
        </View>

        {/* Back button */}
        {currentStep !== 'gender' && (
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={12} color="rgba(255,211,61,1.00)" />
          </TouchableOpacity>
        )}

        {/* Main content */}
        {renderStep()}
      </ScrollView>

      {currentStep !== 'create-account' && currentStep !== 'notifications' ? (
        <AButton
          customStyles={{ button: styles.nextButton }}
          title={'Continue'}
          disabled={
            (currentStep === 'gender' && !userData.gender) ||
            (currentStep === 'activity' && !userData.workoutsPerWeek) ||
            (currentStep === 'goals' && !userData.goals) ||
            (currentStep === 'birthdate' && !userData.birthdate.includes(' '))
          }
          onPress={handleNext}>
          <Ionicons name="arrow-forward" size={18} color="rgba(255,211,61,1.00)" />
        </AButton>
      ) : (
        ''
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(37, 41, 46, 1.00)',
  },
  scrollView: {
    flex: 1,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: 'rgba(58,63,71,1.00)',
    marginBottom: 24,
    marginHorizontal: 20,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 3,
  },
  stepContainer: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 24,
  },
  card: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: 'rgba(45, 50, 55, 0.5)',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  selectedCard: {
    backgroundColor: 'rgba(58,63,71,1.00)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 12,
  },
  selectedCardText: {
    color: 'rgba(255,211,61,1.00)',
  },
  cardSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 4,
  },
  backButton: {
    padding: 16,
    borderRadius: 40,
    backgroundColor: 'rgba(45, 50, 55, 0.5)',
    alignSelf: 'flex-start',
    marginBottom: 20,
    marginLeft: 20,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    margin: 20,
    marginBottom: 30,
  },
  nextButtonText: {
    color: 'rgba(37, 41, 46, 1.00)',
    fontSize: 17,
    fontWeight: 'bold',
    marginRight: 8,
  },
  unitToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    backgroundColor: 'rgba(45, 50, 55, 0.5)',
    padding: 8,
    borderRadius: 12,
  },
  unitText: {
    marginHorizontal: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 15,
    fontWeight: '500',
  },
  activeUnitText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  sliderContainer: {
    marginBottom: 24,
  },
  sliderLabel: {
    fontSize: 17,
    marginBottom: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderValue: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 8,
  },
  datePickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  datePicker: {
    flex: 1,
    height: 200,
    marginHorizontal: 4,
  },
  datePickerItem: {
    padding: 15,
    alignItems: 'center',
    height: 52,
    justifyContent: 'center',
  },
  selectedDatePickerItem: {
    backgroundColor: 'rgba(58,63,71,1.00)',
    borderRadius: 8,
  },
  datePickerText: {
    fontSize: 17,
    color: '#FFFFFF',
  },
  signIn: {
    display: 'flex',
  },
  formContainer: {
    width: '100%',
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: 'rgba(45, 50, 55, 0.8)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    height: 50,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  textInput: {
    color: '#FFFFFF',
    fontSize: 16,
    height: '100%',
    width: '100%',
  },
  signUpButton: {
    backgroundColor: '#FFD33D',
    marginTop: 24,
    marginBottom: 0,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  dividerText: {
    color: 'rgba(255, 255, 255, 0.6)',
    paddingHorizontal: 16,
    fontSize: 14,
  },
  graphContainer: {
    backgroundColor: 'rgba(45, 50, 55, 0.8)',
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  graphHeader: {
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  weightLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  graph: {
    height: 180,
    position: 'relative',
    marginVertical: 20,
    marginBottom: 30,
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    top: '25%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  traditionalLine: {
    position: 'absolute',
    top: '30%',
    left: 10,
    right: 0,
    height: 2,
    backgroundColor: '#FF6B6B',
    borderRadius: 10,
  },
  traditionalFill: {
    position: 'absolute',
    right: 0,
    top: '30%',
    width: '60%',
    height: '40%',
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    borderTopLeftRadius: 100,
  },
  macroBuddyLine: {
    position: 'absolute',
    top: '30%',
    left: 10,
    right: 10,
    height: 3,
    backgroundColor: '#FFD33D',
    borderRadius: 10,
    transform: [{scaleY: 1}, {rotateZ: '-12deg'}],
  },
  circlePoint: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(170, 170, 170, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(119, 119, 119, 0.5)',
    position: 'absolute',
  },
  graphLegend: {
    position: 'absolute',
    bottom: -10,
    left: 0,
    right: 0,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  legendIcon: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
    marginLeft: 8,
  },
  legendText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  xAxisLabels: {
    position: 'absolute',
    bottom: -55,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  axisLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  resultsStat: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 36,
  },
  headerWithLogo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleContainer: {
    marginBottom: 8,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  notificationsContainer: {
    flex: 1,
    alignItems: 'center',
  },
  notificationImageContainer: {
    marginVertical: 40,
    alignItems: 'center',
  },
  notificationIcon: {
    marginBottom: 20,
  },
  pointingFingerContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginLeft: '50%',
  },
  pointingFinger: {
    fontSize: 30,
  },
  notificationCard: {
    backgroundColor: 'rgba(200, 200, 200, 0.95)',
    borderRadius: 16,
    width: '100%',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  notificationCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
    marginBottom: 20,
  },
  notificationButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  notificationButton: {
    flex: 1,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 5,
  },
  notificationAllowButton: {
    backgroundColor: '#25292e',
  },
  notificationButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#25292e',
  },
  notificationAllowButtonText: {
    color: '#FFFFFF',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 10,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 24,
  },
});
