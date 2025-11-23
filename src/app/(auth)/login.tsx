import { useEffect } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/PrimaryButton';
import { SectionHeading } from '@/components/SectionHeading';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/store/auth';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const setAuth = useAuth((state) => state.signIn);
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  });

  useEffect(() => {
    if (response?.type === 'success' && response.authentication?.idToken) {
      const credential = GoogleAuthProvider.credential(response.authentication.idToken);
      signInWithCredential(auth, credential)
        .then((userCred) => {
          setAuth({ uid: userCred.user.uid, email: userCred.user.email });
          router.replace('/camera');
        })
        .catch((err) => {
          console.warn('Google sign-in failed', err);
        });
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
          onPress={() => promptAsync()}
          disabled={!request}
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
