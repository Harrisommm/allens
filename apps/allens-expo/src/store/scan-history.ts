import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type ScanHistoryItem = {
  id: string;
  /**
   * Only ever set by hand. OCR can't reliably tell a product name from the rest
   * of a label, so scans are titled by their date until the user renames one.
   */
  title?: string;
  originalText: string;
  translatedText: string;
  /**
   * Cross-contact warning text, kept apart from the ingredients so an allergen
   * that is only *possibly* present is never shown as one that is.
   *
   * Absent on scans saved before the split, and on labels that printed no
   * advisory. Absent means "unknown", which is judged as ingredients — the
   * stronger verdict — not as a clean advisory.
   */
  advisoryText?: string;
  translatedAdvisoryText?: string;
  /** Language `translatedText` was translated into. Absent on scans saved before it was recorded. */
  targetLanguage?: string;
  imageUri?: string;
  createdAt: string;
};

type ScanHistoryState = {
  scans: ScanHistoryItem[];
  addScan: (item: ScanHistoryItem) => void;
  /** The only way a scan gets a title at all. */
  renameScan: (id: string, title: string) => void;
  removeScan: (id: string) => void;
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
      renameScan: (id, title) =>
        set((state) => ({
          scans: state.scans.map((scan) => (scan.id === id ? { ...scan, title } : scan)),
        })),
      removeScan: (id) => set((state) => ({ scans: state.scans.filter((scan) => scan.id !== id) })),
      getScanById: (id) => get().scans.find((scan) => scan.id === id),
    }),
    {
      name: 'allens-scan-history',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ scans: state.scans }),
      // v1 drops the OCR-guessed titles already on disk. None of them were
      // chosen by the user, and they were the bad guesses this replaced.
      version: 1,
      migrate: (persisted) => ({
        scans: ((persisted as { scans?: ScanHistoryItem[] })?.scans ?? []).map(
          ({ title, ...scan }) => scan
        ),
      }),
    }
  )
);
