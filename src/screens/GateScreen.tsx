import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import type { RootStackParamList } from '../../App';
import { useVault } from '../vault/VaultContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Gate'>;

export function GateScreen({ navigation }: Props) {
  const { bootstrapState, welcomeState } = useVault();

  useEffect(() => {
    if (bootstrapState === 'unknown') return;
    if (!welcomeState) return;

    if (bootstrapState === 'needs-setup') {
      navigation.replace('Setup');
      return;
    }

    navigation.replace('Welcome');
  }, [bootstrapState, welcomeState, navigation]);

  return (
    <View style={styles.root}>
      <ActivityIndicator />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

