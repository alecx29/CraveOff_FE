import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, Text, TouchableOpacity, Dimensions, Platform, PanResponder, GestureResponderEvent } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LottieUniversal from '@/src/components/LottieUniversal';
import Svg, { Path } from 'react-native-svg';
import Animated, { ZoomIn } from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

export default function ConquerCommitment() {
  const insets = useSafeAreaInsets();
  const styles = createStyles(insets);
  const [paths, setPaths] = React.useState<string[]>([]);
  const [currentPath, setCurrentPath] = React.useState<string>('');

  const startStroke = (evt: GestureResponderEvent) => {
    const { locationX, locationY } = evt.nativeEvent;
    setCurrentPath(`M ${locationX} ${locationY}`);
  };

  const extendStroke = (evt: GestureResponderEvent) => {
    const { locationX, locationY } = evt.nativeEvent;
    setCurrentPath((prev) => `${prev} L ${locationX} ${locationY}`);
  };

  const endStroke = () => {
    if (!currentPath) return;
    setPaths((prev) => [...prev, currentPath]);
    setCurrentPath('');
  };

  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: startStroke,
      onPanResponderMove: extendStroke,
      onPanResponderRelease: endStroke,
      onPanResponderTerminate: endStroke,
    })
  ).current;

  const handleClear = () => {
    setPaths([]);
    setCurrentPath('');
  };

  const handleFinish = () => {
    router.push('/conquer/planBuilt');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Background Animation - full screen */}
      <View style={styles.backgroundContainer}>
        <LottieUniversal
          source={require('@/assets/images/Animation_SkyStar.json')}
          autoPlay
          loop
          style={styles.backgroundAnimation}
          resizeMode="cover"
        />
      </View>

      {/* Back button */}
      <View style={styles.backButtonContainer}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={22} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Content Container (no scroll) */}
      <View style={styles.contentWrapper}>
        <View style={styles.mainContainer}>
          <View style={styles.contentContainer}>
            <Text style={[styles.title, { color: '#ffffff' }]}>Sign your commitment.</Text>
            <Text style={[styles.subtitle, { color: '#ffffff' }]}>Finally, promise yourself that you will never watch porn again.</Text>

            <View style={styles.signatureWrapper}>
              <Animated.View entering={ZoomIn.duration(450).springify()}>
                <View style={styles.signatureBox} {...panResponder.panHandlers}>
                  <Svg width="100%" height="100%">
                    {paths.map((d, idx) => (
                      <Path
                        key={idx}
                        d={d}
                        stroke="#111827"
                        strokeWidth={3}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                      />
                    ))}
                    {currentPath ? (
                      <Path
                        d={currentPath}
                        stroke="#111827"
                        strokeWidth={3}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                      />
                    ) : null}
                  </Svg>
                </View>
              </Animated.View>
              <TouchableOpacity onPress={handleClear} activeOpacity={0.7} style={styles.clearButton}>
                <Text style={styles.clearText}>Clear</Text>
              </TouchableOpacity>
              <Text style={styles.hintText}>Draw on the open space above</Text>
            </View>
          </View>

          {/* Bottom CTA */}
          <View style={styles.bottomContainer}>
            <TouchableOpacity 
              style={styles.finishButton}
              onPress={handleFinish}
              activeOpacity={0.8}
            >
              <Text style={styles.finishButtonText}>Finish</Text>
              {/* <Ionicons name="checkmark" size={20} color="#000" /> */}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const createStyles = (insets: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Platform.OS === 'ios' ? 'transparent' : '#0B0A10',
  },
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
    backgroundColor: Platform.OS === 'ios' ? 'transparent' : '#0B0A10',
    overflow: 'hidden',
  },
  backgroundAnimation: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  contentWrapper: {
    flex: 1,
    zIndex: 1,
  },
  backButtonContainer: {
    position: 'absolute',
    top: insets.top + 8,
    left: 12,
    zIndex: 3,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)'
  },
  mainContainer: {
    flex: 1,
    position: 'relative',
    zIndex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: height * 0.15,
  },
  contentContainer: {
    paddingHorizontal: width * 0.06,
    paddingTop: insets.top + 56,
    paddingBottom: height * 0.06,
    alignItems: 'center',
    justifyContent: 'flex-start',
    minHeight: height * 0.6,
    gap: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    width: '100%',
    marginTop: 8,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 24,
    width: '90%',
    marginTop: 6,
    marginBottom: 14,
  },
  signatureWrapper: {
    width: Math.min(width * 0.88, 480),
    alignItems: 'flex-start',
    paddingTop: 40
  },
  signatureBox: {
    width: Math.min(width * 0.88, 480),
    height: Math.min(height * 0.3, 260),
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    overflow: 'hidden',
  },
  clearButton: {
    marginTop: 10,
    paddingVertical: 6,
    paddingHorizontal: 4,
    alignSelf: 'flex-start',
  },
  clearText: {
    color: '#9ca3af',
    fontSize: 14,
    // no underline per spec
  },
  hintText: {
    color: '#9ca3af',
    fontSize: 13,
    marginTop: 6,
    alignSelf: 'center',
    textAlign: 'center',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: height * 0.06 + insets.bottom,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1,
  },
  finishButton: {
    backgroundColor: '#ffffff',
    borderRadius: 30,
    height: Math.min(52, height * 0.07),
    paddingHorizontal: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: Math.min(150, width * 0.4),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  finishButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
});


