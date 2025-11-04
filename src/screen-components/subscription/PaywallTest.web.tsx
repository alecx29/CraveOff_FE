import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type PaywallTestProps = {
	onSubscribed?: () => void;
};

const PaywallTest: React.FC<PaywallTestProps> = () => {
	return (
		<View style={styles.container}>
			<Text style={styles.title}>Purchases are not available on web</Text>
			<Text style={styles.subtitle}>Open the app on iOS or Android to subscribe.</Text>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		backgroundColor: 'rgba(255, 255, 255, 0.08)',
		borderRadius: 16,
		padding: 16,
		borderWidth: 1,
		borderColor: 'rgba(255, 255, 255, 0.18)',
		marginTop: 10,
	},
	title: {
		color: '#fff',
		fontSize: 16,
		fontWeight: '800',
		marginBottom: 6,
	},
	subtitle: {
		color: 'rgba(255,255,255,0.85)',
		fontSize: 13,
	},
});

export default PaywallTest;


