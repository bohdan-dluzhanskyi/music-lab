import type { Chord, ChordType } from '@/core/types/theory.types';

import { createTheoryNote } from './scales';

export const CHORD_INTERVALS: Record<Exclude<ChordType, 'unknown'>, readonly number[]> = {
  major: [0, 4, 7],
  minor: [0, 3, 7],
  diminished: [0, 3, 6],
  augmented: [0, 4, 8],
  sus2: [0, 2, 7],
  sus4: [0, 5, 7],

  major7: [0, 4, 7, 11],
  minor7: [0, 3, 7, 10],
  dominant7: [0, 4, 7, 10],
  diminished7: [0, 3, 6, 9],
  halfDiminished7: [0, 3, 6, 10],
  minorMajor7: [0, 3, 7, 11],
  augmentedMajor7: [0, 4, 8, 11],
};

export const CHORD_SUFFIXES: Record<ChordType, string> = {
  major: '',
  minor: 'm',
  diminished: 'dim',
  augmented: 'aug',
  sus2: 'sus2',
  sus4: 'sus4',
  major7: 'maj7',
  minor7: 'm7',
  dominant7: '7',
  diminished7: 'dim7',
  halfDiminished7: 'm7b5',
  minorMajor7: 'm(maj7)',
  augmentedMajor7: 'aug(maj7)',
  unknown: '?',
};

export function identifyChordType(intervals: readonly number[]): ChordType {
  const signature = intervals.join(',');

  const match = Object.entries(CHORD_INTERVALS).find(
    ([, pattern]) => pattern.join(',') === signature,
  );

  return match ? (match[0] as ChordType) : 'unknown';
}

export function invertChord(midiNotes: readonly number[], inversion: number): number[] {
  if (!Number.isInteger(inversion) || inversion < 0 || inversion >= midiNotes.length) {
    throw new RangeError('Invalid chord inversion');
  }

  const notes = [...midiNotes];

  for (let index = 0; index < inversion; index++) {
    const first = notes.shift();

    if (first !== undefined) {
      notes.push(first + 12);
    }
  }

  return notes;
}

export function createChord(
  rootMidi: number,
  type: Exclude<ChordType, 'unknown'>,
  inversion = 0,
): Chord {
  const root = createTheoryNote(rootMidi);

  const intervals = CHORD_INTERVALS[type];

  const midiNotes = invertChord(
    intervals.map((interval) => rootMidi + interval),
    inversion,
  );

  const notes = midiNotes.map(createTheoryNote);

  const name = `${root.note}${CHORD_SUFFIXES[type]}` + (inversion > 0 ? `/${notes[0].note}` : '');

  return {
    rootMidi,
    type,
    name,
    inversion,
    notes,
  };
}
