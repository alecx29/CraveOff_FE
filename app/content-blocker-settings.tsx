import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Linking } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '@/src/context/ThemeProvider';
import GradientBackground from '@/src/screen-components/gradient-background/GradientBackground';
import { CraveOffProtection } from '@/src/native/CraveOffProtection';

export default function ContentBlockerSettingsScreen() {
	const { theme } = useTheme();
	const insets = useSafeAreaInsets();
	const styles = useMemo(() => createStyles(theme), [theme]);

	const openMainSettings = async () => {
		try {
			const ok = await (CraveOffProtection.openSystemSettings?.());
			if (!ok) throw new Error('fallback');
		} catch {
			try {
				await Linking.openURL('intent:#Intent;action=android.settings.SETTINGS;end');
			} catch {
				try { await Linking.openSettings(); } catch {}
			}
		}
	};

	// const openChrome = async () => {
	// 	try {
	// 		const ok = await Linking.openURL('googlechrome://navigate?url=https://www.google.com');
	// 		if (!ok) throw new Error('fallback');
	// 	} catch {
	// 		try {
	// 			await Linking.openURL('https://www.google.com');
	// 		} catch {}
	// 	}
	// };

	return (
		<GradientBackground>
			<SafeAreaView style={[styles.container, { paddingTop: Math.max(insets.top, 12) }]}>
				<View style={styles.header}>
					<TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, left: 8, right: 8, bottom: 8 }}>
						<Ionicons name="chevron-back" size={24} color={theme.colors.textPrimary} />
					</TouchableOpacity>
					<Text style={styles.headerTitle}>Configure Settings</Text>
					<View style={{ width: 24 }} />
				</View>

				<View style={{ height: 8 }} />

				{Platform.OS === 'android' ? (
					<View style={styles.helpCard}>
						<Text style={styles.helpTitle}>If content still appears, check DNS settings</Text>

						<View style={styles.helpSection}>
							<View style={styles.helpRow}>
								<Text style={styles.emojiIcon}>⚙️</Text>
								<Text style={styles.helpStep}>
									System: Settings → Network & Internet → Private DNS → Off
								</Text>
							</View>
							<TouchableOpacity onPress={openMainSettings} style={styles.helpCta}>
								<Ionicons name="open-outline" size={16} color={theme.colors.primary} />
								<Text style={styles.helpCtaText}>Open Settings</Text>
							</TouchableOpacity>
						</View>

						<View style={styles.helpDivider} />

						<View style={styles.helpSection}>
							<View style={styles.helpRow}>
								<Text style={styles.emojiIcon}>🌐</Text>
								<Text style={styles.helpStep}>
									Chrome: <Text style={styles.helpEmoji}>⋮</Text> → Settings → Privacy and security → Use secure DNS → Off
								</Text>
							</View>
							{/* <TouchableOpacity onPress={openChrome} style={styles.helpCta}>
								<Ionicons name="arrow-forward-circle-outline" size={16} color={theme.colors.primary} />
								<Text style={styles.helpCtaText}>Open Chrome</Text>
							</TouchableOpacity> */}
						</View>
					</View>
				) : (
					<Text style={styles.infoText}>This guide is available on Android devices.</Text>
				)}
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
	headerTitle: {
		color: theme.colors.textPrimary,
		fontSize: 18,
		fontWeight: '700',
	},
	helpCard: {
		backgroundColor: theme.colors.card || theme.colors.surface || '#121218',
		borderRadius: 14,
		padding: 16,
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: theme.colors.inputBorder,
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
	emojiIcon: {
		fontSize: 18,
		marginRight: 8,
	},
	helpStep: {
		color: theme.colors.textSecondary,
		fontSize: 13,
		flex: 1,
	},
	helpEmoji: {
		fontSize: 15,
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
	infoText: {
		color: theme.colors.textSecondary,
		fontSize: 14,
		marginTop: 8,
	},
});


