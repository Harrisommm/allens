import { useEffect, useRef, useState } from 'react';
import { router } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { ActivityIndicator, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/PrimaryButton';
import { NO_TEXT_FOUND, detectIngredientsAsync } from '@/services/ocr';
import { strings } from '@/services/strings';
import { deviceLanguage, translateTextAsync, uiLanguage } from '@/services/translation';
import { useAllergies } from '@/store/allergies';
import { useScanHistory } from '@/store/scan-history';

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);
  // Errors clear themselves after a few seconds; navigating away first must not
  // leave the timer running against an unmounted screen.
  const statusTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(statusTimer.current), []);
  // The preview stays full-bleed; only the overlay controls clear the Dynamic Island.
  const insets = useSafeAreaInsets();
  const addScan = useScanHistory((state) => state.addScan);
  const t = strings(uiLanguage());
  const selectedCount = useAllergies((state) => state.selected.length);

  const handleCapture = async () => {
    if (!cameraRef.current || isProcessing) return;

    try {
      setIsProcessing(true);
      setStatus(t.capturing);
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      if (!photo?.uri) throw new Error(t.photoFailed);

      setStatus(t.reading);
      const ocr = await detectIngredientsAsync(photo.uri);

      setStatus(t.translating);
      const targetLanguage = deviceLanguage();
      const translated = await translateTextAsync(ocr.text, targetLanguage);

      // Nothing about the match is stored. Both history screens recompute it
      // from the *current* allergy profile, so switching Milk on later re-flags
      // every old scan instead of leaving a stale "Safe" badge behind.
      const scannedAt = new Date();
      const id = scannedAt.getTime().toString();
      addScan({
        id,
        // No title. OCR can't reliably pick the product name out of a label —
        // we usually photograph just the ingredients panel, where it isn't even
        // printed — so scans are listed by date until renamed from the detail
        // screen.
        originalText: ocr.text,
        translatedText: translated,
        targetLanguage,
        imageUri: photo.uri,
        createdAt: scannedAt.toISOString(),
      });

      setStatus(null);
      router.push(`/history/${id}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      setStatus(message === NO_TEXT_FOUND ? t.noTextFound : message || t.scanFailed);
      statusTimer.current = setTimeout(() => setStatus(null), 4000);
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
        <Text style={styles.permissionTitle}>{t.cameraPermission}</Text>
        <Text style={styles.permissionBody}>{t.cameraPermissionBody}</Text>
        <PrimaryButton
          label={permission.canAskAgain ? t.grantPermission : t.openSettings}
          onPress={permission.canAskAgain ? requestPermission : Linking.openSettings}
        />
      </View>
    );
  }

  if (selectedCount === 0) {
    return (
      <View style={styles.permissionCard}>
        <Text style={styles.permissionTitle}>{t.setupTitle}</Text>
        <Text style={styles.permissionBody}>{t.setupBody}</Text>
        <PrimaryButton label={t.chooseAllergies} onPress={() => router.push('/(setup)/allergies')} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Rear camera only — a label scanner has no use for the selfie cam. */}
      <CameraView ref={cameraRef} style={styles.camera} facing="back" />
      <View style={styles.overlay}>
        <View style={[styles.topBar, { marginTop: insets.top }]}>
          <TouchableOpacity onPress={() => router.push('/(setup)/allergies')}>
            <Text style={styles.topBarLink}>{t.allergies}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomBar}>
          <TouchableOpacity onPress={() => router.push('/history')}>
            <Text style={styles.bottomLink}>{t.history}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.shutter}
            onPress={handleCapture}
            disabled={isProcessing}
            accessibilityRole="button"
            accessibilityLabel={t.scanLabel}
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
