import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Switch, Alert, Platform, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '@/src/context/ThemeProvider';
import { CraveOffProtection } from '@/src/native/CraveOffProtection';
import { DEFAULT_BLOCKLIST } from '@/src/config/blocklist-default';
import GradientBackground from '@/src/screen-components/gradient-background/GradientBackground';
import LottieUniversal from '@/src/components/LottieUniversal';

const IOS_MAX_WEBSITES = 20;

export default function ContentBlockerScreen() {
	const { theme } = useTheme();
	const insets = useSafeAreaInsets();
	const styles = useMemo(() => createStyles(theme), [theme]);
	const [enabled, setEnabled] = useState(false);
	const [busy, setBusy] = useState(false);
	const [, setMode] = useState<'full-tunnel' | 'dns-only' | undefined>();
	const [blockedCount, setBlockedCount] = useState<number>(0);

	useEffect(() => {
		let sub: any;
		const init = async () => {
			try {
				const s = await CraveOffProtection.status();
				setEnabled(!!s.running);
				setMode(s.mode);
				setBlockedCount(Number.isFinite(s.blocklistSize) ? s.blocklistSize : 0);
			} catch {}
		};
		init();
		sub = CraveOffProtection.addListener?.((evt: { type: string }) => {
			if (evt?.type === 'PROTECTION_OFF') {
				setEnabled(false);
			}
		});
		return () => {
			sub?.remove?.();
		};
	}, []);

	const onToggle = async (value: boolean) => {
		if (busy) return;
		setBusy(true);
		try {
			if (value) {
				if (Platform.OS === 'ios') {
					// iOS: Check FamilyControls authorization, request only if needed
					let authStatus: 'approved' | 'denied' | 'notDetermined' | 'unknown' | 'unavailable' = 'unknown';
					try {
						// @ts-ignore - available on iOS via our native bridge
						authStatus = await CraveOffProtection.authorizationStatus?.();
					} catch {}
					if (__DEV__) {
						console.log('CraveOffProtection iOS authorizationStatus BEFORE request:', authStatus);
					}
					if (authStatus === 'denied') {
						setEnabled(false);
						setMode(undefined);
						Alert.alert(
							'Permission required',
							"Family Controls are denied. To enable: Settings > Screen Time must be ON. Then try the toggle again.",
							[{ text: 'OK' }]
						);
						return;
					}
					// Ask for authorization when notDetermined/unknown
					try {
						await CraveOffProtection.enable();
						// Log status after enabling
						try {
							// @ts-ignore - available on iOS via our native bridge
							const after = await CraveOffProtection.authorizationStatus?.();
							if (__DEV__) {
								console.log('CraveOffProtection iOS authorizationStatus AFTER request:', after);
							}
						} catch {}
					} catch (e: any) {
						console.error('CraveOffProtection.enable() failed:', e);
						setEnabled(false);
						setMode(undefined);
						Alert.alert(
							'Permission required',
							e?.message || 'CraveOff needs Family Controls authorization to filter web content on iOS. Ensure Settings > Screen Time is ON, then try again.',
							[
								{ text: 'Cancel', style: 'cancel' },
								{ text: 'Open Settings', onPress: () => Linking.openSettings?.() },
							]
						);
						return;
					}
					// After authorization, force user to select websites to block (max 20).
					// If user cancels, toggle must go back OFF.
					try {
						const result = await CraveOffProtection.configureWebsites(IOS_MAX_WEBSITES);
						if (result?.cancelled) {
							setEnabled(false);
							setMode(undefined);
							return;
						}
						if (result?.trimmed) {
							Alert.alert(
								'Selection limit',
								`You can select up to ${IOS_MAX_WEBSITES} websites. Only the first ${IOS_MAX_WEBSITES} were saved.`
							);
						}
						if (typeof result?.selectedCount === 'number') {
							setBlockedCount(result.selectedCount);
						}
						setEnabled(true);
					} catch (e: any) {
						// Empty selection or other error
						setEnabled(false);
						setMode(undefined);
						Alert.alert('Setup required', e?.message || 'Please select at least one website to block.');
						return;
					}
				} else {
					// Android: keep original order (apply list then enable)
					try { await CraveOffProtection.applyBlocklist(DEFAULT_BLOCKLIST); } catch {}
					// Optimistic UI: show enabled while the service spins up
					setEnabled(true);
					await CraveOffProtection.enable();
				}
				// Poll status briefly to avoid instant flip-back
				let s = await CraveOffProtection.status();
				let attempts = 0;
				while (!s.running && attempts < 8) {
					await new Promise(r => setTimeout(r, 250));
					s = await CraveOffProtection.status();
					attempts++;
				}
				if (!s.running) {
					setEnabled(false);
					setMode(undefined);
					Alert.alert('Could not start protection', 'Please try again.');
				} else {
					setEnabled(true);
					setMode(s.mode);
				}
			} else {
				await CraveOffProtection.disable();
				setEnabled(false);
				setMode(undefined);
			}
		} catch (e: any) {
			const message = e?.message || String(e);
			Alert.alert('Error', message);
		} finally {
			setBusy(false);
		}
	};

	// const runDebug = async () => {
	// 	if (!__DEV__) return;
	// 	try {
	// 		const [r1, r2, r3] = await Promise.all([
	// 			CraveOffProtection.testResolve('pornhub.com'),
	// 			CraveOffProtection.testResolve('www.pornhub.com'),
	// 			CraveOffProtection.testResolve('google.com'),
	// 		]);
	// 		const payload = { r1, r2, r3 };
	// 		console.log('CraveOffProtection testResolve', payload);
	// 		Alert.alert('DNS debug', JSON.stringify(payload, null, 2));
	// 	} catch (e: any) {
	// 		console.log('CraveOffProtection testResolve error', e);
	// 		Alert.alert('DNS debug error', e?.message || String(e));
	// 	}
	// };

	const topPadding = Platform.OS === 'ios'
		? Math.max(insets.top - 8, 0)
		: Math.max(insets.top, 6);

	return (
		<GradientBackground>
			<SafeAreaView style={[styles.container, { paddingTop: topPadding }]}>
				<View style={styles.header}>
					<TouchableOpacity
						onPress={() => router.back()}
						style={styles.backButton}
						hitSlop={{ top: 8, left: 8, right: 8, bottom: 8 }}
					>
						<Ionicons name="chevron-back" size={20} color={theme.colors.textPrimary} />
						<Text style={styles.backButtonText}>Back</Text>
					</TouchableOpacity>
					<View style={{ width: 24 }} />
				</View>

				<View style={styles.hero}>
					<LottieUniversal
						source={require('@/assets/images/Medieval lock.json')}
						autoPlay
						loop
						style={styles.lottieLock}
					/>
					<Text style={styles.heroTitle}>Content Blocker</Text>
					<Text style={styles.heroSubtitle}>
					{Platform.OS === 'ios'
						? 'CraveOff uses Screen Time (Family Controls) to block apps and NSFW websites you choose on iOS.'
						: 'CraveOff uses a local on-device VPN to filter adult (18+) websites and enforce SafeSearch. No traffic is sent to external VPN servers.'}
					</Text>
				</View>

				<View style={styles.card}>
					<View style={styles.row}>
						<Text style={styles.title}>Enable Content Restrictions</Text>
						<Switch
							value={enabled}
							onValueChange={onToggle}
							trackColor={{ false: theme.colors.inputBorder, true: theme.colors.primary }}
							thumbColor={'#fff'}
							disabled={busy}
						/>
					</View>
					{enabled && (
						<Text style={styles.activeLabel}>
							Active 🛡️
						</Text>
					)}
				</View>

				{Platform.OS === 'ios' && (
					<TouchableOpacity
						activeOpacity={0.85}
						style={styles.appBlockerCard}
						onPress={() => Alert.alert('Coming soon', 'App Blocker is coming soon.')}
					>
						<View style={styles.appBlockerRow}>
							<View style={styles.appBlockerLeft}>
								<Text style={styles.appBlockerTitle}>App Blocker</Text>
								<Text style={styles.appBlockerCount}>{blockedCount}</Text>
							</View>
							<Ionicons name="chevron-forward" size={22} color={theme.colors.textPrimary} />
						</View>
					</TouchableOpacity>
				)}

				{Platform.OS === 'ios' && (
					<TouchableOpacity
						activeOpacity={0.85}
						style={styles.troubleshootCard}
						onPress={() => router.push('/content-blocker-ios-help' as any)}
					>
						<View style={styles.troubleshootRow}>
							<Text style={styles.troubleshootText}>Content isn&apos;t being blocked?</Text>
							<Ionicons name="chevron-forward" size={20} color={theme.colors.textPrimary} />
						</View>
					</TouchableOpacity>
				)}

				{Platform.OS === 'android' && (
					<View style={styles.helpCard}>
						<Text style={styles.helpTitle}>If content still appears, check DNS settings</Text>
						<TouchableOpacity
							onPress={() => router.push('/content-blocker-settings' as any)}
							style={styles.configureButton}
							activeOpacity={0.85}
						>
							<Text style={styles.configureButtonText}>Configure Settings</Text>
						</TouchableOpacity>
					</View>
				)}

				{/* __DEV__ && (
					<View style={{ marginTop: 12 }}>
						<TouchableOpacity onPress={runDebug}>
							<Text style={{ color: theme.colors.textSecondary, fontSize: 13 }}>
								Run DNS debug (testResolve)
							</Text>
						</TouchableOpacity>
					</View>
				) */}
			</SafeAreaView>
		</GradientBackground>
	);
}

const createStyles = (theme: any) => StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: theme.colors.background,
		paddingHorizontal: 16,
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: 12,
	},
	backButton: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 4,
		paddingHorizontal: 8,
		borderRadius: 999,
		backgroundColor: 'rgba(255,255,255,0.08)',
	},
	backButtonText: {
		color: theme.colors.textPrimary,
		fontSize: 14,
		fontWeight: '600',
		marginLeft: 6,
	},
	hero: {
		alignItems: 'center',
		marginTop: 8,
		marginBottom: 12,
	},
	lottieLock: {
		width: 240,
		height: 200,
		marginBottom: 12,
		marginTop: 8,
	},
	heroTitle: {
		color: theme.colors.textPrimary,
		fontSize: 22,
		fontWeight: '700',
		marginTop: 4,
		marginBottom: 12,
	},
	heroSubtitle: {
		color: theme.colors.textSecondary,
		fontSize: 13,
		textAlign: 'center',
		marginTop: 6,
		paddingHorizontal: 12,
		marginBottom: 20,
	},
	card: {
		backgroundColor: theme.colors.card || theme.colors.surface || '#121218',
		borderRadius: 14,
		padding: 16,
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: theme.colors.inputBorder,
	},
	appBlockerCard: {
		marginTop: 12,
		backgroundColor: theme.colors.card || theme.colors.surface || '#121218',
		borderRadius: 14,
		overflow: 'hidden',
		padding: 16,
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: theme.colors.inputBorder,
	},
	appBlockerRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	appBlockerLeft: {
		flexDirection: 'column',
	},
	appBlockerTitle: {
		color: theme.colors.textPrimary,
		fontSize: 16,
		fontWeight: '600',
	},
	appBlockerCount: {
		marginTop: 6,
		color: theme.colors.textSecondary,
		fontSize: 14,
		fontWeight: '600',
	},
	troubleshootCard: {
		marginTop: 12,
		backgroundColor: theme.colors.card || theme.colors.surface || '#121218',
		borderRadius: 14,
		padding: 16,
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: theme.colors.inputBorder,
	},
	troubleshootRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	troubleshootText: {
		color: theme.colors.textPrimary,
		fontSize: 15,
		fontWeight: '600',
	},
	helpCard: {
		backgroundColor: theme.colors.card || theme.colors.surface || '#121218',
		borderRadius: 14,
		padding: 16,
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: theme.colors.inputBorder,
		marginTop: 12,
	},
	helpTitle: {
		color: theme.colors.textPrimary,
		fontSize: 15,
		fontWeight: '600',
		marginBottom: 8,
	},
	helpSection: {
		marginTop: 6,
	},
	helpRow: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	helpStep: {
		color: theme.colors.textSecondary,
		fontSize: 13,
		flex: 1,
	},
	helpEmoji: {
		fontSize: 15,
	},
	emojiIcon: {
		fontSize: 18,
		marginRight: 8,
	},
	helpCta: {
		marginTop: 8,
		flexDirection: 'row',
		alignItems: 'center',
	},
	helpCtaText: {
		marginLeft: 6,
		color: theme.colors.primary,
		fontSize: 13,
	},
	helpDivider: {
		height: StyleSheet.hairlineWidth,
		backgroundColor: theme.colors.inputBorder,
		marginVertical: 12,
	},
	configureButton: {
		marginTop: 10,
		backgroundColor: '#fff',
		borderRadius: 999,
		paddingVertical: 10,
		alignItems: 'center',
	},
	configureButtonText: {
		color: '#000',
		fontSize: 14,
		fontWeight: '600',
	},
	row: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: 8,
	},
	title: {
		color: theme.colors.textPrimary,
		fontSize: 16,
		fontWeight: '600',
	},
	subtitle: {
		color: theme.colors.textSecondary,
		fontSize: 13,
		marginTop: 4,
	},
	activeLabel: {
		color: theme.colors.success || theme.colors.textSecondary,
		fontSize: 12,
		marginTop: 4,
	},
	modeText: {
		color: theme.colors.textSecondary,
		fontSize: 12,
		marginTop: 10,
	}
});


