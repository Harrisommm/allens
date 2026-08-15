import { useEffect } from 'react';
import {
  ErrorBoundary as RouterErrorBoundary,
  Stack,
  useRouter,
  useSegments,
  type ErrorBoundaryProps,
} from 'expo-router';
import { getAuth, onAuthStateChanged } from '@react-native-firebase/auth';
import { getCrashlytics, recordError } from '@react-native-firebase/crashlytics';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useAuth } from '@/store/auth';

/**
 * Expo Router catches render errors itself, so they never reach the global
 * handler Crashlytics chains onto — without this, a white-screen crash is
 * invisible in the console. Same screen as before, just reported first.
 */
export function ErrorBoundary(props: ErrorBoundaryProps) {
  useEffect(() => {
    recordError(getCrashlytics(), props.error);
  }, [props.error]);

  return <RouterErrorBoundary {...props} />;
}

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
