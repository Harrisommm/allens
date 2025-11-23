import { useMemo, useRef, useState } from 'react';
import { router } from 'expo-router';
import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { PrimaryButton } from '@/components/PrimaryButton';
import { detectIngredientsAsync } from '@/services/ocr';
import { translateTextAsync } from '@/services/translation';
import { findAllergenMatches } from '@/services/allergy-matcher';
import { useAuth } from '@/store/auth';
import { useScanHistory } from '@/store/scan-history';

const MOCK_USER_ALLERGENS = ['milk', 'almond', 'shellfish'];

export default function CameraScreen() {
  const isSignedIn = useAuth((state) => state.isSignedIn);
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);
  const addScan = useScanHistory((state) => state.addScan);

  const permissionContent = useMemo(() => {
    if (!isSignedIn) {
      return (
        <View style={styles.permissionCard}>
          <Text style={styles.permissionTitle}>Login required</Text>
          <Text style={styles.permissionBody}>Sign in to start scanning.</Text>
          <PrimaryButton label="Go to login" onPress={() => router.replace('/(auth)/login')} />
        </View>
      );
    }

    if (!permission) {
      return (
        <View style={styles.permissionCard}>
          <Text style={styles.permissionTitle}>Camera permission</Text>
          <Text style={styles.permissionBody}>
            We need access to capture ingredient labels. Tap the button below to continue.
          </Text>
          <PrimaryButton label="Grant permission" onPress={requestPermission} />
        </View>
      );
    }

    if (!permission.granted) {
      return (
        <View style={styles.permissionCard}>
          <Text style={styles.permissionTitle}>Permission denied</Text>
          <Text style={styles.permissionBody}>
            Enable camera access in system settings to keep scanning food labels.
          </Text>
          <PrimaryButton label="Try again" onPress={requestPermission} />
        </View>
      );
    }

    return null;
  }, [permission, requestPermission]);

  const handleCapture = async () => {
    if (!cameraRef.current || isProcessing) {
      return;
    }

    try {
      setIsProcessing(true);
      setStatus('Capturing photo…');
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });

      setStatus('Running mock OCR…');
      const ocr = await detectIngredientsAsync(photo.uri);

      setStatus('Translating ingredients…');
      const translated = await translateTextAsync(ocr.text, 'ko');

      setStatus('Computing allergy matches…');
      const matches = findAllergenMatches(translated, MOCK_USER_ALLERGENS);

      addScan({
        id: Date.now().toString(),
        title: ocr.title ?? 'Scanned food',
        originalText: ocr.text,
        translatedText: translated,
        highlightedIngredients: matches,
        imageUri: photo.uri,
        createdAt: new Date().toISOString(),
      });

      setStatus(`Saved scan • ${matches.length} risky ingredient(s)`);
    } catch (error) {
      setStatus((error as Error).message);
    } finally {
      setIsProcessing(false);
      setTimeout(() => setStatus(null), 4000);
    }
  };

  if (permissionContent) {
    return <View style={styles.container}>{permissionContent}</View>;
  }

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing={facing} />
      <View style={styles.overlay}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.push('/history')}>
            <Text style={styles.topBarLink}>History</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setFacing((prev) => (prev === 'back' ? 'front' : 'back'))}>
            <Text style={styles.topBarLink}>Flip</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.bottomBar}>
          <TouchableOpacity onPress={() => router.push('/(setup)/allergies')}>
            <Text style={styles.bottomLink}>User info</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.shutter} onPress={handleCapture} disabled={isProcessing}>
            {isProcessing ? <ActivityIndicator color="#0f172a" /> : null}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/')}>
            <Text style={styles.bottomLink}>Flow</Text>
          </TouchableOpacity>
        </View>
        {status ? (
          <View style={styles.statusBubble}>
            <Text style={styles.status}>{status}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    padding: 24,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  topBarLink: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  shutter: {
    width: 76,
    height: 76,
    borderRadius: 999,
    borderWidth: 4,
    borderColor: '#f8fafc',
    backgroundColor: 'rgba(248,250,252,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBubble: {
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    marginBottom: 20,
  },
  status: {
    color: '#f8fafc',
    fontSize: 14,
  },
  permissionCard: {
    flex: 1,
    padding: 24,
    gap: 16,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  permissionBody: {
    fontSize: 16,
    color: '#475569',
    lineHeight: 22,
  },
  bottomLink: {
    color: '#f8fafc',
    fontSize: 14,
  },
});
