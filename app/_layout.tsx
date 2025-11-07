import 'expo-router/entry';
import { Stack } from 'expo-router';
import { AuthProvider, useAuth } from '../hooks/useAuth';

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </AuthProvider>
  );
}