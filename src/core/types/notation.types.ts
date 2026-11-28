import type { NoteEvent } from './music.types';

export type NotationMode = 'standard' | 'tablature' | 'both' | 'piano';

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

export type ScoreInterval = readonly [start: number, end: number];
export type WrittenDots = 0 | 1 | 2;

export interface WrittenEvent {
  id: string;
  voiceId: number;
  measureIndex: number;
  startTick: number;
  durationTicks: number;
  baseDuration: NotationDuration;
  dots: WrittenDots;
  sourceNoteIds: readonly string[];
}

export interface Voice<T extends WrittenEvent = WrittenEvent> {
  id: number;
  segments: readonly T[];
}

export interface Measure<T extends WrittenEvent = WrittenEvent> {
  index: number;
  sourceInterval: ScoreInterval;
  playableInterval: ScoreInterval;
  writtenRange: ScoreInterval;
  voices: readonly Voice<T>[];
  writtenPlaybackCutoff: number | null;
  visualTail: ScoreInterval | null;
}

export interface OnsetGroup {
  sourceOnsetBeat: number;
  sourceNoteIds: readonly string[];
  writtenOnsetTick: number;
}

export interface WrittenContinuity {
  sourceNoteId: string;
  fragmentEndpoints: readonly [fromId: string, toId: string];
}

export interface TimingDeviation {
  sourceNoteId: string;
  sourceTiming: { startBeat: number; durationBeats: number };
  writtenTiming: { startBeat: number; durationBeats: number };
  deviations: { onsetBeats: number; durationBeats: number };
}

export type PreparationClass = 'exact' | 'optimal' | 'bounded' | 'partial';

export type PreparationLimit = 'budget-exhausted' | 'infeasible' | 'uncertified' | 'display-limit';

export interface CertificationEvidence {
  certified: boolean;
  reason?: PreparationLimit;
}

export interface Diagnostic {
  code:
    | 'timing-approximation'
    | 'omitted-event'
    | 'display-limit'
    | 'piano-range'
    | 'invalid-staff-voice';
  scope: { sourceNoteIds: readonly string[]; measureIndex?: number; voiceId?: number };
  message: string;
  reason?: PreparationLimit;
  timing?: TimingDeviation;
}

export interface PreparationResult<T> {
  classification: PreparationClass;
  certificationEvidence: CertificationEvidence;
  localResults: readonly {
    measureIndex: number;
    classification: PreparationClass;
    certificationEvidence: CertificationEvidence;
  }[];
  measures: readonly T[];
  diagnostics: readonly Diagnostic[];
  continuities: readonly WrittenContinuity[];
  onsetGroups: readonly OnsetGroup[];
}

export interface SearchState<T, Candidate = unknown> {
  readonly frontier: readonly number[];
  readonly bestCandidate: Candidate | null;
  readonly position: number;
  readonly remainingBudgets: number;
  readonly certificationEvidence: CertificationEvidence;
  readonly orderingState: readonly number[];
  readonly work: Iterator<void, T>;
}

export type SearchStep<T, Candidate = unknown> =
  { status: 'pending'; state: SearchState<T, Candidate> } | { status: 'complete'; result: T };
