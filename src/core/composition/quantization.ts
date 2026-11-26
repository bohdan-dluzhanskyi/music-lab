import { frequencyToMidi, midiToFrequency } from '@/core/music/frequency';

export const QUANTIZATION_SCALES = {
  chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  harmonicMinor: [0, 2, 3, 5, 7, 8, 11],
  majorPentatonic: [0, 2, 4, 7, 9],
  minorPentatonic: [0, 3, 5, 7, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
} as const;

export type QuantizationScale = keyof typeof QUANTIZATION_SCALES;

export function quantizeMidi(midi: number, rootMidi: number, intervals: readonly number[]): number {
  if (
    !Number.isFinite(midi) ||
    !Number.isInteger(rootMidi) ||
    intervals.length === 0 ||
    intervals.some((interval) => !Number.isInteger(interval) || interval < 0 || interval > 11)
  ) {
    throw new RangeError('Invalid quantization parameters');
  }

  const octave = Math.floor((midi - rootMidi) / 12);

  const candidates = [-1, 0, 1].flatMap((offset) =>
    intervals.map((interval) => rootMidi + (octave + offset) * 12 + interval),
  );

  return candidates.reduce((closest, candidate) => {
    const distance = Math.abs(candidate - midi);
    const closestDistance = Math.abs(closest - midi);

    if (distance === closestDistance) {
      return Math.min(closest, candidate);
    }

    return distance < closestDistance ? candidate : closest;
  });
}

export function quantizeFrequency(
  frequency: number,
  rootMidi: number,
  scale: QuantizationScale,
): number {
  const midi = frequencyToMidi(frequency);

  const quantized = quantizeMidi(midi, rootMidi, QUANTIZATION_SCALES[scale]);

  return midiToFrequency(quantized);
}

export function quantizeSequence(
  frequencies: readonly number[],
  rootMidi: number,
  scale: QuantizationScale,
): number[] {
  return frequencies.map((frequency) => quantizeFrequency(frequency, rootMidi, scale));
}
