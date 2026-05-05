import 'react-native-gesture-handler';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { VaultProvider, useVault } from './src/vault/VaultContext';
import { ThemeProvider, useNavTheme, useThemeMode } from './src/theme/ThemeContext';
import { WelcomeScreen } from './src/screens/WelcomeScreen';
import { GateScreen } from './src/screens/GateScreen';
import { SetupScreen } from './src/screens/SetupScreen';
import { UnlockScreen } from './src/screens/UnlockScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { DocScreen } from './src/screens/DocScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { SyncScreen } from './src/screens/SyncScreen';
import { ChangePinScreen } from './src/screens/ChangePinScreen';

export type RootStackParamList = {
  Gate: undefined;
  Welcome: undefined;
  Setup: undefined;
  Unlock: undefined;
  Home: undefined;
  Doc: { id: string };
  Settings: undefined;
  Sync: undefined;
  ChangePin: { vaultId: 'main' | 'decoy' };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function RootNavigator() {
  // We always start in a gate screen to avoid flicker while bootstrapping.
  useVault();
  const navTheme = useNavTheme();
  const { resolved } = useThemeMode();

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        initialRouteName="Gate"
        screenOptions={{
          contentStyle: { backgroundColor: navTheme.colors.background },
          headerStyle: { backgroundColor: navTheme.colors.card },
          headerTintColor: navTheme.colors.text,
        }}
      >
        <Stack.Screen name="Gate" component={GateScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Setup" component={SetupScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Unlock" component={UnlockScreen} options={{ headerShown: false }} />
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: 'KeepVault' }}
        />
        <Stack.Screen name="Doc" component={DocScreen} options={{ title: 'Document' }} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="Sync" component={SyncScreen} options={{ title: 'Sync' }} />
        <Stack.Screen name="ChangePin" component={ChangePinScreen} options={{ title: 'Change PIN' }} />
      </Stack.Navigator>
      <StatusBar style={resolved === 'dark' ? 'light' : 'dark'} />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <VaultProvider>
          <RootNavigator />
        </VaultProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

