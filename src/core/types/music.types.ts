export type NoteName = 'C' | 'C#' | 'D' | 'D#' | 'E' | 'F' | 'F#' | 'G' | 'G#' | 'A' | 'A#' | 'B';

export interface Pitch {
  frequency: number;
  midi: number;
  note: NoteName;
  octave: number;
  cents: number;
}

export interface Tuning {
  referenceFrequency: number;
  referenceMidi: number;
  divisionsPerOctave: number;
}

export interface MusicalInterval {
  semitones: number;
  cents: number;
  ratio: number;
}

export interface NoteEvent {
  id: string;
  pitch: Pitch;
  startBeat: number;
  durationBeats: number;
  velocity: number;
  trackId: string;
}

export interface Point2D {
  x: number;
  y: number;
}
