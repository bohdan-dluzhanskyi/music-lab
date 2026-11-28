import { midiToFrequency } from '@/core/music/frequency';
import type { Diagnostic, Measure, Voice } from '@/core/types/notation.types';
import type { PreparedScore, ScoreEvent } from './score';
import { decomposeDuration, TICKS_PER_BEAT, WRITTEN_RHYTHMS } from './rhythm';

export const DEFAULT_PIANO_SPLIT = 60;
const LOWEST_PIANO_HZ = midiToFrequency(21);
const HIGHEST_PIANO_HZ = midiToFrequency(108);

export interface PianoMeasure extends Measure<ScoreEvent> {
  treble: readonly Voice<ScoreEvent>[];
  bass: readonly Voice<ScoreEvent>[];
}

function fullRest(measure: Measure, voiceId: number): Voice<ScoreEvent> {
  let startTick = measure.writtenRange[0];
  const end = measure.writtenRange[1];
  if (end <= startTick || end - startTick > 65_536) return { id: voiceId, segments: [] };

  const segments = decomposeDuration((end - startTick) / TICKS_PER_BEAT).map((value) => {
    const durationTicks = value.beats * TICKS_PER_BEAT;
    const segment: ScoreEvent = {
      ...value,
      id: `rest-${measure.index}-${voiceId}-${startTick}`,
      voiceId,
      measureIndex: measure.index,
      startTick,
      durationTicks,
      baseDuration: value.duration,
      sourceNoteIds: [],
      startBeat: startTick / TICKS_PER_BEAT,
      notes: [],
      isRest: true,
      tieFromPrevious: false,
      tieToNext: false,
    };
    startTick += durationTicks;
    return segment;
  });
  return { id: voiceId, segments };
}

function isValidVoice(measure: Measure, voice: Voice<ScoreEvent>): boolean {
  let next = measure.writtenRange[0];
  for (const segment of voice.segments) {
    if (
      segment.startTick !== next ||
      !WRITTEN_RHYTHMS.some(
        (token) =>
          token.ticks === segment.durationTicks &&
          token.duration === segment.baseDuration &&
          token.dots === segment.dots,
      )
    )
      return false;
    next += segment.durationTicks;
  }
  return next === measure.writtenRange[1];
}

export function projectPianoScore(score: PreparedScore, splitMidi = DEFAULT_PIANO_SPLIT) {
  const splitFrequency = midiToFrequency(splitMidi);
  const diagnostics: Diagnostic[] = [...score.diagnostics];
  const outOfRange = new Set<string>();
  let hasInvalidVoice = false;

  const measures: PianoMeasure[] = score.measures.map((measure) => {
    const treble: Voice<ScoreEvent>[] = [];
    const bass: Voice<ScoreEvent>[] = [];
    const voices = measure.voices.length ? measure.voices : [fullRest(measure, 0)];

    for (const voice of voices) {
      for (const segment of voice.segments) {
        for (const note of segment.notes) {
          const hz = note.pitch.frequency;
          if (hz < LOWEST_PIANO_HZ || hz > HIGHEST_PIANO_HZ) outOfRange.add(note.id);
        }
      }

      // One-for-one note-to-rest replacement keeps the same legal tiling on both staves.
      const upper = projectVoice(voice, (frequency) => frequency >= splitFrequency);
      const lower = projectVoice(voice, (frequency) => frequency < splitFrequency);
      const upperValid = isValidVoice(measure, upper);
      const lowerValid = isValidVoice(measure, lower);

      if (!upperValid || !lowerValid) {
        hasInvalidVoice = true;
        diagnostics.push({
          code: 'invalid-staff-voice',
          reason: 'display-limit',
          scope: {
            measureIndex: measure.index,
            voiceId: voice.id,
            sourceNoteIds: [...new Set(voice.segments.flatMap((segment) => segment.sourceNoteIds))],
          },
          message: 'A staff voice could not be rendered with valid measure rhythm.',
        });
      }

      treble.push(upperValid ? upper : fullRest(measure, voice.id));
      bass.push(lowerValid ? lower : fullRest(measure, voice.id));
    }
    return { ...measure, treble, bass };
  });

  for (const id of [...outOfRange].sort()) {
    diagnostics.push({
      code: 'piano-range',
      scope: { sourceNoteIds: [id] },
      message: 'Source pitch is outside the standard piano range (A0–C8).',
    });
  }

  const shown = new Map<string, ReadonlySet<string>>();
  for (const measure of measures) {
    for (const voice of [...measure.treble, ...measure.bass]) {
      for (const segment of voice.segments) {
        if (!segment.isRest) {
          const noteIds = shown.get(segment.id);
          shown.set(segment.id, new Set([...(noteIds ?? []), ...segment.sourceNoteIds]));
        }
      }
    }
  }

  const continuities = score.continuities.filter(
    ({ sourceNoteId, fragmentEndpoints: [from, to] }) =>
      shown.get(from)?.has(sourceNoteId) && shown.get(to)?.has(sourceNoteId),
  );

  return {
    ...score,
    measures,
    diagnostics,
    continuities,
    classification: hasInvalidVoice ? ('partial' as const) : score.classification,
    certificationEvidence: hasInvalidVoice
      ? { certified: false, reason: 'display-limit' as const }
      : score.certificationEvidence,
  };
}

function projectVoice(
  voice: Voice<ScoreEvent>,
  belongs: (frequency: number) => boolean,
): Voice<ScoreEvent> {
  return {
    id: voice.id,
    segments: voice.segments.map((segment) => {
      if (segment.isRest) return segment;
      const notes = segment.notes.filter((note) => belongs(note.pitch.frequency));
      const isRest = notes.length === 0;
      return {
        ...segment,
        notes,
        isRest,
        sourceNoteIds: notes.map((note) => note.id),
        tieFromPrevious: !isRest && segment.tieFromPrevious,
        tieToNext: !isRest && segment.tieToNext,
      };
    }),
  };
}
