import { NOTE_NAMES } from './constants';
import { frequencyToMidi, midiToFrequency } from './frequency';

import type { NoteName, Pitch } from '../types/music.types';

export function midiToNote(midi: number) {
  const rounded = Math.round(midi);
  const index = ((rounded % 12) + 12) % 12;

  return {
    note: NOTE_NAMES[index]!,
    octave: Math.floor(rounded / 12) - 1,
  };
}

export function noteToMidi(note: NoteName, octave: number): number {
  const index = NOTE_NAMES.indexOf(note);

  if (index === -1) {
    throw new Error(`Invalid note: ${note}`);
  }

  return (octave + 1) * 12 + index;
}

export function noteToFrequency(note: NoteName, octave: number): number {
  return midiToFrequency(noteToMidi(note, octave));
}

export function frequencyToPitch(frequency: number): Pitch {
  const midi = frequencyToMidi(frequency);
  const nearestMidi = Math.round(midi);
  const { note, octave } = midiToNote(midi);

  return {
    frequency,
    midi,
    note,
    octave,
    cents: (midi - nearestMidi) * 100,
  };
}

export function createPitch(note: NoteName, octave: number, cents = 0): Pitch {
  const midi = noteToMidi(note, octave) + cents / 100;

  return frequencyToPitch(midiToFrequency(midi));
}
