import { describe, expect, it } from 'vitest';

import { getChordGeometry } from '@/core/geometry/chordGeometry';
import { generateAngleSequence } from '@/core/geometry/angleSequence';
import { generateLissajous } from '@/core/geometry/lissajous';

import { GOLDEN_ANGLE, PHI } from '@/core/mathematics/constants';

describe('Chord geometry', () => {
  it('maps A4 to the top of the clock', () => {
    const [point] = getChordGeometry([440]);

    expect(point!.angle).toBeCloseTo(0);
    expect(point!.x).toBeCloseTo(0);
    expect(point!.y).toBeCloseTo(-1);
  });

  it('maps octaves to the same position', () => {
    const [first, second] = getChordGeometry([440, 880]);

    expect(first!.angle).toBeCloseTo(second!.angle);
    expect(first!.x).toBeCloseTo(second!.x);
    expect(first!.y).toBeCloseTo(second!.y);
  });

  it('preserves the number of frequencies', () => {
    expect(getChordGeometry([440, 550, 660])).toHaveLength(3);
  });
});

describe('Angle sequence', () => {
  it('starts at the reference frequency', () => {
    const sequence = generateAngleSequence(440, 30, 12);

    expect(sequence[0]!.frequency).toBeCloseTo(440);
  });

  it('generates an octave at 360 degrees', () => {
    const sequence = generateAngleSequence(440, 360, 2, false);

    expect(sequence[1]!.frequency).toBeCloseTo(880);
  });

  it('folds octaves when enabled', () => {
    const sequence = generateAngleSequence(440, 360, 2, true);

    expect(sequence[1]!.frequency).toBeCloseTo(440);
  });

  it('generates equal-tempered semitones at 30 degrees', () => {
    const sequence = generateAngleSequence(440, 30, 2);

    expect(sequence[1]!.frequency).toBeCloseTo(440 * 2 ** (1 / 12));
  });

  it('supports the golden angle', () => {
    const sequence = generateAngleSequence(440, GOLDEN_ANGLE, 12);

    expect(sequence).toHaveLength(12);

    expect(sequence[1]!.clockAngle).toBeCloseTo(GOLDEN_ANGLE);
  });

  it('rejects invalid frequencies', () => {
    expect(() => generateAngleSequence(0, 30, 12)).toThrow();
  });

  it('rejects invalid sequence lengths', () => {
    expect(() => generateAngleSequence(440, 30, 0)).toThrow();
  });
});

describe('Lissajous geometry', () => {
  it('generates the requested number of points', () => {
    expect(generateLissajous(1, 2, 0, 100)).toHaveLength(100);
  });

  it('closes an integer-ratio trajectory', () => {
    const points = generateLissajous(2, 3);

    const first = points[0]!;
    const last = points[points.length - 1]!;

    expect(first.x).toBeCloseTo(last.x);
    expect(first.y).toBeCloseTo(last.y);
  });

  it('does not close a golden-ratio trajectory after one cycle', () => {
    const points = generateLissajous(1, PHI);

    const first = points[0]!;
    const last = points[points.length - 1]!;

    expect(Math.hypot(first.x - last.x, first.y - last.y)).toBeGreaterThan(0.01);
  });

  it('rejects invalid ratios', () => {
    expect(() => generateLissajous(0, 2)).toThrow();
  });
});
