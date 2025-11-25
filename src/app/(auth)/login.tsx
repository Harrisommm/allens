import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { router } from 'expo-router';

import { PrimaryButton } from '@/components/PrimaryButton';
import { SectionHeading } from '@/components/SectionHeading';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/store/auth';

// Expo-managed redirect URI (must be registered in Google console)
const redirectUri = 'https://auth.expo.io/@harrisom/allens';
WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const setAuth = useAuth((s) => s.signIn);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const [request, response, promptAsync] = Google.useAuthRequest({
    // cast to any to allow expoClientId for Expo Go
    expoClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    redirectUri,
  } as any);

  useEffect(() => {
    if (response?.type === 'success' && response.authentication?.idToken) {
      setIsAuthenticating(true);
      const credential = GoogleAuthProvider.credential(response.authentication.idToken);
      signInWithCredential(auth, credential)
        .then((userCred) => {
          setAuth({ uid: userCred.user.uid, email: userCred.user.email });
          router.replace('/camera');
        })
        .catch((err) => console.warn('Google sign-in failed', err))
        .finally(() => setIsAuthenticating(false));
    }
  }, [response, setAuth]);

  return (
    <View style={styles.container}>
      <SectionHeading title="Social login" subtitle="Google only" />
      <View style={styles.card}>
        <Text style={styles.copy}>
          Sign in with Google via Expo AuthSession. Ensure redirect URI matches Google console.
        </Text>
        <PrimaryButton
          label="Sign in with Google"
          onPress={() => {
            if (!request) return;
            setIsAuthenticating(true);
            promptAsync({ useProxy: true, redirectUri } as any).finally(() =>
              setIsAuthenticating(false)
            );
          }}
          disabled={!request || isAuthenticating}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 24,
    gap: 16,
  },
  card: {
    padding: 24,
    borderRadius: 24,
    backgroundColor: '#f8fafc',
    gap: 16,
  },
  copy: {
    fontSize: 16,
    color: '#0f172a',
    lineHeight: 22,
  },
});
