import { normalizePitchClass } from './scales';

const MAJOR_LABELS = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F'];

const MINOR_LABELS = ['Am', 'Em', 'Bm', 'F#m', 'C#m', 'G#m', 'D#m', 'Bbm', 'Fm', 'Cm', 'Gm', 'Dm'];

export const CIRCLE_OF_FIFTHS = Array.from({ length: 12 }, (_, index) => {
  const majorPitchClass = (index * 7) % 12;

  return {
    index,
    major: MAJOR_LABELS[index],
    minor: MINOR_LABELS[index],
    majorPitchClass,
    minorPitchClass: normalizePitchClass(majorPitchClass - 3),
    angle: index * 30,
  };
});

export function getDominant(pitchClass: number): number {
  return normalizePitchClass(pitchClass + 7);
}

export function getSubdominant(pitchClass: number): number {
  return normalizePitchClass(pitchClass + 5);
}

export function getCircleDistance(first: number, second: number): number {
  const firstIndex = normalizePitchClass(first * 7);
  const secondIndex = normalizePitchClass(second * 7);

  const distance = Math.abs(firstIndex - secondIndex);

  return Math.min(distance, 12 - distance);
}
