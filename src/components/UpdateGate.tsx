import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Platform, Pressable, Linking } from 'react-native';
import Constants from 'expo-constants';
import * as Updates from 'expo-updates';
import { usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { evaluateUpdateStatus, fetchRemoteUpdateConfig, getCurrentBuildNumber, getStoreLinks } from '@/src/services/updateService';
import LottieUniversal from '@/src/components/LottieUniversal';

type PromptKind = 'forced' | 'optional';
type DecisionAction = 'update' | 'later';

type GateState =
  | { kind: 'idle' }
  | { kind: 'forced'; message?: string }
  | { kind: 'optional'; message?: string };

type UpdateGateProps = {
  isSplashVisible?: boolean;
  onPromptShown?: (kind: PromptKind) => void;
  onDecision?: (kind: PromptKind, action: DecisionAction) => void;
};

const UpdateGate: React.FC<UpdateGateProps> = ({ isSplashVisible, onPromptShown, onDecision }) => {
  const [state, setState] = useState<GateState>({ kind: 'idle' });
  const [dismissedOptional, setDismissedOptional] = useState(false);
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const signaledRef = useRef<PromptKind | null>(null);

  const storeLinks = useMemo(() => getStoreLinks(), []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const extra =
          ((Constants as any)?.expoConfig?.extra as any) ||
          ((Updates as any)?.manifest?.extra as any) ||
          {};
        const enableInDev = extra?.enableUpdateGateInDev === true;
        if (__DEV__ && !enableInDev) return;
        const currentBuild = await getCurrentBuildNumber();
        const config = await fetchRemoteUpdateConfig();
        if (!mounted || !config) return;
        const status = evaluateUpdateStatus(Platform.OS === 'ios' ? 'ios' : 'android', currentBuild, config);
        if (status.requiresForce) {
          setState({ kind: 'forced', message: status.messageMandatory });
        } else if (status.updateAvailable) {
          setState({ kind: 'optional', message: status.messageOptional });
        }
      } catch {
        // ignore any errors; gate is best-effort
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Notify parent when a prompt is shown (only once per prompt type)
  useEffect(() => {
    if (state.kind === 'forced' || state.kind === 'optional') {
      if (signaledRef.current !== state.kind) {
        signaledRef.current = state.kind;
        onPromptShown?.(state.kind);
      }
    } else {
      signaledRef.current = null;
    }
  }, [state.kind, onPromptShown]);

  const openStore = async () => {
    const isAndroid = Platform.OS === 'android';
    const primary = isAndroid ? storeLinks.android : storeLinks.ios;
    const fallback = isAndroid
      ? (() => {
          const pkg = storeLinks.android?.split('=')[1];
          return pkg ? `https://play.google.com/store/apps/details?id=${pkg}` : undefined;
        })()
      : (() => {
          const id = storeLinks.ios?.split('id')[1];
          return id ? `https://apps.apple.com/app/id${id}` : undefined;
        })();

    if (primary && (await Linking.canOpenURL(primary))) {
      await Linking.openURL(primary);
      return;
    }
    if (fallback) {
      try {
        await Linking.openURL(fallback);
      } catch {}
    }
  };

  if (state.kind === 'idle') return null;
  if (state.kind === 'forced') {
    return (
      <View style={styles.overlay}>
        <LottieUniversal
          source={require('@/assets/images/Confetti.json')}
          autoPlay
          loop
          style={styles.confetti}
        />
        <View style={styles.modal}>
          <Text style={styles.title}>Update required</Text>
          <Text style={styles.message}>
            {state.message || 'This version of the app is no longer compatible. Please update to continue.'}
          </Text>
          <Pressable
            style={styles.primaryBtn}
            onPress={async () => {
              onDecision?.('forced', 'update');
              await openStore();
            }}
          >
            <Text style={styles.primaryBtnText}>Update now</Text>
          </Pressable>
        </View>
      </View>
    );
  }
  if (state.kind === 'optional') {
    // During splash, require a decision via modal
    if (isSplashVisible && !dismissedOptional) {
      return (
        <View style={styles.overlay}>
          <LottieUniversal
            source={require('@/assets/images/Confetti.json')}
            autoPlay
            loop
            style={styles.confetti}
          />
          <View style={styles.modal}>
            <Text style={styles.title}>Update available</Text>
            <Text style={styles.message}>
              {state.message || 'A new version is available.'}
            </Text>
            <View style={styles.buttonRow}>
              <Pressable
                style={[styles.primaryBtn, styles.primaryBtnWide, { backgroundColor: '#374151' }]}
                onPress={() => {
                  setDismissedOptional(true);
                  onDecision?.('optional', 'later');
                  setState({ kind: 'idle' });
                }}
              >
                <Text style={styles.primaryBtnText}>Later</Text>
              </Pressable>
              <Pressable
                style={[styles.primaryBtn, styles.primaryBtnWide]}
                onPress={async () => {
                  onDecision?.('optional', 'update');
                  await openStore();
                  setState({ kind: 'idle' });
                }}
              >
                <Text style={styles.primaryBtnText}>Update</Text>
              </Pressable>
            </View>
          </View>
        </View>
      );
    }
    // After splash, show a non-blocking banner only on home
    if (!dismissedOptional) {
      const isHomePage = pathname === '/' || pathname === '/index';
      if (!isHomePage) return null;
      return (
        <View style={[styles.banner, { bottom: Math.max(12, insets.bottom + 12) }]}>
          <Text style={styles.bannerText}>
            {state.message || 'A new version is available.'}
          </Text>
          <View style={styles.bannerActions}>
            <Pressable style={styles.bannerLater} onPress={() => {
              setDismissedOptional(true);
              onDecision?.('optional', 'later');
            }}>
              <Text style={styles.bannerLaterText}>Later</Text>
            </Pressable>
            <Pressable style={styles.bannerUpdate} onPress={async () => {
              onDecision?.('optional', 'update');
              await openStore();
            }}>
              <Text style={styles.bannerUpdateText}>Update</Text>
            </Pressable>
          </View>
        </View>
      );
    }
    return null;
  }
  return null;
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10000,
  },
  confetti: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.65,
    pointerEvents: 'none' as any,
  },
  modal: {
    width: '86%',
    backgroundColor: '#111827',
    borderRadius: 14,
    padding: 20,
    borderColor: '#374151',
    borderWidth: 1,
  },
  title: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  message: {
    color: '#D1D5DB',
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  primaryBtn: {
    backgroundColor: '#6366F1',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  primaryBtnWide: {
    flex: 1,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryBtnText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  banner: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    backgroundColor: '#111827',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderColor: '#374151',
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  bannerText: {
    color: 'white',
    flex: 1,
    fontSize: 13,
  },
  bannerActions: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 12,
  },
  bannerLater: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#374151',
  },
  bannerLaterText: {
    color: '#E5E7EB',
    fontSize: 13,
    fontWeight: '500',
  },
  bannerUpdate: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 9999,
    backgroundColor: '#6366F1',
  },
  bannerUpdateText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
  },
});

export default UpdateGate;


