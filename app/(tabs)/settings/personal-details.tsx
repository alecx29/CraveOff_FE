import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, SafeAreaView, StatusBar } from 'react-native';

import AButton from '@/src/components/AButton/AButton';
import { useTheme } from '@/src/context/ThemeProvider';
import { useUser } from '@/src/context/UserContext';
import GradientBackground from '@/src/screen-components/gradient-background/GradientBackground';

export default function PersonalDetailsScreen() {
  const navigation = useNavigation();
  const { user } = useUser();
  const { theme } = useTheme();

  const styles = createStyles(theme);

  // Helper function for safe color access
  const getIconColor = (): string => {
    if ('icon' in theme.colors) return theme.colors.icon as string;
    return theme.colors.textSecondary as string || '#6B7280';
  };

  const getIconBackButtonColor = (): string => {
    if ('iconBackButton' in theme.colors) return theme.colors.iconBackButton as string;
    return theme.colors.textPrimary as string || '#FFFFFF';
  };

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
            <Feather name="arrow-left" size={theme.sizes.iconLarge} color={getIconBackButtonColor()} />
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
            <AButton title="Change Goal" onPress={() => {
              // This route no longer exists
              // router.push('/settings/edit-weight-goal' as any);
            }} />
          </View>
        
          {/* Details Card */}
          <View style={styles.detailsCard}>
            {/* Current Weight */}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Current weight</Text>
              <View style={styles.valueContainer}>
                <Text style={styles.detailValue}>{user?.weight ?? '--'} kg</Text>
                <TouchableOpacity onPress={() => {
                  // This route no longer exists
                  // router.push('/settings/edit-current-weight' as any)
                }}>
                  <Feather name="edit-2" size={theme.sizes.iconMedium} color={getIconColor()} />
                </TouchableOpacity>
              </View>
            </View>
          
            <View style={styles.separator} />
          
            {/* Height */}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Height</Text>
              <View style={styles.valueContainer}>
                <Text style={styles.detailValue}>{user?.height ?? '--'} cm</Text>
                <TouchableOpacity onPress={() => {
                  // This route no longer exists
                  // router.push('/settings/edit-height' as any)
                }}>
                  <Feather name="edit-2" size={theme.sizes.iconMedium} color={getIconColor()} />
                </TouchableOpacity>
              </View>
            </View>
          
            <View style={styles.separator} />
          
            {/* Date of birth */}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Date of birth</Text>
              <View style={styles.valueContainer}>
                <Text style={styles.detailValue}>{user?.birthdate ?? '--'}</Text>
                <TouchableOpacity onPress={() => {
                  // This route no longer exists
                  // router.push('/settings/edit-birthdate' as any)
                }}>
                  <Feather name="edit-2" size={theme.sizes.iconMedium} color={getIconColor()} />
                </TouchableOpacity>
              </View>
            </View>
          
            <View style={styles.separator} />
          
            {/* Gender */}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Gender</Text>
              <View style={styles.valueContainer}>
                <Text style={styles.detailValue}>{user?.gender ?? '--'}</Text>
                <TouchableOpacity onPress={() => {
                  // This route no longer exists
                  // router.push('/settings/edit-gender' as any)
                }}>
                  <Feather name="edit-2" size={theme.sizes.iconMedium} color={getIconColor()} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.circle,
    backgroundColor: theme.colors.backButton,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: theme.typography.heading3,
    fontWeight: theme.typography.weightBold,
    color: theme.colors.textPrimary,
    textAlign: 'center',
    flex: 1,
    marginRight: 40, // To offset the back button and center the title
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
  },
  goalCard: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.large,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalInfo: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: theme.typography.body,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  fieldValue: {
    fontSize: theme.typography.heading2,
    fontWeight: theme.typography.weightBold,
    color: theme.colors.textPrimary,
  },
  detailsCard: {
    borderRadius: theme.borderRadius.large,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.cardBackground,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.md - 1,
  },
  detailLabel: {
    fontSize: theme.typography.body,
    color: theme.colors.textPrimary,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailValue: {
    fontSize: theme.typography.body,
    fontWeight: theme.typography.weightBold,
    color: theme.colors.textPrimary,
    marginRight: theme.spacing.md - 1,
  },
  separator: {
    height: 1,
    backgroundColor: theme.colors.separator,
  },
});