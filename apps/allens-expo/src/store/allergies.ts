import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { Allergen } from '@/services/allergy-matcher';

/**
 * Aliases cover English and Korean because a scan is matched against both the
 * original label text and its translation. Add spellings freely — an extra
 * alias only ever makes the app more cautious.
 */
export const PRESET_ALLERGENS: Allergen[] = [
  { name: 'Milk', aliases: ['milk', 'dairy', 'butter', 'cheese', 'cream', 'whey', 'casein', 'lactose', '우유', '유당', '유청', '치즈', '버터', '크림', '분유'] },
  { name: 'Egg', aliases: ['egg', 'albumin', '계란', '달걀', '난백', '난황'] },
  { name: 'Peanut', aliases: ['peanut', 'groundnut', '땅콩'] },
  { name: 'Tree nut', aliases: ['almond', 'walnut', 'cashew', 'hazelnut', 'pecan', 'pistachio', 'macadamia', '아몬드', '호두', '캐슈', '헤이즐넛', '피스타치오', '잣'] },
  { name: 'Soy', aliases: ['soy', 'soya', 'soybean', 'tofu', 'edamame', '대두', '두부', '간장', '된장'] },
  { name: 'Wheat', aliases: ['wheat', 'gluten', 'flour', 'barley', 'rye', '밀', '밀가루', '글루텐', '보리', '호밀'] },
  { name: 'Shellfish', aliases: ['shrimp', 'prawn', 'crab', 'lobster', 'shellfish', 'oyster', 'clam', 'mussel', '새우', '게', '랍스터', '조개', '굴', '홍합'] },
  { name: 'Fish', aliases: ['fish', 'anchovy', 'tuna', 'salmon', 'cod', '생선', '멸치', '참치', '연어', '어육'] },
  { name: 'Sesame', aliases: ['sesame', 'tahini', '참깨', '깨', '참기름'] },
  { name: 'Buckwheat', aliases: ['buckwheat', '메밀'] },
  { name: 'Pork', aliases: ['pork', 'bacon', 'lard', '돼지고기', '돈육'] },
  { name: 'Sulfites', aliases: ['sulfite', 'sulphite', 'aspartame', '아황산'] },
];

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
