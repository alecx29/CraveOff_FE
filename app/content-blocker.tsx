import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Switch, Alert, Platform, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '@/src/context/ThemeProvider';
import { CraveOffProtection } from '@/src/native/CraveOffProtection';
import { DEFAULT_BLOCKLIST } from '@/src/config/blocklist-default';
import GradientBackground from '@/src/screen-components/gradient-background/GradientBackground';
import LottieUniversal from '@/src/components/LottieUniversal';

export default function ContentBlockerScreen() {
	const { theme } = useTheme();
	const insets = useSafeAreaInsets();
	const styles = useMemo(() => createStyles(theme), [theme]);
	const [enabled, setEnabled] = useState(false);
	const [busy, setBusy] = useState(false);
	const [, setMode] = useState<'full-tunnel' | 'dns-only' | undefined>();

	useEffect(() => {
		let sub: any;
		const init = async () => {
			try {
				const s = await CraveOffProtection.status();
				setEnabled(!!s.running);
				setMode(s.mode);
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
		if (Platform.OS !== 'android') {
			Alert.alert('Not supported', 'Content restrictions are currently available on Android only.');
			return;
		}
		if (busy) return;
		setBusy(true);
		try {
			if (value) {
				// Ensure we have at least a default blocklist applied
				try { await CraveOffProtection.applyBlocklist(DEFAULT_BLOCKLIST); } catch {}
				// Optimistic UI: show enabled while the service spins up
				setEnabled(true);
				await CraveOffProtection.enable();
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

	return (
		<GradientBackground>
			<SafeAreaView style={[styles.container, { paddingTop: Math.max(insets.top, 12) }]}>
				<View style={styles.header}>
					<TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, left: 8, right: 8, bottom: 8 }}>
						<Ionicons name="chevron-back" size={24} color={theme.colors.textPrimary} />
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
						CraveOff protects you by managing content restrictions and disabling private browsing
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


