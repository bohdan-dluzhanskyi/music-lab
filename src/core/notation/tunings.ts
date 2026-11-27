import type { InstrumentTuning } from '@/core/types/notation.types';

export const INSTRUMENT_TUNINGS = {
  guitarStandard: {
    id: 'guitar-standard',
    name: 'Guitar — Standard',
    instrument: 'guitar',
    strings: [40, 45, 50, 55, 59, 64],
    maxFret: 24,
  },

  guitarDropD: {
    id: 'guitar-drop-d',
    name: 'Guitar — Drop D',
    instrument: 'guitar',
    strings: [38, 45, 50, 55, 59, 64],
    maxFret: 24,
  },

  guitarDADGAD: {
    id: 'guitar-dadgad',
    name: 'Guitar — DADGAD',
    instrument: 'guitar',
    strings: [38, 45, 50, 55, 57, 62],
    maxFret: 24,
  },

  bassStandard: {
    id: 'bass-standard',
    name: 'Bass — Standard',
    instrument: 'bass',
    strings: [28, 33, 38, 43],
    maxFret: 24,
  },

  bassFiveString: {
    id: 'bass-five-string',
    name: 'Bass — 5 Strings',
    instrument: 'bass',
    strings: [23, 28, 33, 38, 43],
    maxFret: 24,
  },

  ukuleleStandard: {
    id: 'ukulele-standard',
    name: 'Ukulele — High G',
    instrument: 'ukulele',
    strings: [67, 60, 64, 69],
    maxFret: 15,
  },
} as const satisfies Record<string, InstrumentTuning>;

export type TuningId = keyof typeof INSTRUMENT_TUNINGS;
