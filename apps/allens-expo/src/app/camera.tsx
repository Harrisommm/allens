import { useRef, useState } from 'react';
import { router } from 'expo-router';
import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import { ActivityIndicator, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { PrimaryButton } from '@/components/PrimaryButton';
import { detectIngredientsAsync } from '@/services/ocr';
import { deviceLanguage, translateTextAsync } from '@/services/translation';
import { findAllergenMatches, matchedAllergenNames } from '@/services/allergy-matcher';
import { useAllergies } from '@/store/allergies';
import { useScanHistory } from '@/store/scan-history';

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);
  const addScan = useScanHistory((state) => state.addScan);
  const selectedCount = useAllergies((state) => state.selected.length);

  const handleCapture = async () => {
    if (!cameraRef.current || isProcessing) return;

    try {
      setIsProcessing(true);
      setStatus('Capturing photo…');
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      if (!photo?.uri) throw new Error('Could not save the photo. Try again.');

      setStatus('Reading the label…');
      const ocr = await detectIngredientsAsync(photo.uri);

      setStatus('Translating…');
      const targetLanguage = deviceLanguage();
      const translated = await translateTextAsync(ocr.text, targetLanguage);

      // Match both texts. The original is the one that must never be dropped:
      // its aliases are matched offline, so a missing API key or a dead network
      // can't turn a risky label green. The translation is a bonus pass that
      // covers languages the alias table doesn't spell out.
      const allergens = useAllergies.getState().activeAllergens();
      const matches = matchedAllergenNames([
        ...findAllergenMatches(translated, allergens),
        ...findAllergenMatches(ocr.text, allergens),
      ]);

      const scannedAt = new Date();
      const id = scannedAt.getTime().toString();
      addScan({
        id,
        // The product name when the label has one, otherwise the scan date.
        title: ocr.title ?? scannedAt.toLocaleString(),
        originalText: ocr.text,
        translatedText: translated,
        targetLanguage,
        highlightedIngredients: matches,
        imageUri: photo.uri,
        createdAt: scannedAt.toISOString(),
      });

      setStatus(null);
      router.push(`/history/${id}`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Scan failed. Try again.');
      setTimeout(() => setStatus(null), 4000);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!permission) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionCard}>
        <Text style={styles.permissionTitle}>Camera permission</Text>
        <Text style={styles.permissionBody}>
          allens needs the camera to read ingredient labels. Photos stay on this device.
        </Text>
        <PrimaryButton
          label={permission.canAskAgain ? 'Grant permission' : 'Open settings'}
          onPress={permission.canAskAgain ? requestPermission : Linking.openSettings}
        />
      </View>
    );
  }

  if (selectedCount === 0) {
    return (
      <View style={styles.permissionCard}>
        <Text style={styles.permissionTitle}>Set up your allergies</Text>
        <Text style={styles.permissionBody}>
          Tell allens what to look for and every scan will flag it automatically.
        </Text>
        <PrimaryButton label="Choose allergies" onPress={() => router.push('/(setup)/allergies')} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing={facing} />
      <View style={styles.overlay}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.push('/(setup)/allergies')}>
            <Text style={styles.topBarLink}>Allergies</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setFacing((prev) => (prev === 'back' ? 'front' : 'back'))}>
            <Text style={styles.topBarLink}>Flip</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomBar}>
          <TouchableOpacity onPress={() => router.push('/history')}>
            <Text style={styles.bottomLink}>History</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.shutter}
            onPress={handleCapture}
            disabled={isProcessing}
            accessibilityRole="button"
            accessibilityLabel="Scan label"
          >
            {isProcessing ? <ActivityIndicator color="#0f172a" /> : null}
          </TouchableOpacity>
          <View style={styles.spacer} />
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
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
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
    marginTop: 32,
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
  spacer: {
    width: 56,
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
    position: 'absolute',
    bottom: 140,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 999,
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
    width: 56,
  },
});
