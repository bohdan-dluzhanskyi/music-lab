import type { MusicalKey } from '@/core/types/theory.types';

import { createScale, getScalePitchClasses, normalizePitchClass } from './scales';

export function createKey(rootMidi: number, type: 'major' | 'minor'): MusicalKey {
  return {
    rootMidi,
    type,
    scale: createScale(rootMidi, type),
    pitchClasses: getScalePitchClasses(rootMidi, type),
  };
}

export function isNoteInKey(midi: number, key: MusicalKey): boolean {
  return key.pitchClasses.includes(normalizePitchClass(midi));
}

export function getRelativeKey(key: MusicalKey): MusicalKey {
  const root = normalizePitchClass(key.rootMidi + (key.type === 'major' ? -3 : 3));

  const octaveBase = Math.floor(key.rootMidi / 12) * 12;

  return createKey(octaveBase + root, key.type === 'major' ? 'minor' : 'major');
}

export function getParallelKey(key: MusicalKey): MusicalKey {
  return createKey(key.rootMidi, key.type === 'major' ? 'minor' : 'major');
}
