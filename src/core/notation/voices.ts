import type { NoteEvent } from '@/core/types/music.types';

export interface NoteGroup {
  startBeat: number;
  durationBeats: number;
  notes: NoteEvent[];
}

export function groupSimultaneousNotes(notes: readonly NoteEvent[]): NoteGroup[] {
  const groups = new Map<string, NoteGroup>();

  for (const note of notes) {
    const key = `${note.startBeat}:${note.durationBeats}`;
    const existing = groups.get(key);

    if (existing) {
      existing.notes.push(note);
      continue;
    }

    groups.set(key, {
      startBeat: note.startBeat,
      durationBeats: note.durationBeats,
      notes: [note],
    });
  }

  return [...groups.values()].sort((a, b) => a.startBeat - b.startBeat);
}

export function splitIntoVoices(notes: readonly NoteEvent[]): NoteGroup[][] {
  const groups = groupSimultaneousNotes(notes);
  const voices: NoteGroup[][] = [];

  for (const group of groups) {
    const available = voices.find((voice) => {
      const last = voice.at(-1);

      return !last || last.startBeat + last.durationBeats <= group.startBeat + 1e-8;
    });

    if (available) {
      available.push(group);
    } else {
      voices.push([group]);
    }
  }

  return voices;
}
