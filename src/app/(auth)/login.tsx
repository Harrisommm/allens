import { useEffect } from 'react';
import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useState } from 'react';

import { PrimaryButton } from '@/components/PrimaryButton';
import { SectionHeading } from '@/components/SectionHeading';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/store/auth';

WebBrowser.maybeCompleteAuthSession();

const useProxy = Constants.appOwnership === 'expo'; // Expo Go만 proxy 사용
const redirectUri = AuthSession.makeRedirectUri({ useProxy } as any);

export default function LoginScreen() {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const setAuth = useAuth((state) => state.signIn);
  const [request, response, promptAsync] = Google.useAuthRequest({
    // Expo Go에서 proxy를 쓰려면 expoClientId 지정
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
        .catch((err) => {
          console.warn('Google sign-in failed', err);
        })
        .finally(() => setIsAuthenticating(false));
    }
  }, [response, setAuth]);

  return (
    <View style={styles.container}>
      <SectionHeading title="Social login" subtitle="Mocked for now" />
      <View style={styles.card}>
        <Text style={styles.copy}>
          Here we will drop Google / Apple / Kakao / Naver providers. For now this button just
          routes you back to the storyboard so we can focus on the scan flow.
        </Text>
        <PrimaryButton
          label="Sign in with Google"
          onPress={() => {
            if (!request) return;
            setIsAuthenticating(true);
            promptAsync({ useProxy, redirectUri, useWebRedirect: useProxy } as any).finally(() =>
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
