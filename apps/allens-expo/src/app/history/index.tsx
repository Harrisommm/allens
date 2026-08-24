import { useMemo } from 'react';
import { Link } from 'expo-router';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { scanVerdict } from '@/services/allergy-matcher';
import { allergenLabels, strings } from '@/services/strings';
import { uiLanguage } from '@/services/translation';
import { useActiveAllergens, useAllergies } from '@/store/allergies';
import { useScanHistory } from '@/store/scan-history';

export default function HistoryScreen() {
  const scans = useScanHistory((state) => state.scans);
  const empty = scans.length === 0;
  // The stack hides its header, so every screen has to clear the status bar
  // and Dynamic Island itself.
  const insets = useSafeAreaInsets();
  const allergens = useActiveAllergens();
  // An empty profile matches nothing, which is not the same as finding nothing —
  // a green "No matches" there is a verdict the app never earned. Until the store
  // rehydrates, every profile looks empty, so wait for that too.
  const judged = useAllergies((state) => state.hydrated) && allergens.length > 0;
  const language = uiLanguage();
  const t = strings(language);

  // Re-judged against the *current* profile rather than a snapshot taken at scan
  // time, so turning Milk on re-flags every old scan in this list too.
  const data = useMemo(
    () =>
      scans.map((scan) => {
        const { direct, advisory } = judged
          ? scanVerdict(scan, allergens)
          : { direct: [], advisory: [] };
        // Same precedence as the detail screen: a real ingredient outranks any
        // cross-contact warning, so the row and the badge can never disagree.
        const tone = !judged ? 'neutral' : direct.length ? 'danger' : advisory.length ? 'warn' : 'safe';
        return {
          ...scan,
          tone,
          stamp: new Date(scan.createdAt).toLocaleString(),
          subtitle: !judged
            ? t.notChecked
            : direct.length
              ? t.matched(allergenLabels(direct, language))
              : advisory.length
                ? t.mayContain(allergenLabels(advisory, language))
                : t.noMatches,
        };
      }),
    [scans, allergens, judged, language, t]
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top + 24 }]}>
      <Text style={styles.title}>{t.scanHistory}</Text>
      {empty ? (
        <Text style={styles.empty}>{t.emptyHistory}</Text>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Link href={`/history/${item.id}`} asChild>
              <TouchableOpacity style={styles.card}>
                <View style={styles.cardHeader}>
                  {/* Untitled scans are their date — showing it twice would be
                      the only thing a stamp-only header could say. */}
                  <Text style={styles.cardTitle}>{item.title ?? item.stamp}</Text>
                  {item.title ? <Text style={styles.cardSubtitle}>{item.stamp}</Text> : null}
                </View>
                <Text
                  style={[
                    styles.cardMeta,
                    item.tone === 'warn' && styles.cardMetaWarn,
                    item.tone === 'safe' && styles.cardMetaSafe,
                    item.tone === 'neutral' && styles.cardMetaNeutral,
                  ]}
                >
                  {item.subtitle}
                </Text>
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
    fontWeight: '600',
  },
  cardMetaSafe: {
    color: '#166534',
  },
  cardMetaWarn: {
    color: '#92400e',
  },
  cardMetaNeutral: {
    color: '#64748b',
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
