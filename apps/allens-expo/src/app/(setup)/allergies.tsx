import { useState } from 'react';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { PrimaryButton } from '@/components/PrimaryButton';
import { SectionHeading } from '@/components/SectionHeading';
import { signOutEverywhere } from '@/components/firebase-auth/google-auth';
import { PRESET_ALLERGENS } from '@/services/allergy-matcher';
import { useAllergies } from '@/store/allergies';
import { useAuth } from '@/store/auth';

export default function AllergySetupScreen() {
  const { selected, custom, toggle, addCustom, removeCustom } = useAllergies();
  const email = useAuth((state) => state.user?.email);
  const [draft, setDraft] = useState('');

  const submitCustom = () => {
    addCustom(draft);
    setDraft('');
  };

  const renderPill = (name: string, onLongPress?: () => void) => (
    <Pressable
      key={name}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected.includes(name) }}
      onPress={() => toggle(name)}
      onLongPress={onLongPress}
      style={[styles.pill, selected.includes(name) && styles.pillSelected]}
    >
      <Text style={[styles.pillText, selected.includes(name) && styles.pillTextSelected]}>
        {name}
      </Text>
    </Pressable>
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <SectionHeading
        title="Allergy profile"
        subtitle="Pick everything you react to. Every scan is matched against this list."
      />

      <View style={styles.grid}>{PRESET_ALLERGENS.map(({ name }) => renderPill(name))}</View>

      <View style={styles.customSection}>
        <SectionHeading title="Custom" subtitle="Anything else, in the language on your labels." />
        <View style={styles.inputRow}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            onSubmitEditing={submitCustom}
            placeholder="e.g. 메밀, mustard"
            placeholderTextColor="#94a3b8"
            style={styles.input}
            returnKeyType="done"
          />
          <Pressable onPress={submitCustom} style={styles.addButton} accessibilityRole="button">
            <Text style={styles.addButtonText}>Add</Text>
          </Pressable>
        </View>

        <View style={styles.grid}>
          {custom.map((name) => renderPill(name, () => removeCustom(name)))}
        </View>
        {custom.length > 0 ? (
          <Text style={styles.hint}>Long-press a custom tag to delete it.</Text>
        ) : null}
      </View>

      <PrimaryButton
        label={selected.length === 0 ? 'Select at least one' : `Save ${selected.length} & scan`}
        disabled={selected.length === 0}
        onPress={() => router.replace('/camera')}
      />

      <Pressable onPress={signOutEverywhere} style={styles.signOut} accessibilityRole="button">
        <Text style={styles.signOutText}>Sign out{email ? ` · ${email}` : ''}</Text>
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
