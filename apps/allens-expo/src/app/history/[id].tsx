import { Redirect, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { useScanHistory } from '@/store/scan-history';

export default function HistoryDetailScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const scan = useScanHistory((state) =>
    params.id ? state.getScanById(params.id as string) : undefined
  );

  if (!params.id) {
    return <Redirect href="/history" />;
  }

  if (!scan) {
    return (
      <View style={styles.missing}>
        <Text style={styles.missingText}>Scan not found. Return to history and try again.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{scan.title}</Text>
      <Text style={styles.meta}>{new Date(scan.createdAt).toLocaleString()}</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Translated text</Text>
        <Text style={styles.body}>{scan.translatedText}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Original text</Text>
        <Text style={styles.body}>{scan.originalText}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Risky ingredients</Text>
        {scan.highlightedIngredients.length === 0 ? (
          <Text style={styles.safe}>No matches</Text>
        ) : (
          scan.highlightedIngredients.map((ingredient) => (
            <Text key={ingredient} style={styles.allergen}>
              • {ingredient}
            </Text>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    gap: 20,
    backgroundColor: '#fff',
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
    lineHeight: 22,
  },
  safe: {
    color: '#16a34a',
  },
  allergen: {
    color: '#b91c1c',
    fontWeight: '600',
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
