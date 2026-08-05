import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { GoogleAuthProvider, getAuth, signInWithCredential } from '@react-native-firebase/auth';
import {
  GoogleSignin,
  GoogleSigninButton,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';

// Not a secret (it ships in the app), but keep it configurable per environment.
const WEB_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ??
  '785759755772-1ccmpgd44r06nq5qt7bhjua091clfbel.apps.googleusercontent.com';

GoogleSignin.configure({ webClientId: WEB_CLIENT_ID });

/** Signing in updates Firebase; the root layout listens and routes from there. */
export default function GoogleAuth() {
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const signIn = async () => {
    if (isBusy) return;
    setIsBusy(true);
    setError(null);

    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const result = await GoogleSignin.signIn();

      if (!isSuccessResponse(result)) return; // user dismissed the sheet
      const idToken = result.data.idToken;
      if (!idToken) throw new Error('Google did not return an ID token.');

      await signInWithCredential(getAuth(), GoogleAuthProvider.credential(idToken));
    } catch (cause) {
      if (isErrorWithCode(cause) && cause.code === statusCodes.SIGN_IN_CANCELLED) return;
      setError(cause instanceof Error ? cause.message : 'Sign-in failed. Please try again.');
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <View style={styles.container}>
      <GoogleSigninButton
        size={GoogleSigninButton.Size.Wide}
        color={GoogleSigninButton.Color.Dark}
        onPress={signIn}
        disabled={isBusy}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

export async function signOutEverywhere() {
  await GoogleSignin.signOut().catch(() => {});
  await getAuth().signOut();
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 16,
  },
  error: {
    color: '#b91c1c',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
});
