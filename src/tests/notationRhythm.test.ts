import { describe, expect, it } from 'vitest';
import { decomposeDuration, WRITTEN_RHYTHMS, TICKS_PER_BEAT } from '@/core/notation/rhythm';

describe('written rhythm arithmetic', () => {
  it('contains all 21 exact written values', () => {
    expect(TICKS_PER_BEAT).toBe(256);
    expect(WRITTEN_RHYTHMS.map((value) => value.ticks).sort((a, b) => a - b)).toEqual([
      16, 24, 28, 32, 48, 56, 64, 96, 112, 128, 192, 224, 256, 384, 448, 512, 768, 896, 1024, 1536,
      1792,
    ]);
  });

  it('recovers from the 76-tick greedy dead end', () => {
    expect(decomposeDuration(76 / 256)).toEqual([
      { duration: '32', beats: 48 / 256, dots: 1 },
      { duration: '64', beats: 28 / 256, dots: 2 },
    ]);
  });

  it('uses the fewest fragments and a deterministic token order', () => {
    expect(decomposeDuration(256 / 256)).toHaveLength(1);
    expect(decomposeDuration(104 / 256).map((value) => value.beats * 256)).toEqual([48, 56]);
    expect(() => decomposeDuration(12 / 256)).toThrow();
    expect(() => decomposeDuration(1e-10)).toThrow();
  });
});
