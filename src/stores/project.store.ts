import { create } from 'zustand';

interface ProjectState {
  name: string;
  bpm: number;
  timeSignature: [number, number];
  volume: number;
  referenceFrequency: number;
  isLoopEnabled: boolean;

  setName: (name: string) => void;
  setBpm: (bpm: number) => void;
  setVolume: (volume: number) => void;
  setReferenceFrequency: (frequency: number) => void;
  toggleLoop: () => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  name: 'Untitled Project',
  bpm: 120,
  timeSignature: [4, 4],
  volume: 0.75,
  referenceFrequency: 440,
  isLoopEnabled: false,

  setName: (name) => set({ name }),

  setBpm: (bpm) => {
    if (!Number.isFinite(bpm)) return;

    set({
      bpm: Math.min(300, Math.max(20, bpm)),
    });
  },

  setVolume: (volume) => {
    if (!Number.isFinite(volume)) return;

    set({
      volume: Math.min(1, Math.max(0, volume)),
    });
  },

  setReferenceFrequency: (frequency) => {
    if (!Number.isFinite(frequency) || frequency <= 0) return;

    set({ referenceFrequency: frequency });
  },

  toggleLoop: () =>
    set((state) => ({
      isLoopEnabled: !state.isLoopEnabled,
    })),
}));
