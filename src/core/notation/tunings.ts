import type { InstrumentTuning } from '@/core/types/notation.types';

export const INSTRUMENT_TUNINGS = {
  guitarSevenString: {
    id: 'guitar-seven-string',
    name: 'Guitar — 7 Strings',
    instrument: 'guitar',
    strings: [35, 40, 45, 50, 55, 59, 64],
    maxFret: 24,
  },

  guitarOpenG: {
    id: 'guitar-open-g',
    name: 'Guitar — Open G',
    instrument: 'guitar',
    strings: [38, 43, 50, 55, 59, 62],
    maxFret: 24,
  },

  guitarOpenD: {
    id: 'guitar-open-d',
    name: 'Guitar — Open D',
    instrument: 'guitar',
    strings: [38, 45, 50, 54, 57, 62],
    maxFret: 24,
  },

  bassDropD: {
    id: 'bass-drop-d',
    name: 'Bass — Drop D',
    instrument: 'bass',
    strings: [26, 33, 38, 43],
    maxFret: 24,
  },

  bassSixString: {
    id: 'bass-six-string',
    name: 'Bass — 6 Strings',
    instrument: 'bass',
    strings: [23, 28, 33, 38, 43, 48],
    maxFret: 24,
  },
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
