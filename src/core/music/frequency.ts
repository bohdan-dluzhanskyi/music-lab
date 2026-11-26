import { DEFAULT_TUNING } from './constants';
import type { Tuning } from '../types/music.types';

function validateFrequency(frequency: number): void {
  if (!Number.isFinite(frequency) || frequency <= 0) {
    throw new RangeError('Frequency must be a positive finite number');
  }
}

export function midiToFrequency(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12);
}

export function frequencyToMidi(frequency: number): number {
  validateFrequency(frequency);

  return 69 + 12 * Math.log2(frequency / 440);
}

export function stepToFrequency(step: number, tuning: Tuning = DEFAULT_TUNING): number {
  return tuning.referenceFrequency * 2 ** (step / tuning.divisionsPerOctave);
}

export function frequencyToStep(frequency: number, tuning: Tuning = DEFAULT_TUNING): number {
  validateFrequency(frequency);

  return tuning.divisionsPerOctave * Math.log2(frequency / tuning.referenceFrequency);
}

export function transposeFrequency(frequency: number, semitones: number): number {
  validateFrequency(frequency);

  return frequency * 2 ** (semitones / 12);
}

export function frequencyRatio(from: number, to: number): number {
  validateFrequency(from);
  validateFrequency(to);

  return to / from;
}

export function ratioToCents(ratio: number): number {
  validateFrequency(ratio);

  return 1200 * Math.log2(ratio);
}

export function centsToRatio(cents: number): number {
  return 2 ** (cents / 1200);
}
