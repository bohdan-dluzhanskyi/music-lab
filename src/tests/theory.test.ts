import { describe, expect, it } from 'vitest';

import { createScale, isNoteInScale, getScaleDegreeMidi } from '../core/music/scales';

import { createChord, identifyChordType } from '../core/music/chords';

import { createKey, getRelativeKey, getParallelKey } from '../core/music/keys';

import { buildDiatonicHarmony } from '../core/music/harmony';

import { createProgression } from '../core/music/progressions';

import { transposeMidi, transposeFrequency } from '../core/music/transposition';

import { quantizeFrequency, blendFrequencies } from '../core/music/quantization';

import {
  CIRCLE_OF_FIFTHS,
  getDominant,
  getSubdominant,
  getCircleDistance,
} from '../core/music/circleOfFifths';

describe('Scales', () => {
  it('creates C major', () => {
    const scale = createScale(60, 'major');

    expect(scale.notes.map((note) => note.midi)).toEqual([60, 62, 64, 65, 67, 69, 71]);
  });

  it('creates A natural minor', () => {
    const scale = createScale(57, 'minor');

    expect(scale.notes.map((note) => note.midi)).toEqual([57, 59, 60, 62, 64, 65, 67]);
  });

  it('creates a pentatonic scale', () => {
    expect(createScale(60, 'majorPentatonic').notes).toHaveLength(5);
  });

  it('creates a chromatic scale', () => {
    expect(createScale(60, 'chromatic').notes).toHaveLength(12);
  });

  it('checks scale membership across octaves', () => {
    expect(isNoteInScale(72, 60, 'major')).toBe(true);
    expect(isNoteInScale(73, 60, 'major')).toBe(false);
  });

  it('extends scale degrees across octaves', () => {
    expect(getScaleDegreeMidi(60, 'major', 8)).toBe(72);
    expect(getScaleDegreeMidi(60, 'major', 9)).toBe(74);
  });
});

describe('Chords', () => {
  it('creates C major', () => {
    const chord = createChord(60, 'major');

    expect(chord.notes.map((note) => note.midi)).toEqual([60, 64, 67]);
  });

  it('creates A minor', () => {
    const chord = createChord(57, 'minor');

    expect(chord.notes.map((note) => note.midi)).toEqual([57, 60, 64]);
  });

  it('creates the first inversion', () => {
    const chord = createChord(60, 'major', 1);

    expect(chord.notes.map((note) => note.midi)).toEqual([64, 67, 72]);
  });

  it('creates the second inversion', () => {
    const chord = createChord(60, 'major', 2);

    expect(chord.notes.map((note) => note.midi)).toEqual([67, 72, 76]);
  });

  it('identifies chord types', () => {
    expect(identifyChordType([0, 4, 7])).toBe('major');
    expect(identifyChordType([0, 3, 7])).toBe('minor');
    expect(identifyChordType([0, 4, 7, 10])).toBe('dominant7');
  });

  it('rejects invalid inversions', () => {
    expect(() => createChord(60, 'major', 3)).toThrow();
  });
});

describe('Musical keys', () => {
  it('finds the relative minor', () => {
    const relative = getRelativeKey(createKey(60, 'major'));

    expect(relative.rootMidi % 12).toBe(9);
    expect(relative.type).toBe('minor');
  });

  it('finds the parallel minor', () => {
    const parallel = getParallelKey(createKey(60, 'major'));

    expect(parallel.rootMidi).toBe(60);
    expect(parallel.type).toBe('minor');
  });
});

describe('Diatonic harmony', () => {
  it('creates major scale triads', () => {
    const chords = buildDiatonicHarmony(60, 'major');

    expect(chords.map((chord) => chord.type)).toEqual([
      'major',
      'minor',
      'minor',
      'major',
      'major',
      'minor',
      'diminished',
    ]);
  });

  it('creates major scale seventh chords', () => {
    const chords = buildDiatonicHarmony(60, 'major', 4);

    expect(chords.map((chord) => chord.type)).toEqual([
      'major7',
      'minor7',
      'minor7',
      'major7',
      'dominant7',
      'minor7',
      'halfDiminished7',
    ]);
  });

  it('creates a dominant in harmonic minor', () => {
    const chords = buildDiatonicHarmony(57, 'harmonicMinor');

    expect(chords[4].type).toBe('major');
  });

  it('rejects non-heptatonic harmony', () => {
    expect(() => buildDiatonicHarmony(60, 'majorPentatonic')).toThrow();
  });
});

describe('Progressions', () => {
  it('creates a 1–5–6–4 progression', () => {
    const chords = createProgression(60, 'major', [1, 5, 6, 4]);

    expect(chords.map((chord) => chord.name)).toEqual(['C', 'G', 'Am', 'F']);
  });
});

describe('Transposition', () => {
  it('transposes MIDI notes', () => {
    expect(transposeMidi(60, 12)).toBe(72);
  });

  it('transposes frequency by an octave', () => {
    expect(transposeFrequency(440, 12)).toBeCloseTo(880);
  });

  it('supports fractional semitones', () => {
    expect(transposeFrequency(440, 0.5)).toBeCloseTo(452.892984, 5);
  });

  it('rejects out-of-range MIDI values', () => {
    expect(() => transposeMidi(127, 1)).toThrow();
  });
});

describe('Quantization', () => {
  it('preserves a valid scale note', () => {
    const result = quantizeFrequency(440, 60, 'major');

    expect(result.quantizedFrequency).toBeCloseTo(440);
  });

  it('quantizes the golden ratio frequency', () => {
    const frequency = 220 * ((1 + Math.sqrt(5)) / 2);

    const result = quantizeFrequency(frequency, 60, 'major');

    expect(result.midi).toBe(65);
    expect(result.quantizedFrequency).toBeCloseTo(349.228231);
  });

  it('preserves the original frequency at zero strength', () => {
    expect(blendFrequencies(440, 880, 0)).toBeCloseTo(440);
  });

  it('returns the target at full strength', () => {
    expect(blendFrequencies(440, 880, 1)).toBeCloseTo(880);
  });

  it('interpolates logarithmically', () => {
    expect(blendFrequencies(440, 880, 0.5)).toBeCloseTo(Math.sqrt(440 * 880));
  });

  it('supports a different reference frequency', () => {
    const result = quantizeFrequency(432, 60, 'major', 432);

    expect(result.quantizedFrequency).toBeCloseTo(432);
  });
});

describe('Circle of fifths', () => {
  it('contains all twelve pitch classes', () => {
    const classes = CIRCLE_OF_FIFTHS.map((item) => item.majorPitchClass);

    expect(new Set(classes).size).toBe(12);
  });

  it('finds the dominant', () => {
    expect(getDominant(0)).toBe(7);
  });

  it('finds the subdominant', () => {
    expect(getSubdominant(0)).toBe(5);
  });

  it('calculates circle distance', () => {
    expect(getCircleDistance(0, 7)).toBe(1);
    expect(getCircleDistance(0, 5)).toBe(1);
    expect(getCircleDistance(0, 6)).toBe(6);
  });
});
