import { describe, expect, it } from 'vitest';

import {
  midiToFrequency,
  frequencyToMidi,
  transposeFrequency,
  ratioToCents,
  centsToRatio,
} from '../core/music/frequency';

import { noteToMidi, noteToFrequency, frequencyToPitch } from '../core/music/notes';

import { getInterval } from '../core/music/intervals';

import { PHI, GOLDEN_ANGLE } from '../core/mathematics/constants';

import { normalizeDegrees } from '../core/mathematics/angles';

import { fibonacci } from '../core/mathematics/fibonacci';

import {
  frequencyToAngle,
  angleToFrequency,
  frequencyToClockAngle,
} from '../core/geometry/noteClock';

import {
  musicalSpiralRadius,
  goldenSpiralRadius,
  spiralIntersectionRatio,
} from '../core/geometry/spiral';

import { generateHarmonics } from '../core/music/harmonics';

describe('Frequency', () => {
  it('converts MIDI to frequency', () => {
    expect(midiToFrequency(69)).toBe(440);
    expect(midiToFrequency(81)).toBe(880);
  });

  it('converts frequency to MIDI', () => {
    expect(frequencyToMidi(440)).toBe(69);
  });

  it('preserves microtonal frequencies', () => {
    const frequency = 447.5;

    expect(midiToFrequency(frequencyToMidi(frequency))).toBeCloseTo(frequency, 10);
  });

  it('transposes an octave', () => {
    expect(transposeFrequency(440, 12)).toBe(880);
  });

  it('converts ratios and cents', () => {
    expect(ratioToCents(2)).toBe(1200);
    expect(centsToRatio(1200)).toBe(2);
  });

  it('rejects invalid frequencies', () => {
    expect(() => frequencyToMidi(0)).toThrow();
  });
});

describe('Notes', () => {
  it('converts notes to MIDI', () => {
    expect(noteToMidi('A', 4)).toBe(69);
    expect(noteToMidi('C', 4)).toBe(60);
  });

  it('converts notes to frequency', () => {
    expect(noteToFrequency('A', 4)).toBe(440);
  });

  it('converts frequency to pitch', () => {
    expect(frequencyToPitch(440)).toEqual({
      frequency: 440,
      midi: 69,
      note: 'A',
      octave: 4,
      cents: 0,
    });
  });
});

describe('Intervals', () => {
  it('calculates an octave interval', () => {
    expect(getInterval(440, 880)).toEqual({
      ratio: 2,
      cents: 1200,
      semitones: 12,
    });
  });
});

describe('Mathematics', () => {
  it('calculates the golden ratio', () => {
    expect(PHI).toBeCloseTo(1.6180339887, 10);
  });

  it('calculates the golden angle', () => {
    expect(GOLDEN_ANGLE).toBeCloseTo(137.507764, 6);
  });

  it('normalizes angles', () => {
    expect(normalizeDegrees(390)).toBe(30);
    expect(normalizeDegrees(-30)).toBe(330);
  });

  it('generates Fibonacci numbers', () => {
    expect(fibonacci(10)).toEqual([0, 1, 1, 2, 3, 5, 8, 13, 21, 34]);
  });
});

describe('Note clock', () => {
  it('maps an octave to a full rotation', () => {
    expect(frequencyToAngle(880)).toBe(360);
  });

  it('maps angles to frequencies', () => {
    expect(angleToFrequency(360)).toBe(880);
    expect(angleToFrequency(-360)).toBe(220);
  });

  it('normalizes clock positions', () => {
    expect(frequencyToClockAngle(880)).toBe(0);
  });
});

describe('Spirals', () => {
  it('doubles musical radius per rotation', () => {
    expect(musicalSpiralRadius(2 * Math.PI)).toBe(2);
  });

  it('increases golden radius by phi per quarter turn', () => {
    expect(goldenSpiralRadius(Math.PI / 2)).toBeCloseTo(PHI, 10);
  });

  it('calculates a geometric spiral intersection', () => {
    const ratio = spiralIntersectionRatio();
    const theta = 2 * Math.PI * Math.log2(ratio);

    expect(musicalSpiralRadius(theta)).toBeCloseTo(goldenSpiralRadius(theta - 2 * Math.PI), 10);
  });
});

describe('Harmonics', () => {
  it('generates a harmonic series', () => {
    const harmonics = generateHarmonics(110, 4);

    expect(harmonics.map((h) => h.frequency)).toEqual([110, 220, 330, 440]);
  });
});
