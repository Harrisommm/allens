import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/PrimaryButton';
import { SectionHeading } from '@/components/SectionHeading';

const presets = ['Peanut', 'Treenut', 'Milk', 'Shellfish', 'Soy', 'Wheat'];

export default function AllergySetupScreen() {
  const [selected, setSelected] = useState<string[]>(['Milk']);

  const toggle = (name: string) => {
    setSelected((prev) =>
      prev.includes(name) ? prev.filter((entry) => entry !== name) : [...prev, name]
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <SectionHeading title="Allergy profile" subtitle="Quick mock before Firestore" />
      <View style={styles.grid}>
        {presets.map((name) => (
          <Text
            key={name}
            style={[styles.pill, selected.includes(name) && styles.pillSelected]}
            onPress={() => toggle(name)}
          >
            {name}
          </Text>
        ))}
      </View>
      <PrimaryButton label="Save & open camera" onPress={() => {}} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    gap: 24,
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
    color: '#475569',
  },
  pillSelected: {
    backgroundColor: '#0f172a',
    color: '#fff',
    borderColor: '#0f172a',
  },
});
