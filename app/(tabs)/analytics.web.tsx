import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import GradientBackground from '@/src/screen-components/gradient-background/GradientBackground';

export default function AnalyticsScreen() {
	return (
		<GradientBackground>
			<View style={styles.container}>
				<Text style={styles.title}>Analytics</Text>
				<Text style={styles.subtitle}>Charts are not available on web yet.</Text>
			</View>
		</GradientBackground>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		paddingHorizontal: 20,
		paddingTop: 40,
	},
	title: {
		fontSize: 28,
		fontWeight: 'bold',
		marginBottom: 8,
	},
	subtitle: {
		fontSize: 14,
		opacity: 0.8,
	},
});


