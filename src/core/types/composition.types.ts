import type { NoteEvent } from './music.types';
import type { SynthSettings } from './audio.types';

export interface Track {
  id: string;
  name: string;
  color: string;
  instrumentId: string;
  volume: number;
  muted: boolean;
  solo: boolean;
  synth: SynthSettings;
  notes: NoteEvent[];
}

export interface Composition {
  id: string;
  name: string;
  version: 1;
  bpm: number;
  timeSignature: [number, number];
  lengthBeats: number;
  tracks: Track[];
}

export type PlaybackStatus = 'stopped' | 'initializing' | 'playing' | 'paused';

export interface LoopRegion {
  enabled: boolean;
  startBeat: number;
  endBeat: number;
}

export interface ScheduledNote {
  sourceNoteId: string;
  trackId: string;
  frequency: number;
  startBeat: number;
  durationBeats: number;
  velocity: number;
}
