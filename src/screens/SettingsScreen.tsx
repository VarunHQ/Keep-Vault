import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { Alert, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { useTheme } from '@react-navigation/native';

import type { RootStackParamList } from '../../App';
import { useThemeMode } from '../theme/ThemeContext';
import { useVault } from '../vault/VaultContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

export function SettingsScreen({ navigation }: Props) {
  const { unlocked } = useVault();
  const { mode, setMode } = useThemeMode();
  const theme = useTheme();
  const isDark = theme.dark;

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.h1, { color: theme.colors.text }]}>Settings</Text>
      <Text style={[styles.p, { color: theme.colors.text }]}>
        This app is offline-first. Sync happens via user-initiated encrypted sync packages.
      </Text>

      <View style={[styles.section, { borderColor: theme.colors.border, backgroundColor: theme.colors.card }]}>
        <Text style={[styles.label, { color: theme.colors.text }]}>Appearance</Text>
        <View style={styles.row}>
          <Text style={[styles.rowText, { color: theme.colors.text }]}>Dark mode</Text>
          <Switch
            value={mode === 'dark'}
            onValueChange={async (v) => {
              await setMode(v ? 'dark' : 'light');
            }}
            trackColor={{ false: '#cbd5e1', true: '#8b5cf6' }}
            thumbColor={isDark ? '#111827' : '#ffffff'}
          />
        </View>
      </View>

      <View style={[styles.section, { borderColor: theme.colors.border, backgroundColor: theme.colors.card }]}>
        <Text style={[styles.label, { color: theme.colors.text }]}>Current vault</Text>
        <Text style={[styles.value, { color: theme.colors.text }]}>{unlocked?.vaultId ?? 'Locked'}</Text>
      </View>

      <View style={[styles.section, { borderColor: theme.colors.border, backgroundColor: theme.colors.card }]}>
        <Text style={[styles.label, { color: theme.colors.text }]}>Security</Text>
        <Pressable
          style={styles.rowBtn}
          onPress={() => navigation.navigate('ChangePin', { vaultId: 'main' })}
        >
          <Text style={[styles.rowText, { color: theme.colors.text }]}>Change Main PIN</Text>
        </Pressable>
        <Pressable
          style={styles.rowBtn}
          onPress={() => navigation.navigate('ChangePin', { vaultId: 'decoy' })}
        >
          <Text style={[styles.rowText, { color: theme.colors.text }]}>Change Decoy PIN</Text>
        </Pressable>
      </View>

      <Pressable
        style={[styles.button, { backgroundColor: theme.colors.text }]}
        onPress={() => {
          Alert.alert(
            'Panic mode',
            'Entering the decoy PIN on the unlock screen opens the decoy vault.',
          );
        }}
      >
        <Text style={[styles.buttonText, { color: theme.colors.background }]}>About panic mode</Text>
      </Pressable>

      <Pressable
        style={[styles.buttonOutline, { borderColor: theme.colors.text }]}
        onPress={() => navigation.navigate('Sync')}
      >
        <Text style={[styles.buttonOutlineText, { color: theme.colors.text }]}>Sync</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: 16, gap: 12 },
  h1: { fontSize: 24, fontWeight: '800' },
  p: { opacity: 0.75, lineHeight: 20 },
  section: { padding: 14, borderWidth: 1, borderColor: '#eee', borderRadius: 14, gap: 6 },
  label: { fontSize: 12, fontWeight: '700', opacity: 0.7 },
  value: { fontSize: 16, fontWeight: '700' },
  rowBtn: { paddingVertical: 10 },
  rowText: { fontSize: 16, fontWeight: '700', color: '#111827' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 },
  button: {
    backgroundColor: '#111827',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: { color: 'white', fontWeight: '800' },
  buttonOutline: {
    borderWidth: 1,
    borderColor: '#111827',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonOutlineText: { color: '#111827', fontWeight: '800' },
});

