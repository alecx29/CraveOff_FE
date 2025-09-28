import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/src/context/ThemeProvider';
import { apiClient } from '@/src/axios/apiClient';
import { BackendRoutes } from '@/src/axios/backendRoutes';

interface DeleteAccountButtonProps {
  onSuccess?: () => void;
}

const REQUIRED_TOKEN = 'DELETE';

const DeleteAccountButton: React.FC<DeleteAccountButtonProps> = ({ onSuccess }) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const [visible, setVisible] = useState(false);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const open = () => {
    setError(null);
    setText('');
    setVisible(true);
  };

  const close = () => {
    if (!loading) setVisible(false);
  };

  const handleConfirm = async () => {
    if (text.trim() !== REQUIRED_TOKEN) {
      setError(`Type ${REQUIRED_TOKEN} to confirm`);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      // Use HTTP DELETE as required
      await apiClient.delete(BackendRoutes.DELETE_ACCOUNT_CONFIRM(REQUIRED_TOKEN));
      setLoading(false);
      setVisible(false);
      onSuccess?.();
      Alert.alert('Account deleted', 'Your account has been scheduled for deletion.');
    } catch (e: any) {
      setLoading(false);
      setError(e?.message || 'Failed to delete account');
      // On negative response, log the user out as requested
      try { onSuccess?.(); } catch {}
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={open} activeOpacity={0.85}>
        <Ionicons name="trash-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
        <Text style={styles.buttonText}>Delete my account</Text>
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
        <View style={styles.backdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Confirm account deletion</Text>
            <Text style={styles.modalSubtitle}>This action is irreversible.</Text>
            <Text style={styles.modalInstruction}>Type {REQUIRED_TOKEN} to confirm</Text>

            <TextInput
              value={text}
              onChangeText={setText}
              autoCapitalize="characters"
              autoCorrect={false}
              spellCheck={false}
              placeholder={REQUIRED_TOKEN}
              placeholderTextColor={theme.colors.textMuted}
              style={styles.input}
            />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.actionsRow}>
              <TouchableOpacity style={[styles.actionBtn, styles.cancelBtn]} onPress={close} disabled={loading}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, styles.confirmBtn]} onPress={handleConfirm} disabled={loading}>
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.confirmText}>Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    marginTop: 6,
    marginBottom: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.error || '#dc2626',
    paddingVertical: 14,
    borderRadius: theme.borderRadius.pill || 48,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.medium || 12,
    padding: 18,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 10,
  },
  modalInstruction: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.small || 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    color: theme.colors.textPrimary,
    marginBottom: 10,
    backgroundColor: theme.colors.background,
  },
  errorText: {
    color: theme.colors.error || '#dc2626',
    marginBottom: 8,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  actionBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: theme.borderRadius.pill || 40,
  },
  cancelBtn: {
    backgroundColor: theme.colors.backgroundDeep,
  },
  confirmBtn: {
    backgroundColor: theme.colors.error || '#dc2626',
  },
  cancelText: {
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
  confirmText: {
    color: '#fff',
    fontWeight: '700',
  },
});

export default DeleteAccountButton;

