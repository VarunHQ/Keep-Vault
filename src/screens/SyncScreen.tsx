import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { useVault } from '../vault/VaultContext';
import { exportSyncPackage, importSyncPackage } from '../vault/syncService';

export function SyncScreen() {
  const { unlocked } = useVault();
  const [busy, setBusy] = useState(false);

  if (!unlocked) return null;

  return (
    <View style={styles.root}>
      <Text style={styles.h1}>Sync (no cloud)</Text>
      <Text style={styles.p}>
        Create an encrypted sync package and send it to your other device (AirDrop/Files/etc), or
        import one you received.
      </Text>

      <Pressable
        disabled={busy}
        style={[styles.button, busy && { opacity: 0.6 }]}
        onPress={async () => {
          try {
            setBusy(true);
            await exportSyncPackage({ vaultId: unlocked.vaultId, vaultKey: unlocked.key });
          } catch (e: any) {
            Alert.alert('Export failed', e?.message ?? String(e));
          } finally {
            setBusy(false);
          }
        }}
      >
        <Text style={styles.buttonText}>{busy ? 'Working…' : 'Export sync package'}</Text>
      </Pressable>

      <Pressable
        disabled={busy}
        style={[styles.buttonOutline, busy && { opacity: 0.6 }]}
        onPress={async () => {
          try {
            setBusy(true);
            await importSyncPackage({ vaultId: unlocked.vaultId, vaultKey: unlocked.key });
          } catch (e: any) {
            Alert.alert('Import failed', e?.message ?? String(e));
          } finally {
            setBusy(false);
          }
        }}
      >
        <Text style={styles.buttonOutlineText}>{busy ? 'Working…' : 'Import sync package'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: 16, gap: 12 },
  h1: { fontSize: 24, fontWeight: '800' },
  p: { opacity: 0.75, lineHeight: 20 },
  button: {
    marginTop: 8,
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

