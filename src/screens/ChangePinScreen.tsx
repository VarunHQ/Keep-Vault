import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import type { RootStackParamList } from '../../App';
import { useVault } from '../vault/VaultContext';

type Props = NativeStackScreenProps<RootStackParamList, 'ChangePin'>;

export function ChangePinScreen({ navigation, route }: Props) {
  const { changePin, lock } = useVault();
  const vaultId = route.params.vaultId;

  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  const canSubmit = useMemo(() => {
    if (busy) return false;
    if (currentPin.length < 4 || newPin.length < 4) return false;
    if (newPin !== confirmPin) return false;
    if (newPin === currentPin) return false;
    return true;
  }, [busy, currentPin, newPin, confirmPin]);

  const pct = progress && progress.total > 0 ? progress.done / progress.total : 0;

  return (
    <View style={styles.root}>
      <Text style={styles.h1}>Change {vaultId === 'main' ? 'Main' : 'Decoy'} PIN</Text>
      <Text style={styles.p}>
        This will re-encrypt every document in this vault. Keep the app open until it finishes.
      </Text>

      <Text style={styles.label}>Current PIN</Text>
      <TextInput
        value={currentPin}
        onChangeText={setCurrentPin}
        keyboardType="number-pad"
        secureTextEntry
        style={styles.input}
        editable={!busy}
      />

      <Text style={styles.label}>New PIN</Text>
      <TextInput
        value={newPin}
        onChangeText={setNewPin}
        keyboardType="number-pad"
        secureTextEntry
        style={styles.input}
        editable={!busy}
      />

      <Text style={styles.label}>Confirm new PIN</Text>
      <TextInput
        value={confirmPin}
        onChangeText={setConfirmPin}
        keyboardType="number-pad"
        secureTextEntry
        style={styles.input}
        editable={!busy}
      />

      {progress ? (
        <View style={{ marginTop: 12, gap: 8 }}>
          <Text style={styles.pSmall}>
            Re-encrypting {progress.done}/{progress.total}
          </Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.round(pct * 100)}%` }]} />
          </View>
        </View>
      ) : null}

      <Pressable
        disabled={!canSubmit}
        style={[styles.button, !canSubmit && { opacity: 0.5 }]}
        onPress={async () => {
          try {
            setBusy(true);
            setProgress({ done: 0, total: 0 });

            await changePin({
              vaultId,
              currentPin,
              newPin,
              onProgress: (p) => setProgress(p),
            });

            Alert.alert('PIN changed', 'Please unlock again with your new PIN.');
            await lock();
            navigation.popToTop();
            navigation.replace('Unlock');
          } catch (e: any) {
            setProgress(null);
            Alert.alert('Change PIN failed', e?.message ?? String(e));
          } finally {
            setBusy(false);
          }
        }}
      >
        <Text style={styles.buttonText}>{busy ? 'Working…' : 'Change PIN'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: 16, gap: 10 },
  h1: { fontSize: 22, fontWeight: '800' },
  p: { opacity: 0.75, lineHeight: 20, marginBottom: 6 },
  pSmall: { opacity: 0.7, fontSize: 12 },
  label: { fontSize: 12, fontWeight: '700', opacity: 0.75, marginTop: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  progressTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: '#e5e7eb',
    overflow: 'hidden',
  },
  progressFill: { height: 10, backgroundColor: '#111827' },
  button: {
    marginTop: 14,
    backgroundColor: '#111827',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: { color: 'white', fontWeight: '800' },
});

