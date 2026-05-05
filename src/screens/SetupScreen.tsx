import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import type { RootStackParamList } from '../../App';
import { useVault } from '../vault/VaultContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Setup'>;

export function SetupScreen({ navigation }: Props) {
  const { setup } = useVault();
  const [mainPin, setMainPin] = useState('');
  const [decoyPin, setDecoyPin] = useState('');
  const [busy, setBusy] = useState(false);

  const canContinue = useMemo(() => mainPin.length >= 4 && decoyPin.length >= 4, [mainPin, decoyPin]);

  return (
    <View style={styles.root}>
      <Text style={styles.title}>Set up your vault</Text>
      <Text style={styles.subtitle}>
        Create a main PIN and a decoy PIN (panic mode). Everything stays offline on this device.
      </Text>

      <Text style={styles.label}>Main PIN</Text>
      <TextInput
        value={mainPin}
        onChangeText={setMainPin}
        keyboardType="number-pad"
        secureTextEntry
        placeholder="4+ digits"
        style={styles.input}
        editable={!busy}
      />

      <Text style={styles.label}>Decoy PIN (panic)</Text>
      <TextInput
        value={decoyPin}
        onChangeText={setDecoyPin}
        keyboardType="number-pad"
        secureTextEntry
        placeholder="4+ digits"
        style={styles.input}
        editable={!busy}
      />

      <Pressable
        disabled={!canContinue || busy}
        style={[styles.button, (!canContinue || busy) && styles.buttonDisabled]}
        onPress={async () => {
          try {
            setBusy(true);
            await setup({ mainPin, decoyPin });
            Alert.alert('Done', 'Vault created. Now unlock with either PIN.');
            navigation.replace('Unlock');
          } catch (e: any) {
            Alert.alert('Setup failed', e?.message ?? String(e));
          } finally {
            setBusy(false);
          }
        }}
      >
        <Text style={styles.buttonText}>{busy ? 'Creating…' : 'Create vaults'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: 20, justifyContent: 'center', gap: 12 },
  title: { fontSize: 28, fontWeight: '700' },
  subtitle: { fontSize: 14, opacity: 0.8, marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  button: {
    marginTop: 8,
    backgroundColor: '#111827',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: 'white', fontWeight: '700' },
});

