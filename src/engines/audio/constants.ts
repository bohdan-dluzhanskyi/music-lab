import type { ADSREnvelope, SynthSettings } from '@/core/types/audio.types';

export const MIN_AUDIO_FREQUENCY = 20;
export const MAX_AUDIO_FREQUENCY = 20000;

export const MAX_HARMONICS = 32;
export const MAX_POLYPHONY = 16;

export const DEFAULT_ENVELOPE: ADSREnvelope = {
  attack: 0.02,
  decay: 0.2,
  sustain: 0.6,
  release: 0.5,
};

export const DEFAULT_SYNTH_SETTINGS: SynthSettings = {
  waveform: 'sine',
  mode: 'oscillator',
  envelope: { ...DEFAULT_ENVELOPE },
  harmonicCount: 8,
};

export function isAudioFrequency(frequency: number): boolean {
  return (
    Number.isFinite(frequency) &&
    frequency >= MIN_AUDIO_FREQUENCY &&
    frequency <= MAX_AUDIO_FREQUENCY
  );
}

export function clampVolume(volume: number): number {
  if (!Number.isFinite(volume)) return 0;

  return Math.min(1, Math.max(0, volume));
}

export function generatePartials(count: number): number[] {
  if (!Number.isInteger(count) || count < 1 || count > MAX_HARMONICS) {
    throw new RangeError('Invalid harmonic count');
  }

  return Array.from({ length: count }, (_, index) => 1 / (index + 1));
}
