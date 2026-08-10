import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { PRESET_ALLERGENS, type Allergen } from '@/services/allergy-matcher';

type AllergyState = {
  /** Names of selected allergens — preset or custom. */
  selected: string[];
  /** User-typed allergens; alias list is just the name itself. */
  custom: string[];
  toggle: (name: string) => void;
  addCustom: (name: string) => void;
  removeCustom: (name: string) => void;
  /** Everything selected, resolved to matchable aliases. */
  activeAllergens: () => Allergen[];
};

export const useAllergies = create<AllergyState>()(
  persist(
    (set, get) => ({
      selected: [],
      custom: [],

      toggle: (name) =>
        set((state) => ({
          selected: state.selected.includes(name)
            ? state.selected.filter((entry) => entry !== name)
            : [...state.selected, name],
        })),

      addCustom: (name) => {
        const trimmed = name.trim();
        if (!trimmed) return;
        set((state) =>
          state.custom.includes(trimmed)
            ? state
            : { custom: [...state.custom, trimmed], selected: [...state.selected, trimmed] }
        );
      },

      removeCustom: (name) =>
        set((state) => ({
          custom: state.custom.filter((entry) => entry !== name),
          selected: state.selected.filter((entry) => entry !== name),
        })),

      activeAllergens: () => {
        const { selected, custom } = get();
        const presets = PRESET_ALLERGENS.filter((allergen) => selected.includes(allergen.name));
        const customs = custom
          .filter((name) => selected.includes(name))
          .map((name) => ({ name, aliases: [name] }));
        return [...presets, ...customs];
      },
    }),
    {
      name: 'allens-allergies',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ selected: state.selected, custom: state.custom }),
    }
  )
);
