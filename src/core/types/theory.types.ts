export type ScaleType =
  | 'major'
  | 'minor'
  | 'dorian'
  | 'phrygian'
  | 'lydian'
  | 'mixolydian'
  | 'locrian'
  | 'harmonicMinor'
  | 'melodicMinor'
  | 'majorPentatonic'
  | 'minorPentatonic'
  | 'chromatic';

export type ChordType =
  | 'major'
  | 'minor'
  | 'diminished'
  | 'augmented'
  | 'sus2'
  | 'sus4'
  | 'major7'
  | 'minor7'
  | 'dominant7'
  | 'diminished7'
  | 'halfDiminished7'
  | 'minorMajor7'
  | 'augmentedMajor7'
  | 'unknown';

export interface ScaleDefinition {
  name: string;
  intervals: readonly number[];
}

export interface TheoryNote {
  midi: number;
  note: string;
  octave: number;
  frequency: number;
  pitchClass: number;
}

export interface Scale {
  rootMidi: number;
  type: ScaleType;
  name: string;
  notes: TheoryNote[];
}

export interface Chord {
  rootMidi: number;
  type: ChordType;
  name: string;
  inversion: number;
  notes: TheoryNote[];
}

export interface MusicalKey {
  rootMidi: number;
  type: 'major' | 'minor';
  scale: Scale;
  pitchClasses: number[];
}

export interface DiatonicChord extends Chord {
  degree: number;
  romanNumeral: string;
}

export interface QuantizationResult {
  originalFrequency: number;
  quantizedFrequency: number;
  midi: number;
  centsDifference: number;
  frequencyRatio: number;
}

export interface ProgressionDefinition {
  name: string;
  degrees: readonly number[];
}
