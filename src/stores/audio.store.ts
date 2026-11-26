import { create } from 'zustand';

import { audioEngine } from '@/engines/audio/AudioEngine';

import { DEFAULT_SYNTH_SETTINGS, MAX_HARMONICS } from '@/engines/audio/constants';

import type {
  ADSREnvelope,
  AudioStatus,
  SynthSettings,
  SynthesisMode,
  Waveform,
} from '@/core/types/audio.types';

interface AudioState {
  status: AudioStatus;
  error: string | null;
  settings: SynthSettings;
  previewFrequency: number;

  initialize: () => Promise<void>;

  playTone: (frequency: number, duration?: number) => Promise<void>;

  playChord: (frequencies: number[], duration?: number) => Promise<void>;

  setPreviewFrequency: (frequency: number) => void;

  setWaveform: (waveform: Waveform) => void;

  setMode: (mode: SynthesisMode) => void;

  setEnvelope: (envelope: Partial<ADSREnvelope>) => void;

  setHarmonicCount: (count: number) => void;

  stopAll: () => void;
}

export const useAudioStore = create<AudioState>((set, get) => {
  const updateSettings = (changes: Partial<SynthSettings>) => {
    const settings = {
      ...get().settings,
      ...changes,
    };

    audioEngine.setSettings(settings);

    set({ settings });
  };

  const handleError = (error: unknown) => {
    set({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown audio error',
    });
  };

  return {
    status: 'idle',

    error: null,

    settings: {
      ...DEFAULT_SYNTH_SETTINGS,
      envelope: { ...DEFAULT_SYNTH_SETTINGS.envelope },
    },

    previewFrequency: 440,

    initialize: async () => {
      set({ status: 'initializing', error: null });

      try {
        await audioEngine.initialize();

        set({ status: 'ready' });
      } catch (error) {
        handleError(error);
      }
    },

    playTone: async (frequency, duration = 0.5) => {
      try {
        set({ error: null });

        await audioEngine.playTone({
          frequency,
          duration,
        });

        set({ status: 'ready' });
      } catch (error) {
        handleError(error);
      }
    },

    playChord: async (frequencies, duration = 1) => {
      try {
        set({ error: null });

        await audioEngine.playChord(frequencies, duration);

        set({ status: 'ready' });
      } catch (error) {
        handleError(error);
      }
    },

    setPreviewFrequency: (frequency) => {
      if (!Number.isFinite(frequency)) return;

      set({ previewFrequency: frequency });
    },

    setWaveform: (waveform) => {
      updateSettings({ waveform });
    },

    setMode: (mode) => {
      updateSettings({ mode });
    },

    setEnvelope: (envelope) => {
      updateSettings({
        envelope: {
          ...get().settings.envelope,
          ...envelope,
        },
      });
    },

    setHarmonicCount: (count) => {
      if (!Number.isFinite(count)) return;

      updateSettings({
        harmonicCount: Math.min(MAX_HARMONICS, Math.max(1, Math.round(count))),
      });
    },

    stopAll: () => {
      audioEngine.stopAll();
    },
  };
});
