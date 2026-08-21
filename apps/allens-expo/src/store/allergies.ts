import { useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { PRESET_ALLERGENS, type Allergen } from '@/services/allergy-matcher';

type AllergyState = {
  /**
   * False until AsyncStorage has been read back.
   *
   * Screens must not judge an empty profile before this flips: on a cold start
   * `selected` is `[]` for the first frames, which is indistinguishable from
   * "no allergies chosen" — and in a safety app those render very differently.
   * `auth.isReady` plays the same role for the Firebase session.
   */
  hydrated: boolean;
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
      hydrated: false,
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
      // Runs on success *and* on a read error — a broken store is still "done
      // loading", and leaving the flag false would hang every screen forever.
      onRehydrateStorage: () => () => useAllergies.setState({ hydrated: true }),
    }
  )
);

/**
 * The matchable allergen list, for screens.
 *
 * `activeAllergens()` builds a fresh array every call, so using it directly as
 * a zustand selector re-renders forever. Subscribe to the raw state and derive
 * from it — here, once, instead of in every screen that needs the list.
 */
export function useActiveAllergens(): Allergen[] {
  const selected = useAllergies((state) => state.selected);
  const custom = useAllergies((state) => state.custom);
  return useMemo(() => useAllergies.getState().activeAllergens(), [selected, custom]);
}
