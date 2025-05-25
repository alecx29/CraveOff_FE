import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { router } from 'expo-router';
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, SafeAreaView, StatusBar } from 'react-native';

import AButton from '@/src/components/AButton/AButton';
import { useUser } from '@/src/context/UserContext';
import GradientBackground from '@/src/screen-components/gradient-background/GradientBackground';

export default function PersonalDetailsScreen() {
  const navigation = useNavigation();
  const { user } = useUser();

  return (
    <GradientBackground>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
      
        {/* Header with back button */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Feather name="arrow-left" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Personal Details</Text>
        </View>

        <ScrollView style={styles.scrollView}>
          {/* Goal Weight Card */}
          <View style={styles.goalCard}>
            <View style={styles.goalInfo}>
              <Text style={styles.fieldLabel}>Goal Weight</Text>
              <Text style={styles.fieldValue}>{user?.goalWeight ?? '--'} kg</Text>
            </View>
            <AButton title="Change Goal" onPress={() => {router.push('/settings/edit-weight-goal');}} />
          </View>
        
          {/* Details Card */}
          <View style={styles.detailsCard}>
            {/* Current Weight */}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Current weight</Text>
              <View style={styles.valueContainer}>
                <Text style={styles.detailValue}>{user?.weight ?? '--'} kg</Text>
                <TouchableOpacity onPress={() => router.push('/settings/edit-current-weight')}>
                  <Feather name="edit-2" size={20} color="#888" />
                </TouchableOpacity>
              </View>
            </View>
          
            <View style={styles.separator} />
          
            {/* Height */}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Height</Text>
              <View style={styles.valueContainer}>
                <Text style={styles.detailValue}>{user?.height ?? '--'} cm</Text>
                <TouchableOpacity onPress={() => router.push('/settings/edit-height')}>
                  <Feather name="edit-2" size={20} color="#888" />
                </TouchableOpacity>
              </View>
            </View>
          
            <View style={styles.separator} />
          
            {/* Date of birth */}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Date of birth</Text>
              <View style={styles.valueContainer}>
                <Text style={styles.detailValue}>{user?.birthdate ?? '--'}</Text>
                <TouchableOpacity onPress={() => router.push('/settings/edit-birthdate')}>
                  <Feather name="edit-2" size={20} color="#888" />
                </TouchableOpacity>
              </View>
            </View>
          
            <View style={styles.separator} />
          
            {/* Gender */}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Gender</Text>
              <View style={styles.valueContainer}>
                <Text style={styles.detailValue}>{user?.gender ?? '--'}</Text>
                <TouchableOpacity onPress={() => router.push('/settings/edit-gender')}>
                  <Feather name="edit-2" size={20} color="#888" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: '#121212', // Dark background matching other screens
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    flex: 1,
    marginRight: 40, // To offset the back button and center the title
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  goalCard: {
    // backgroundColor: '#1E1E1E',
    backgroundColor: 'rgba(58,63,71,1.00)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalInfo: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 5,
  },
  fieldValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  changeGoalButton: {
    backgroundColor: '#000000',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
  },
  changeGoalText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  detailsCard: {
    // backgroundColor: '#1E1E1E',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    backgroundColor: 'rgba(58,63,71,1.00)'
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
  },
  detailLabel: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginRight: 15,
  },
  separator: {
    height: 1,
    backgroundColor: '#333333',
  },
});