import { useMemo, useState } from 'react';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/PrimaryButton';
import { SectionHeading } from '@/components/SectionHeading';
import { signOutEverywhere } from '@/components/firebase-auth/google-auth';
import { searchAllergens } from '@/services/allergy-matcher';
import { allergenLabel, strings } from '@/services/strings';
import { uiLanguage } from '@/services/translation';
import { useAllergies } from '@/store/allergies';
import { useAuth } from '@/store/auth';

export default function AllergySetupScreen() {
  const { selected, custom, toggle, addCustom, removeCustom } = useAllergies();
  const email = useAuth((state) => state.user?.email);
  const [draft, setDraft] = useState('');
  const [query, setQuery] = useState('');
  // The stack hides its header, so every screen has to clear the status bar
  // and Dynamic Island itself.
  const insets = useSafeAreaInsets();
  const language = uiLanguage();
  const t = strings(language);

  const submitCustom = () => {
    addCustom(draft);
    setDraft('');
  };

  const search = query.trim().toLowerCase();

  // Matches aliases too, so 새우 finds Shellfish — see searchAllergens.
  const presets = useMemo(() => searchAllergens(search), [search]);

  const customMatches = useMemo(
    () => (search ? custom.filter((name) => name.toLowerCase().includes(search)) : custom),
    [search, custom]
  );

  const renderPill = (name: string, onLongPress?: () => void) => (
    <Pressable
      key={name}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected.includes(name) }}
      onPress={() => toggle(name)}
      onLongPress={onLongPress}
      style={[styles.pill, selected.includes(name) && styles.pillSelected]}
    >
      {/* The English name is the stored identity; only the label is translated. */}
      <Text style={[styles.pillText, selected.includes(name) && styles.pillTextSelected]}>
        {allergenLabel(name, language)}
      </Text>
    </Pressable>
  );

  return (
    <ScrollView contentContainerStyle={[styles.container, { paddingTop: insets.top + 24 }]}>
      <SectionHeading
        title={t.allergyProfile}
        subtitle={t.allergyProfileSubtitle}
      />

      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder={t.searchPlaceholder}
        placeholderTextColor="#94a3b8"
        style={styles.search}
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="none"
        clearButtonMode="while-editing"
        accessibilityLabel={t.searchLabel}
      />

      {/* The Save button always shows the total, so a filtered view can never
          hide how many allergies are actually selected. */}
      <View style={styles.grid}>{presets.map(({ name }) => renderPill(name))}</View>

      {search && presets.length === 0 ? (
        <Text style={styles.hint}>{t.noPresetMatch(query.trim())}</Text>
      ) : null}

      <View style={styles.customSection}>
        <SectionHeading title={t.custom} subtitle={t.customSubtitle} />
        <View style={styles.inputRow}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            onSubmitEditing={submitCustom}
            placeholder={t.customPlaceholder}
            placeholderTextColor="#94a3b8"
            style={styles.input}
            returnKeyType="done"
          />
          <Pressable onPress={submitCustom} style={styles.addButton} accessibilityRole="button">
            <Text style={styles.addButtonText}>{t.add}</Text>
          </Pressable>
        </View>

        <View style={styles.grid}>
          {customMatches.map((name) => renderPill(name, () => removeCustom(name)))}
        </View>
        {customMatches.length > 0 ? (
          <Text style={styles.hint}>{t.longPressHint}</Text>
        ) : null}
      </View>

      <PrimaryButton
        label={selected.length === 0 ? t.selectAtLeastOne : t.saveAndScan(selected.length)}
        disabled={selected.length === 0}
        onPress={() => router.replace('/camera')}
      />

      <Pressable onPress={signOutEverywhere} style={styles.signOut} accessibilityRole="button">
        <Text style={styles.signOutText}>
          {t.signOut}
          {email ? ` · ${email}` : ''}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    gap: 24,
    paddingBottom: 48,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  pill: {
    borderWidth: 1,
    borderColor: '#cbd5f5',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
  },
  pillSelected: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  pillText: {
    color: '#475569',
  },
  pillTextSelected: {
    color: '#fff',
  },
  customSection: {
    gap: 12,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#cbd5f5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#0f172a',
  },
  search: {
    borderWidth: 1,
    borderColor: '#cbd5f5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
  },
  addButton: {
    justifyContent: 'center',
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#e2e8f0',
  },
  addButtonText: {
    fontWeight: '600',
    color: '#0f172a',
  },
  hint: {
    fontSize: 12,
    color: '#94a3b8',
  },
  signOut: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  signOutText: {
    color: '#64748b',
  },
});
