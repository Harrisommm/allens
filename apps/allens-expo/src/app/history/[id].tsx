import { useMemo } from 'react';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { findAllergenMatches, splitByMatches } from '@/services/allergy-matcher';
import { useAllergies } from '@/store/allergies';
import { useScanHistory } from '@/store/scan-history';

export default function HistoryDetailScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const scan = useScanHistory((state) => (params.id ? state.getScanById(params.id) : undefined));
  const removeScan = useScanHistory((state) => state.removeScan);
  // ponytail: highlights are recomputed from the *current* profile, so editing
  // your allergies re-colours old scans. Snapshot the match ranges onto the scan
  // if they ever need to stay frozen at scan time.
  const selected = useAllergies((state) => state.selected);
  const custom = useAllergies((state) => state.custom);
  const allergens = useMemo(() => useAllergies.getState().activeAllergens(), [selected, custom]);

  if (!params.id) return <Redirect href="/history" />;

  if (!scan) {
    return (
      <View style={styles.missing}>
        <Text style={styles.missingText}>Scan not found. Return to history and try again.</Text>
      </View>
    );
  }

  const isRisky = scan.highlightedIngredients.length > 0;

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
    <ScrollView contentContainerStyle={styles.container}>
      <View style={[styles.badge, isRisky ? styles.badgeDanger : styles.badgeSafe]}>
        <Text style={[styles.badgeText, isRisky ? styles.badgeTextDanger : styles.badgeTextSafe]}>
          {isRisky ? `Danger · ${scan.highlightedIngredients.join(', ')}` : 'Safe · no matches'}
        </Text>
      </View>

      <Text style={styles.title}>{scan.title}</Text>
      <Text style={styles.meta}>{new Date(scan.createdAt).toLocaleString()}</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Translated text</Text>
        {renderHighlighted(scan.translatedText)}
      </View>

      {scan.originalText !== scan.translatedText ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Original text</Text>
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
        <Text style={styles.deleteText}>Delete this scan</Text>
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
