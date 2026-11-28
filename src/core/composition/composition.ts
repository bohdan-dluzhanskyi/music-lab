import type { Composition, Track, ScheduledNote } from '@/core/types/composition.types';

import type { NoteEvent } from '@/core/types/music.types';

import { frequencyToPitch } from '@/core/music/notes';

const TRACK_COLORS = ['#91a894', '#8299b4', '#b8a47d', '#a397b6', '#b48787', '#80a9a5'];

export function createTrack(index = 0): Track {
  return {
    id: crypto.randomUUID(),
    name: `Track ${index + 1}`,
    color: TRACK_COLORS[index % TRACK_COLORS.length]!,
    instrumentId: 'synth',
    volume: 0.75,
    muted: false,
    solo: false,
    synth: {
      waveform: 'sine',
      mode: 'oscillator',
      harmonicCount: 8,
      envelope: {
        attack: 0.02,
        decay: 0.2,
        sustain: 0.6,
        release: 0.3,
      },
    },
    notes: [],
  };
}

export function createComposition(): Composition {
  return {
    id: crypto.randomUUID(),
    name: 'Untitled Composition',
    version: 1,
    bpm: 120,
    timeSignature: [4, 4],
    lengthBeats: 16,
    tracks: [createTrack()],
  };
}

export function createCompositionNote(
  trackId: string,
  frequency: number,
  startBeat: number,
  durationBeats = 0.5,
  velocity = 0.7,
): NoteEvent {
  if (
    !Number.isFinite(frequency) ||
    frequency < 20 ||
    frequency > 20000 ||
    !Number.isFinite(startBeat) ||
    startBeat < 0 ||
    !Number.isFinite(durationBeats) ||
    durationBeats <= 0 ||
    !Number.isFinite(velocity) ||
    velocity < 0 ||
    velocity > 1
  ) {
    throw new RangeError('Invalid note parameters');
  }

  return {
    id: crypto.randomUUID(),
    trackId,
    pitch: frequencyToPitch(frequency),
    startBeat,
    durationBeats,
    velocity,
  };
}

export function getAudibleTracks(tracks: readonly Track[]): Track[] {
  const hasSolo = tracks.some((track) => track.solo);

  return tracks.filter((track) => !track.muted && (!hasSolo || track.solo));
}

export function getCompositionLength(composition: Composition): number {
  return Math.max(
    composition.lengthBeats,
    ...composition.tracks.flatMap((track) =>
      track.notes.map((note) => note.startBeat + note.durationBeats),
    ),
  );
}

export function snapBeat(beat: number, grid: number): number {
  if (!Number.isFinite(beat) || !Number.isFinite(grid) || grid <= 0) {
    throw new RangeError('Invalid grid');
  }

  return Math.max(0, Math.round(beat / grid) * grid);
}

export function getScheduledNotes(
  composition: Composition,
  fromBeat = 0,
  toBeat = getCompositionLength(composition),
): ScheduledNote[] {
  if (fromBeat >= toBeat) return [];

  return getAudibleTracks(composition.tracks)
    .flatMap((track) =>
      track.notes
        .filter((note) => note.startBeat < toBeat && note.startBeat + note.durationBeats > fromBeat)
        .map((note) => {
          const startBeat = Math.max(fromBeat, note.startBeat);

          const endBeat = Math.min(toBeat, note.startBeat + note.durationBeats);

          return {
            sourceNoteId: note.id,
            trackId: note.trackId,
            frequency: note.pitch.frequency,
            startBeat,
            durationBeats: endBeat - startBeat,
            velocity: note.velocity,
          };
        }),
    )
    .sort((a, b) => a.startBeat - b.startBeat);
}
