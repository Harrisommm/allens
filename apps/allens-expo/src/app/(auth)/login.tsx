import { SafeAreaView, View, StyleSheet } from 'react-native';
import React from 'react';

import GoogleAuth from '@/components/firebase-auth/google-auth';

export default function Login() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
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
    gap: 16,
  },
});
