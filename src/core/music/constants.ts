import type { NoteName, Tuning } from '../types/music.types';

export const NOTE_NAMES: readonly NoteName[] = [
  'C',
  'C#',
  'D',
  'D#',
  'E',
  'F',
  'F#',
  'G',
  'G#',
  'A',
  'A#',
  'B',
];

export const DEFAULT_TUNING: Readonly<Tuning> = {
  referenceFrequency: 440,
  referenceMidi: 69,
  divisionsPerOctave: 12,
};

export const SEMITONES_PER_OCTAVE = 12;
export const CENTS_PER_OCTAVE = 1200;
export const CENTS_PER_SEMITONE = 100;

export const MIN_MIDI = 0;
export const MAX_MIDI = 127;
