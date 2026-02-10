import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, StatusBar, Modal, ImageBackground } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { useTheme } from '@/src/context/ThemeProvider';

interface RelapsePreventionModalProps {
  visible: boolean;
  onClose: () => void;
}

const RelapsePreventionModal = ({ visible, onClose }: RelapsePreventionModalProps) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, 20);

  const styles = createStyles(theme, topPadding);

  return (
    <Modal
      transparent
      visible={visible}
      onRequestClose={onClose}
      animationType="none"
      hardwareAccelerated
      statusBarTranslucent
    >
      <Animated.View style={styles.container} entering={FadeIn.duration(250)} exiting={FadeOut.duration(200)}>
        <StatusBar barStyle="light-content" translucent backgroundColor="#0b0f18" />

        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <View style={styles.headerSpacer} />
            <Image source={require('@/assets/images/logo.png')} style={styles.logo} resizeMode="contain" />
            <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.7}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <Text style={styles.title}>Relapse Prevention</Text>
            <Text style={styles.subtitle}>Defeat the urge with these cognitive exercices</Text>

            <View style={styles.gamesGrid}>
              <View style={styles.gameCardOuter}>
                <TouchableOpacity
                  activeOpacity={0.88}
                  style={styles.gameCardInner}
                  onPress={() => {
                    onClose();
                    setTimeout(() => router.push('/relapse-prevention/stroop-test'), 0);
                  }}
                >
                  <ImageBackground
                    source={require('@/assets/images/stroop-img.webp')}
                    style={styles.gameImage}
                    imageStyle={styles.gameImageInner}
                    resizeMode="cover"
                  >
                    <View style={styles.gameImageShade} />
                    <View style={styles.gameTitleRow}>
                      <Text style={styles.gameTitle}>Stroop Game</Text>
                    </View>
                  </ImageBackground>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
};

const createStyles = (theme: any, topPadding: number) =>
  StyleSheet.create({
    container: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: '#0b0f18',
    },
    modalContainer: {
      width: '100%',
      height: '100%',
      backgroundColor: '#0b0f18',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingTop: topPadding + 10,
      paddingBottom: 8,
    },
    headerSpacer: {
      width: 40,
      height: 40,
    },
    logo: {
      width: 120,
      height: 40,
    },
    closeButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    content: {
      paddingHorizontal: 24,
      paddingTop: 18,
      alignItems: 'center',
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: '#ffffff',
      textAlign: 'center',
    },
    subtitle: {
      marginTop: 10,
      fontSize: 14,
      color: 'rgba(255, 255, 255, 0.7)',
      textAlign: 'center',
      lineHeight: 20,
    },
    gamesGrid: {
      width: '100%',
      marginTop: 26,
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    gameCardOuter: {
      width: '48%',
      aspectRatio: 1,
      borderRadius: 20,
      backgroundColor: 'rgba(30, 50, 80, 0.35)',
      shadowColor: '#22c55e',
      shadowOpacity: 0.35,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 6 },
      elevation: 4,
    },
    gameCardInner: {
      flex: 1,
      borderRadius: 20,
      overflow: 'hidden',
      backgroundColor: 'transparent',
    },
    gameImage: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    gameImageInner: {
      borderRadius: 20,
    },
    gameImageShade: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.25)',
    },
    gameTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 14,
    },
    gameTitle: {
      color: '#ffffff',
      fontSize: 14,
      fontWeight: '600',
    },
  });

export default RelapsePreventionModal;
