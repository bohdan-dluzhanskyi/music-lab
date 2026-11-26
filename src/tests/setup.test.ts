import { describe, expect, it } from 'vitest';

describe('Music Lab environment', () => {
  it('should calculate the golden ratio', () => {
    const phi = (1 + Math.sqrt(5)) / 2;

    expect(phi).toBeCloseTo(1.6180339887, 10);
  });

  it('should calculate an octave frequency', () => {
    const frequency = 440 * Math.pow(2, 12 / 12);

    expect(frequency).toBe(880);
  });
});
