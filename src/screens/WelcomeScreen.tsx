import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@react-navigation/native';

import type { RootStackParamList } from '../../App';

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

export function WelcomeScreen({ navigation }: Props) {
  const theme = useTheme();
  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <View style={{ gap: 12 }}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Welcome to KeepVault</Text>
        <Text style={[styles.subtitle, { color: theme.colors.text }]}>
          Offline, encrypted storage for your documents. Use your main PIN for your real vault, or
          your decoy PIN for panic mode.
        </Text>
      </View>

      <Pressable
        style={[styles.button, { backgroundColor: theme.colors.text }]}
        onPress={() => navigation.replace('Unlock')}
      >
        <Text style={[styles.buttonText, { color: theme.colors.background }]}>Next</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: 20, justifyContent: 'space-between' },
  title: { fontSize: 30, fontWeight: '800', marginTop: 40 },
  subtitle: { fontSize: 14, opacity: 0.8, lineHeight: 20 },
  button: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: { color: 'white', fontWeight: '800', fontSize: 16 },
});

