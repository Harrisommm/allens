import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

import GoogleAuth from '@/components/firebase-auth/google-auth';
import { strings } from '@/services/strings';
import { uiLanguage } from '@/services/translation';

export default function Login() {
  const t = strings(uiLanguage());

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>allens</Text>
          <Text style={styles.subtitle}>{t.tagline}</Text>
        </View>
        <GoogleAuth />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    gap: 48,
    padding: 24,
  },
  header: {
    gap: 8,
    alignItems: 'center',
  },
  title: {
    fontSize: 40,
    fontWeight: '700',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 16,
    color: '#475569',
    textAlign: 'center',
  },
});
