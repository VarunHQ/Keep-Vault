import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme } from '@react-navigation/native';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import type { RootStackParamList } from '../../App';
import { useVault } from '../vault/VaultContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Unlock'>;

export function UnlockScreen({ navigation }: Props) {
  const { bootstrapState, refresh, unlock, unlocked } = useVault();
  const theme = useTheme();
  const [pin, setPin] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (bootstrapState === 'unknown') return;
    if (bootstrapState === 'needs-setup') navigation.replace('Setup');
  }, [bootstrapState, navigation]);

  useEffect(() => {
    if (unlocked) navigation.replace('Home');
  }, [unlocked, navigation]);

  const canUnlock = useMemo(() => pin.length >= 4, [pin]);

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>Unlock</Text>
      <Text style={[styles.subtitle, { color: theme.colors.text }]}>
        Enter your main PIN to open your real vault, or the decoy PIN to open the panic vault.
      </Text>

      <TextInput
        value={pin}
        onChangeText={setPin}
        keyboardType="number-pad"
        secureTextEntry
        placeholder="PIN"
        placeholderTextColor={theme.dark ? '#94a3b8' : '#6b7280'}
        style={[
          styles.input,
          { borderColor: theme.colors.border, color: theme.colors.text, backgroundColor: theme.colors.card },
        ]}
        editable={!busy}
      />

      <Pressable
        disabled={!canUnlock || busy}
        style={[
          styles.button,
          { backgroundColor: theme.colors.text },
          (!canUnlock || busy) && styles.buttonDisabled,
        ]}
        onPress={async () => {
          try {
            setBusy(true);
            await refresh();
            await unlock(pin);
          } catch (e: any) {
            Alert.alert('Unlock failed', e?.message ?? String(e));
          } finally {
            setBusy(false);
          }
        }}
      >
        <Text style={[styles.buttonText, { color: theme.colors.background }]}>
          {busy ? 'Unlocking…' : 'Unlock'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: 20, justifyContent: 'center', gap: 12 },
  title: { fontSize: 28, fontWeight: '700' },
  subtitle: { fontSize: 14, opacity: 0.8, marginBottom: 16 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  button: {
    marginTop: 8,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: 'white', fontWeight: '700' },
});

