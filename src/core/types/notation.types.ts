import type { NoteEvent } from './music.types';

export type NotationMode = 'standard' | 'tablature' | 'both';

export type Clef = 'treble' | 'bass' | 'alto' | 'tenor';

export type StringInstrument = 'guitar' | 'bass' | 'ukulele' | 'violin' | 'viola' | 'cello';

export type NotationDuration = 'w' | 'h' | 'q' | '8' | '16' | '32' | '64';

export interface InstrumentTuning {
  id: string;
  name: string;
  instrument: StringInstrument;
  strings: readonly number[];
  maxFret: number;
}

export interface FretPosition {
  string: number;
  fret: number;
  midi: number;
}

export interface TablatureNote {
  note: NoteEvent;
  position: FretPosition | null;
}

export interface ScoreMeasure {
  index: number;
  startBeat: number;
  endBeat: number;
  notes: NoteEvent[];
}

export interface NotationPitch {
  key: string;
  midi: number;
  cents: number;
  frequency: number;
  accidental: '#' | 'b' | null;
}
