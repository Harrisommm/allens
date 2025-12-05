import { useMemo } from 'react';
import { Link } from 'expo-router';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useScanHistory } from '@/store/scan-history';

export default function HistoryScreen() {
  const scans = useScanHistory((state) => state.scans);
  const empty = scans.length === 0;

  const data = useMemo(
    () => scans.map((scan) => ({ ...scan, subtitle: `${scan.highlightedIngredients.length} matches` })),
    [scans]
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Scan history</Text>
      {empty ? (
        <Text style={styles.empty}>No scans yet. Capture a label to see it here.</Text>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Link href={`/history/${item.id}`} asChild>
              <TouchableOpacity style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.cardSubtitle}>{new Date(item.createdAt).toLocaleString()}</Text>
                </View>
                <Text style={styles.cardMeta}>{item.subtitle}</Text>
                <Text style={styles.cardPreview} numberOfLines={3}>
                  {item.translatedText}
                </Text>
              </TouchableOpacity>
            </Link>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 16,
  },
  list: {
    gap: 16,
  },
  card: {
    borderRadius: 20,
    padding: 20,
    backgroundColor: '#f8fafc',
    gap: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    flex: 1,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#64748b',
  },
  cardMeta: {
    fontSize: 14,
    color: '#b91c1c',
  },
  cardPreview: {
    color: '#475569',
    lineHeight: 20,
  },
  empty: {
    color: '#94a3b8',
    fontSize: 16,
  },
});
