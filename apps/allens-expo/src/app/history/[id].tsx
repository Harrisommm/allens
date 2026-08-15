import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { findAllergenMatches, scanAllergenNames, splitByMatches } from '@/services/allergy-matcher';
import { allergenLabels, strings } from '@/services/strings';
import { uiLanguage } from '@/services/translation';
import { useActiveAllergens } from '@/store/allergies';
import { useScanHistory } from '@/store/scan-history';

export default function HistoryDetailScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const scan = useScanHistory((state) => (params.id ? state.getScanById(params.id) : undefined));
  const removeScan = useScanHistory((state) => state.removeScan);
  const renameScan = useScanHistory((state) => state.renameScan);
  // The stack hides its header, so every screen has to clear the status bar
  // and Dynamic Island itself.
  const insets = useSafeAreaInsets();
  // Matches are never stored. Badge and highlighting both derive from the
  // *current* profile, so editing your allergies re-judges old scans and the
  // two can never contradict each other.
  const allergens = useActiveAllergens();
  const language = uiLanguage();
  const t = strings(language);

  if (!params.id) return <Redirect href="/history" />;

  if (!scan) {
    return (
      <View style={styles.missing}>
        <Text style={styles.missingText}>{t.scanNotFound}</Text>
      </View>
    );
  }

  // Derived from the current profile, exactly like the highlighting below.
  // Reading a stored snapshot here is what let the text turn red while the
  // badge still claimed "Safe".
  const matched = scanAllergenNames(scan, allergens);
  const isRisky = matched.length > 0;

  const renderHighlighted = (text: string) => (
    <Text style={styles.body}>
      {splitByMatches(text, findAllergenMatches(text, allergens)).map((segment, index) => (
        <Text key={index} style={segment.allergen ? styles.marked : undefined}>
          {segment.text}
        </Text>
      ))}
    </Text>
  );

  return (
    <ScrollView contentContainerStyle={[styles.container, { paddingTop: insets.top + 24 }]}>
      <View style={[styles.badge, isRisky ? styles.badgeDanger : styles.badgeSafe]}>
        <Text style={[styles.badgeText, isRisky ? styles.badgeTextDanger : styles.badgeTextSafe]}>
          {isRisky ? t.danger(allergenLabels(matched, language)) : t.safe}
        </Text>
      </View>

      {/* Uncontrolled on purpose: the store is only touched when editing ends,
          so typing doesn't re-render the highlighted text below on every key. */}
      <TextInput
        style={styles.title}
        defaultValue={scan.title}
        placeholder={t.nameThisScan}
        placeholderTextColor="#cbd5e1"
        returnKeyType="done"
        onEndEditing={(event) => {
          const next = event.nativeEvent.text.trim();
          if (next && next !== scan.title) renameScan(scan.id, next);
        }}
      />
      <Text style={styles.meta}>{new Date(scan.createdAt).toLocaleString()}</Text>

      {/* The photo is the only part of a scan the app can't recompute — when OCR
          mangles a line, this is where you read it yourself.
          ponytail: it lives in the cache directory, so the OS may reclaim it and
          leave a blank box. Copy it into documents if that ever bites. */}
      {scan.imageUri ? (
        <Image
          source={{ uri: scan.imageUri }}
          style={styles.photo}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
        />
      ) : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {t.translatedText}
          {scan.targetLanguage ? ` · ${scan.targetLanguage}` : ''}
        </Text>
        {renderHighlighted(scan.translatedText)}
      </View>

      {scan.originalText !== scan.translatedText ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.originalText}</Text>
          {renderHighlighted(scan.originalText)}
        </View>
      ) : null}

      <Pressable
        accessibilityRole="button"
        onPress={() => {
          removeScan(scan.id);
          router.back();
        }}
        style={styles.delete}
      >
        <Text style={styles.deleteText}>{t.deleteScan}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    gap: 20,
    backgroundColor: '#fff',
    paddingBottom: 48,
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  badgeSafe: {
    backgroundColor: '#dcfce7',
  },
  badgeDanger: {
    backgroundColor: '#fee2e2',
  },
  badgeText: {
    fontWeight: '700',
  },
  badgeTextSafe: {
    color: '#166534',
  },
  badgeTextDanger: {
    color: '#b91c1c',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
  },
  meta: {
    color: '#94a3b8',
  },
  photo: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  body: {
    color: '#1f2937',
    lineHeight: 24,
  },
  marked: {
    color: '#b91c1c',
    fontWeight: '700',
    backgroundColor: '#fee2e2',
  },
  delete: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  deleteText: {
    color: '#b91c1c',
  },
  missing: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  missingText: {
    color: '#475569',
    textAlign: 'center',
  },
});
