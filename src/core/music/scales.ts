import type { Scale, ScaleDefinition, ScaleType, TheoryNote } from '@/core/types/theory.types';

import { midiToFrequency } from './frequency';
import { midiToNote } from './notes';

export const SCALES: Record<ScaleType, ScaleDefinition> = {
  major: {
    name: 'Major / Ionian',
    intervals: [0, 2, 4, 5, 7, 9, 11],
  },

  minor: {
    name: 'Natural Minor / Aeolian',
    intervals: [0, 2, 3, 5, 7, 8, 10],
  },

  dorian: {
    name: 'Dorian',
    intervals: [0, 2, 3, 5, 7, 9, 10],
  },

  phrygian: {
    name: 'Phrygian',
    intervals: [0, 1, 3, 5, 7, 8, 10],
  },

  lydian: {
    name: 'Lydian',
    intervals: [0, 2, 4, 6, 7, 9, 11],
  },

  mixolydian: {
    name: 'Mixolydian',
    intervals: [0, 2, 4, 5, 7, 9, 10],
  },

  locrian: {
    name: 'Locrian',
    intervals: [0, 1, 3, 5, 6, 8, 10],
  },

  harmonicMinor: {
    name: 'Harmonic Minor',
    intervals: [0, 2, 3, 5, 7, 8, 11],
  },

  melodicMinor: {
    name: 'Melodic Minor (ascending)',
    intervals: [0, 2, 3, 5, 7, 9, 11],
  },

  majorPentatonic: {
    name: 'Major Pentatonic',
    intervals: [0, 2, 4, 7, 9],
  },

  minorPentatonic: {
    name: 'Minor Pentatonic',
    intervals: [0, 3, 5, 7, 10],
  },

  chromatic: {
    name: 'Chromatic',
    intervals: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  },
};

export function normalizePitchClass(value: number): number {
  return ((value % 12) + 12) % 12;
}

export function createTheoryNote(midi: number): TheoryNote {
  if (!Number.isInteger(midi) || midi < 0 || midi > 127) {
    throw new RangeError('Invalid MIDI note');
  }

  const { note, octave } = midiToNote(midi);

  return {
    midi,
    note,
    octave,
    frequency: midiToFrequency(midi),
    pitchClass: normalizePitchClass(midi),
  };
}

export function createScale(rootMidi: number, type: ScaleType): Scale {
  const definition = SCALES[type];

  if (!definition) {
    throw new RangeError('Unknown scale type');
  }

  const root = createTheoryNote(rootMidi);

  return {
    rootMidi,
    type,
    name: `${root.note} ${definition.name}`,
    notes: definition.intervals.map((interval) => createTheoryNote(rootMidi + interval)),
  };
}

export function getScalePitchClasses(rootMidi: number, type: ScaleType): number[] {
  return SCALES[type].intervals.map((interval) => normalizePitchClass(rootMidi + interval));
}

export function isNoteInScale(midi: number, rootMidi: number, type: ScaleType): boolean {
  return getScalePitchClasses(rootMidi, type).includes(normalizePitchClass(midi));
}

export function getScaleDegreeMidi(rootMidi: number, type: ScaleType, degree: number): number {
  if (!Number.isInteger(degree) || degree < 1) {
    throw new RangeError('Invalid scale degree');
  }

  const intervals = SCALES[type].intervals;
  const index = degree - 1;

  const octaveOffset = Math.floor(index / intervals.length);

  return rootMidi + intervals[index % intervals.length] + octaveOffset * 12;
}
