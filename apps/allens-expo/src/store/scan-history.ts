import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type ScanHistoryItem = {
  id: string;
  title: string;
  originalText: string;
  translatedText: string;
  highlightedIngredients: string[];
  imageUri?: string;
  createdAt: string;
};

type ScanHistoryState = {
  scans: ScanHistoryItem[];
  addScan: (item: ScanHistoryItem) => void;
  removeScan: (id: string) => void;
  clear: () => void;
  getScanById: (id: string) => ScanHistoryItem | undefined;
};

export const useScanHistory = create<ScanHistoryState>()(
  persist(
    (set, get) => ({
      scans: [],
      addScan: (item) =>
        set((state) => ({
          scans: [item, ...state.scans].slice(0, 25),
        })),
      removeScan: (id) => set((state) => ({ scans: state.scans.filter((scan) => scan.id !== id) })),
      clear: () => set({ scans: [] }),
      getScanById: (id) => get().scans.find((scan) => scan.id === id),
    }),
    {
      name: 'allens-scan-history',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ scans: state.scans }),
    }
  )
);
