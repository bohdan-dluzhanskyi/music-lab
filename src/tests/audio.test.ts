import { describe, expect, it } from 'vitest';

import { clampVolume, generatePartials, isAudioFrequency } from '../engines/audio/constants';

describe('Audio frequency validation', () => {
  it('accepts standard musical frequencies', () => {
    expect(isAudioFrequency(440)).toBe(true);
    expect(isAudioFrequency(261.625565)).toBe(true);
  });

  it('accepts frequency boundaries', () => {
    expect(isAudioFrequency(20)).toBe(true);
    expect(isAudioFrequency(20000)).toBe(true);
  });

  it('rejects invalid frequencies', () => {
    expect(isAudioFrequency(0)).toBe(false);
    expect(isAudioFrequency(-440)).toBe(false);
    expect(isAudioFrequency(NaN)).toBe(false);
    expect(isAudioFrequency(Infinity)).toBe(false);
  });

  it('rejects out-of-range frequencies', () => {
    expect(isAudioFrequency(19)).toBe(false);
    expect(isAudioFrequency(20001)).toBe(false);
  });
});

describe('Audio volume', () => {
  it('preserves valid volume', () => {
    expect(clampVolume(0.75)).toBe(0.75);
  });

  it('clamps volume to valid range', () => {
    expect(clampVolume(-1)).toBe(0);
    expect(clampVolume(2)).toBe(1);
  });

  it('handles invalid volume', () => {
    expect(clampVolume(NaN)).toBe(0);
    expect(clampVolume(Infinity)).toBe(0);
  });
});

describe('Additive synthesis', () => {
  it('generates the fundamental harmonic', () => {
    expect(generatePartials(1)).toEqual([1]);
  });

  it('generates inverse harmonic amplitudes', () => {
    expect(generatePartials(4)).toEqual([1, 1 / 2, 1 / 3, 1 / 4]);
  });

  it('supports 32 harmonics', () => {
    expect(generatePartials(32)).toHaveLength(32);
  });

  it('rejects invalid harmonic counts', () => {
    expect(() => generatePartials(0)).toThrow();
    expect(() => generatePartials(33)).toThrow();
    expect(() => generatePartials(1.5)).toThrow();
  });
});
