import { describe, expect, it } from 'vitest';

import {
  generateFrequencies,
  foldFrequency,
  type GeneratorType,
} from '@/core/composition/generators';

import { quantizeMidi, quantizeFrequency } from '@/core/composition/quantization';

import { blendFrequencies, blendSequences } from '@/core/composition/hybrid';

import { generateEuclideanRhythm } from '@/core/composition/rhythm';

import { createNoteSequence, beatsToSeconds } from '@/core/composition/sequence';

import { PHI } from '@/core/mathematics/constants';

describe('Mathematical generators', () => {
  it('generates Fibonacci frequencies', () => {
    expect(
      generateFrequencies({
        type: 'fibonacci',
        reference: 110,
        count: 5,
        foldOctaves: false,
      }),
    ).toEqual([110, 110, 220, 330, 550]);
  });

  it('generates golden ratio frequencies', () => {
    const result = generateFrequencies({
      type: 'golden-ratio',
      reference: 220,
      count: 3,
      foldOctaves: false,
    });

    expect(result[1]).toBeCloseTo(220 * PHI);
    expect(result[2]).toBeCloseTo(220 * PHI ** 2);
  });

  it('generates harmonic frequencies', () => {
    expect(
      generateFrequencies({
        type: 'harmonics',
        reference: 110,
        count: 4,
        foldOctaves: false,
      }),
    ).toEqual([110, 220, 330, 440]);
  });

  it('folds frequencies into one octave', () => {
    expect(foldFrequency(880, 220)).toBeCloseTo(220);
    expect(foldFrequency(110, 220)).toBeCloseTo(220);
  });

  const types: GeneratorType[] = [
    'fibonacci',
    'golden-ratio',
    'golden-angle',
    'spiral-intersections',
    'sine',
    'harmonics',
    'logistic',
  ];

  it.each(types)('generates valid frequencies using %s', (type) => {
    const result = generateFrequencies({
      type,
      reference: 220,
      count: 16,
    });

    expect(result).toHaveLength(16);

    expect(result.every((frequency) => frequency >= 220 && frequency < 440)).toBe(true);
  });

  it('rejects invalid references', () => {
    expect(() =>
      generateFrequencies({
        type: 'sine',
        reference: 0,
        count: 16,
      }),
    ).toThrow();
  });
});

describe('Quantization', () => {
  it('quantizes to the nearest scale note', () => {
    expect(quantizeMidi(61.8, 60, [0, 2, 4, 5, 7, 9, 11])).toBe(62);
  });

  it('preserves A4 in A minor', () => {
    expect(quantizeFrequency(440, 69, 'minor')).toBeCloseTo(440);
  });

  it('supports notes across octave boundaries', () => {
    expect(quantizeMidi(71.9, 60, [0, 2, 4, 5, 7, 9, 11])).toBe(72);
  });
});

describe('Hybrid composition', () => {
  it('preserves the classical sequence at zero weight', () => {
    expect(blendFrequencies(220, 440, 0)).toBe(220);
  });

  it('preserves mathematics at full weight', () => {
    expect(blendFrequencies(220, 440, 1)).toBe(440);
  });

  it('uses logarithmic interpolation', () => {
    expect(blendFrequencies(220, 440, 0.5)).toBeCloseTo(Math.sqrt(220 * 440));
  });

  it('rejects mismatched sequence lengths', () => {
    expect(() => blendSequences([220], [220, 440], 0.5)).toThrow();
  });
});

describe('Euclidean rhythm', () => {
  it('generates the requested number of steps', () => {
    expect(generateEuclideanRhythm(16, 5)).toHaveLength(16);
  });

  it('preserves the number of pulses', () => {
    expect(generateEuclideanRhythm(16, 5).filter(Boolean)).toHaveLength(5);
  });

  it('supports silent rhythms', () => {
    expect(generateEuclideanRhythm(8, 0).every((pulse) => !pulse)).toBe(true);
  });

  it('preserves pulses after rotation', () => {
    expect(generateEuclideanRhythm(16, 5, 3).filter(Boolean)).toHaveLength(5);
  });
});

describe('Note sequences', () => {
  it('converts frequencies into note events', () => {
    const notes = createNoteSequence([440, 880]);

    expect(notes).toHaveLength(2);
    expect(notes[0]!.pitch.note).toBe('A');
    expect(notes[0]!.pitch.octave).toBe(4);
    expect(notes[1]!.startBeat).toBe(0.5);
  });

  it('preserves rests in the timeline', () => {
    const notes = createNoteSequence([440, 550, 660], { rhythm: [true, false, true] });

    expect(notes).toHaveLength(2);
    expect(notes[1]!.startBeat).toBe(1);
  });

  it('converts beats into seconds', () => {
    expect(beatsToSeconds(1, 120)).toBeCloseTo(0.5);
  });
});
