import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import type { RootStackParamList } from '../../App';
import { listDocs } from '../vault/docsService';
import { useVault } from '../vault/VaultContext';
import type { DocListItem } from '../vault/docsTypes';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export function HomeScreen({ navigation }: Props) {
  const { unlocked, lock } = useVault();
  const theme = useTheme();
  const [docs, setDocs] = useState<DocListItem[]>([]);

  async function refresh() {
    if (!unlocked) return;
    const rows = await listDocs({ vaultId: unlocked.vaultId });
    setDocs(rows);
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unlocked?.vaultId]);

  if (!unlocked) return null;

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <View style={styles.headerRow}>
        <Text
          style={[
            styles.vaultBadge,
            { color: theme.colors.text, backgroundColor: theme.dark ? '#1f2a44' : '#EEF2FF' },
          ]}
        >
          {unlocked.vaultId === 'decoy' ? 'Decoy vault' : 'Main vault'}
        </Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Pressable onPress={() => navigation.navigate('Sync')} style={styles.linkBtn}>
            <Text style={[styles.linkText, { color: theme.colors.text }]}>Sync</Text>
          </Pressable>
          <Pressable onPress={() => navigation.navigate('Settings')} style={styles.linkBtn}>
            <Text style={[styles.linkText, { color: theme.colors.text }]}>Settings</Text>
          </Pressable>
        </View>
      </View>

      <Pressable
        style={[styles.primaryBtn, { backgroundColor: theme.colors.text }]}
        onPress={async () => {
          try {
            await importDocFlow({ vaultId: unlocked.vaultId, vaultKey: unlocked.key });
            await refresh();
          } catch (e: any) {
            Alert.alert('Import failed', e?.message ?? String(e));
          }
        }}
      >
        <Text style={[styles.primaryText, { color: theme.colors.background }]}>Import document</Text>
      </Pressable>

      <FlatList
        data={docs}
        keyExtractor={(d) => d.id}
        contentContainerStyle={{ paddingVertical: 12 }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        renderItem={({ item }) => (
          <Pressable
            style={[styles.card, { borderColor: theme.colors.border, backgroundColor: theme.colors.card }]}
            onPress={() => navigation.navigate('Doc', { id: item.id })}
          >
            <Text style={[styles.cardTitle, { color: theme.colors.text }]} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={[styles.cardMeta, { color: theme.colors.text }]}>
              {item.mimeType} · {new Date(item.updatedAt).toLocaleString()}
            </Text>
          </Pressable>
        )}
        ListEmptyComponent={() => (
          <View style={{ paddingVertical: 24 }}>
            <Text style={{ opacity: 0.7, color: theme.colors.text }}>
              No documents yet. Import your first one.
            </Text>
          </View>
        )}
      />

      <Pressable
        style={styles.dangerBtn}
        onPress={async () => {
          await lock();
          navigation.replace('Unlock');
        }}
      >
        <Text style={styles.dangerText}>Lock</Text>
      </Pressable>
    </View>
  );
}

async function importDocFlow(params: { vaultId: 'main' | 'decoy'; vaultKey: Uint8Array }) {
  const { importDocument } = await import('../vault/docsService');
  await importDocument({ vaultId: params.vaultId, vaultKey: params.vaultKey });
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  vaultBadge: {
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  linkBtn: { paddingHorizontal: 8, paddingVertical: 6 },
  linkText: { fontWeight: '700' },
  primaryBtn: {
    marginTop: 14,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryText: { fontWeight: '800' },
  card: { borderWidth: 1, borderRadius: 14, padding: 14 },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  cardMeta: { fontSize: 12, opacity: 0.7, marginTop: 6 },
  dangerBtn: { marginTop: 6, paddingVertical: 12, alignItems: 'center' },
  dangerText: { color: '#b91c1c', fontWeight: '800' },
});

