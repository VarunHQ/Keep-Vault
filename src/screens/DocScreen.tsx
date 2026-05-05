import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import type { RootStackParamList } from '../../App';
import { getDoc, openDoc } from '../vault/docsService';
import { useVault } from '../vault/VaultContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Doc'>;

export function DocScreen({ route }: Props) {
  const { unlocked } = useVault();
  const [doc, setDoc] = useState<{ title: string; mimeType: string; updatedAt: number } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!unlocked) return;
    void (async () => {
      const d = await getDoc({ id: route.params.id, vaultId: unlocked.vaultId });
      setDoc(d ? { title: d.title, mimeType: d.mimeType, updatedAt: d.updatedAt } : null);
    })();
  }, [route.params.id, unlocked]);

  if (!unlocked) return null;
  if (!doc) {
    return (
      <View style={styles.root}>
        <Text style={styles.p}>Not found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <Text style={styles.h1} numberOfLines={2}>
        {doc.title}
      </Text>
      <Text style={styles.p}>
        {doc.mimeType} · updated {new Date(doc.updatedAt).toLocaleString()}
      </Text>

      <Pressable
        disabled={busy}
        style={[styles.button, busy && { opacity: 0.6 }]}
        onPress={async () => {
          try {
            setBusy(true);
            await openDoc({ id: route.params.id, vaultId: unlocked.vaultId, vaultKey: unlocked.key });
          } catch (e: any) {
            Alert.alert('Open failed', e?.message ?? String(e));
          } finally {
            setBusy(false);
          }
        }}
      >
        <Text style={styles.buttonText}>{busy ? 'Working…' : 'Open / Share'}</Text>
      </Pressable>

      <Text style={styles.pSmall}>
        Opening decrypts the file to a temporary cache location for the share/open action.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: 16, gap: 12 },
  h1: { fontSize: 22, fontWeight: '800' },
  p: { opacity: 0.75, lineHeight: 20 },
  pSmall: { opacity: 0.65, fontSize: 12, lineHeight: 18 },
  button: {
    marginTop: 8,
    backgroundColor: '#111827',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: { color: 'white', fontWeight: '800' },
});

