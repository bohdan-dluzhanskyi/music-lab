import type { NoteEvent } from '@/core/types/music.types';

export interface NoteGroup {
  startBeat: number;
  durationBeats: number;
  notes: NoteEvent[];
}

// Keep large source-ordering passes resumable alongside the placement search.
export function* orderNotationItems<T>(
  items: Iterable<T>,
  compare: (a: T, b: T) => number,
): Generator<void, T[]> {
  let sorted: T[] = [];
  for (const item of items) {
    sorted.push(item);
    yield;
  }

  for (let run = 1; run < sorted.length; run *= 2) {
    const next: T[] = [];
    for (let start = 0; start < sorted.length; start += 2 * run) {
      const middle = Math.min(start + run, sorted.length);
      const end = Math.min(middle + run, sorted.length);
      let left = start;
      let right = middle;

      while (left < middle || right < end) {
        if (right === end || (left < middle && compare(sorted[left]!, sorted[right]!) <= 0)) {
          next.push(sorted[left++]!);
        } else {
          next.push(sorted[right++]!);
        }
        yield;
      }
    }
    sorted = next;
  }
  return sorted;
}

function* groupNotes(notes: readonly NoteEvent[]): Generator<void, NoteGroup[]> {
  const groups = new Map<string, NoteGroup>();
  const ordered = yield* orderNotationItems(
    notes,
    (a, b) =>
      a.startBeat - b.startBeat ||
      a.durationBeats - b.durationBeats ||
      (a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
  );

  for (const note of ordered) {
    const key = `${note.startBeat}:${note.durationBeats}`;
    const existing = groups.get(key);
    if (existing) existing.notes.push(note);
    else
      groups.set(key, {
        startBeat: note.startBeat,
        durationBeats: note.durationBeats,
        notes: [note],
      });
    yield;
  }

  return [...groups.values()];
}

export function* assignNotationVoices(notes: readonly NoteEvent[]): Generator<void, NoteGroup[][]> {
  const groups = yield* groupNotes(notes);
  const voices: NoteGroup[][] = [];

  for (const group of groups) {
    let index = 0;
    for (const voice of voices) {
      yield;
      const last = voice.at(-1)!;
      if (last.startBeat + last.durationBeats <= group.startBeat) break;
      index++;
    }
    if (index === voices.length) voices.push([]);
    voices[index]!.push(group);
    yield;
  }

  return voices;
}

function complete<T>(work: Generator<void, T>): T {
  let step = work.next();
  while (!step.done) step = work.next();
  return step.value;
}

export function groupSimultaneousNotes(notes: readonly NoteEvent[]): NoteGroup[] {
  return complete(groupNotes(notes));
}

export function splitIntoVoices(notes: readonly NoteEvent[]): NoteGroup[][] {
  return complete(assignNotationVoices(notes));
}
