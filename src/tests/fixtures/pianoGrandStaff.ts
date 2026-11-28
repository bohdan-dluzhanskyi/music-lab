import { createComposition, createTrack } from '@/core/composition/composition';
import { frequencyToPitch } from '@/core/music/notes';
import type { NoteEvent } from '@/core/types/music.types';

export function scoreNote(
  id: string,
  startBeat: number,
  durationBeats: number,
  frequency = 355.967478,
  trackId = 'piano',
): NoteEvent {
  return {
    id,
    pitch: frequencyToPitch(frequency),
    startBeat,
    durationBeats,
    trackId,
    velocity: 0.37,
  };
}

export function pianoFixture() {
  const notes = [
    scoreNote('bass', 0, 0.125, 130.81278265),
    scoreNote('treble', 0, 0.25, 440),
    scoreNote('fractional', 0.35, 0.3),
    scoreNote('tie', 3.75, 1.75, 440),
  ];
  const composition = {
    ...createComposition(),
    id: 'fixture',
    lengthBeats: 5.5,
    tracks: [
      { ...createTrack(), id: 'piano', notes, solo: true },
      {
        ...createTrack(1),
        id: 'bass',
        notes: [scoreNote('pedal', 0, 4, 110, 'bass')],
        muted: true,
      },
    ],
  };
  return { version: 1, state: { composition, selectedTrackId: 'piano' } };
}
