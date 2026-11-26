import type { QuantizationResult, ScaleType } from '@/core/types/theory.types';

import { midiToFrequency } from './frequency';
import { isNoteInScale } from './scales';

export function quantizeFrequency(
  frequency: number,
  rootMidi: number,
  scaleType: ScaleType,
  referenceFrequency = 440,
): QuantizationResult {
  if (
    !Number.isFinite(frequency) ||
    frequency <= 0 ||
    !Number.isFinite(referenceFrequency) ||
    referenceFrequency <= 0
  ) {
    throw new RangeError('Invalid frequency');
  }

  const targetMidi = 69 + 12 * (Math.log2(frequency) - Math.log2(referenceFrequency));

  let nearestMidi = -1;
  let minimumDistance = Infinity;

  for (let midi = 0; midi <= 127; midi++) {
    if (!isNoteInScale(midi, rootMidi, scaleType)) {
      continue;
    }

    const distance = Math.abs(midi - targetMidi);

    if (distance < minimumDistance) {
      minimumDistance = distance;
      nearestMidi = midi;
    }
  }

  if (nearestMidi === -1) {
    throw new Error('No matching scale note');
  }

  const quantizedFrequency = midiToFrequency(nearestMidi) * (referenceFrequency / 440);

  return {
    originalFrequency: frequency,
    quantizedFrequency,
    midi: nearestMidi,

    centsDifference: 1200 * Math.log2(quantizedFrequency / frequency),

    frequencyRatio: quantizedFrequency / frequency,
  };
}

export function blendFrequencies(original: number, target: number, strength: number): number {
  if (
    !Number.isFinite(original) ||
    !Number.isFinite(target) ||
    original <= 0 ||
    target <= 0 ||
    !Number.isFinite(strength) ||
    strength < 0 ||
    strength > 1
  ) {
    throw new RangeError('Invalid frequency blend');
  }

  return 2 ** ((1 - strength) * Math.log2(original) + strength * Math.log2(target));
}
