import type { ChordType, DiatonicChord, ScaleType } from '@/core/types/theory.types';

import { createTheoryNote, getScaleDegreeMidi, SCALES } from './scales';

import { CHORD_SUFFIXES, identifyChordType } from './chords';

const ROMAN_NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

export function getRomanNumeral(degree: number, type: ChordType): string {
  const numeral = ROMAN_NUMERALS[degree - 1];

  switch (type) {
    case 'minor':
      return numeral.toLowerCase();

    case 'diminished':
      return `${numeral.toLowerCase()}°`;

    case 'augmented':
      return `${numeral}+`;

    case 'minor7':
      return `${numeral.toLowerCase()}7`;

    case 'major7':
      return `${numeral}maj7`;

    case 'dominant7':
      return `${numeral}7`;

    case 'diminished7':
      return `${numeral.toLowerCase()}°7`;

    case 'halfDiminished7':
      return `${numeral.toLowerCase()}ø7`;

    case 'minorMajor7':
      return `${numeral.toLowerCase()}(maj7)`;

    case 'augmentedMajor7':
      return `${numeral}+maj7`;

    default:
      return numeral;
  }
}

export function buildDiatonicChord(
  rootMidi: number,
  scaleType: ScaleType,
  degree: number,
  size: 3 | 4 = 3,
): DiatonicChord {
  if (SCALES[scaleType].intervals.length !== 7) {
    throw new RangeError('A seven-note scale is required');
  }

  if (!Number.isInteger(degree) || degree < 1 || degree > 7) {
    throw new RangeError('Invalid chord degree');
  }

  const midiNotes = Array.from({ length: size }, (_, index) =>
    getScaleDegreeMidi(rootMidi, scaleType, degree + index * 2),
  );

  const chordRoot = midiNotes[0];

  const intervals = midiNotes.map((midi) => midi - chordRoot);

  const type = identifyChordType(intervals);

  const notes = midiNotes.map(createTheoryNote);

  return {
    rootMidi: chordRoot,
    type,
    name: `${notes[0].note}${CHORD_SUFFIXES[type]}`,
    inversion: 0,
    notes,
    degree,
    romanNumeral: getRomanNumeral(degree, type),
  };
}

export function buildDiatonicHarmony(
  rootMidi: number,
  scaleType: ScaleType,
  size: 3 | 4 = 3,
): DiatonicChord[] {
  return Array.from({ length: 7 }, (_, index) =>
    buildDiatonicChord(rootMidi, scaleType, index + 1, size),
  );
}
