import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { getAuth, onAuthStateChanged } from '@react-native-firebase/auth';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useAuth } from '@/store/auth';

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const { isSignedIn, isReady, setUser } = useAuth();

  // Firebase is the source of truth for the session; the store just mirrors it.
  useEffect(
    () =>
      onAuthStateChanged(getAuth(), (user) =>
        setUser(user ? { uid: user.uid, email: user.email, displayName: user.displayName } : null)
      ),
    [setUser]
  );

  useEffect(() => {
    if (!isReady) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!isSignedIn && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isSignedIn && inAuthGroup) {
      router.replace('/camera');
    }
  }, [isSignedIn, isReady, router, segments]);

  return (
    <SafeAreaProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#ffffff' },
        }}
      />
    </SafeAreaProvider>
  );
}
