import { describe, expect, it } from 'vitest';

import {
  createTrack,
  createComposition,
  createCompositionNote,
  getAudibleTracks,
  getCompositionLength,
  getScheduledNotes,
  snapBeat,
} from '@/core/composition/composition';

describe('Composition', () => {
  it('creates a default composition', () => {
    const composition = createComposition();

    expect(composition.tracks).toHaveLength(1);
    expect(composition.bpm).toBe(120);
    expect(composition.lengthBeats).toBe(16);
  });

  it('creates unique track identifiers', () => {
    expect(createTrack().id).not.toBe(createTrack().id);
  });

  it('preserves exact mathematical frequencies', () => {
    const note = createCompositionNote('track', 355.967478, 0);

    expect(note.pitch.frequency).toBe(355.967478);
  });

  it('preserves fractional MIDI values', () => {
    const note = createCompositionNote('track', 355.967478, 0);

    expect(note.pitch.midi).not.toBe(Math.round(note.pitch.midi));
  });

  it('rejects invalid frequencies', () => {
    expect(() => createCompositionNote('track', 0, 0)).toThrow();
  });

  it('rejects negative positions', () => {
    expect(() => createCompositionNote('track', 440, -1)).toThrow();
  });

  it('rejects zero duration', () => {
    expect(() => createCompositionNote('track', 440, 0, 0)).toThrow();
  });

  it('rejects invalid velocity', () => {
    expect(() => createCompositionNote('track', 440, 0, 1, 2)).toThrow();
  });

  it('extends the composition length', () => {
    const composition = createComposition();
    const track = composition.tracks[0]!;

    track.notes.push(createCompositionNote(track.id, 440, 20, 2));

    expect(getCompositionLength(composition)).toBe(22);
  });
});

describe('Track controls', () => {
  it('excludes muted tracks', () => {
    const first = createTrack();
    const second = createTrack(1);

    second.muted = true;

    expect(getAudibleTracks([first, second])).toEqual([first]);
  });

  it('supports solo tracks', () => {
    const first = createTrack();
    const second = createTrack(1);

    second.solo = true;

    expect(getAudibleTracks([first, second])).toEqual([second]);
  });

  it('gives mute priority over solo', () => {
    const track = createTrack();

    track.solo = true;
    track.muted = true;

    expect(getAudibleTracks([track])).toEqual([]);
  });
});

describe('Timeline grid', () => {
  it('snaps to eighth notes', () => {
    expect(snapBeat(1.3, 0.5)).toBe(1.5);
  });

  it('snaps to sixteenth notes', () => {
    expect(snapBeat(1.2, 0.25)).toBe(1.25);
  });

  it('rejects invalid grids', () => {
    expect(() => snapBeat(1, 0)).toThrow();
  });
});

describe('Audio scheduling', () => {
  it('sorts events by start beat', () => {
    const composition = createComposition();
    const track = composition.tracks[0]!;

    track.notes = [
      createCompositionNote(track.id, 440, 2),
      createCompositionNote(track.id, 220, 0),
    ];

    const events = getScheduledNotes(composition);

    expect(events[0]!.startBeat).toBe(0);
    expect(events[1]!.startBeat).toBe(2);
  });

  it('excludes muted events', () => {
    const composition = createComposition();
    const track = composition.tracks[0]!;

    track.muted = true;

    track.notes = [createCompositionNote(track.id, 440, 0)];

    expect(getScheduledNotes(composition)).toEqual([]);
  });

  it('clips notes when playback starts mid-note', () => {
    const composition = createComposition();
    const track = composition.tracks[0]!;

    track.notes = [createCompositionNote(track.id, 440, 0, 4)];

    const events = getScheduledNotes(composition, 2);

    expect(events[0]!.startBeat).toBe(2);
    expect(events[0]!.durationBeats).toBe(2);
  });

  it('clips notes at the playback boundary', () => {
    const composition = createComposition();
    const track = composition.tracks[0]!;

    track.notes = [createCompositionNote(track.id, 440, 0, 4)];

    const events = getScheduledNotes(composition, 0, 2);

    expect(events[0]!.durationBeats).toBe(2);
  });

  it('preserves microtonal frequencies', () => {
    const composition = createComposition();
    const track = composition.tracks[0]!;

    track.notes = [createCompositionNote(track.id, 355.967478, 0)];

    expect(getScheduledNotes(composition)[0]!.frequency).toBe(355.967478);
  });
});
