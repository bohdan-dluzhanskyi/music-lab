import { useCallback, useLayoutEffect, useState, useSyncExternalStore } from 'react';
import { Music } from 'lucide-react';

import type { NoteEvent } from '@/core/types/music.types';
import type { PreparedScore } from '@/core/notation/score';
import type {
  Clef,
  NotationMode,
  PreparationClass,
  PreparationLimit,
} from '@/core/types/notation.types';

import { INSTRUMENT_TUNINGS, type TuningId } from '@/core/notation/tunings';

import { DEFAULT_PIANO_SPLIT } from '@/core/notation/pianoStaffProjection';
import {
  createScorePreparationSession,
  samePreparationInput,
} from '@/features/notation/scorePreparationSession';
import { midiToNote } from '@/core/music/notes';

import { getCompositionLength } from '@/core/composition/composition';

import { useCompositionStore } from '@/stores/composition.store';

import StaffNotation from '@/features/notation/StaffNotation/StaffNotation';
import { DEFAULT_FOLLOW_MODE } from '@/features/notation/StaffNotation/scoreFollow';

import Tablature from '@/features/notation/Tablature/Tablature';

import './NotationPage.scss';

const MODES: {
  value: NotationMode;
  label: string;
}[] = [
  { value: 'standard', label: 'Standard' },
  { value: 'tablature', label: 'Tablature' },
  { value: 'both', label: 'Both' },
  { value: 'piano', label: 'Piano' },
];

const PREPARATION_LABELS: Record<PreparationClass, string> = {
  exact: 'Exact',
  optimal: 'Optimal approximation',
  bounded: 'Bounded approximation',
  partial: 'Partial representation',
};

const DIAGNOSTIC_REASONS: Record<PreparationLimit, string> = {
  infeasible: 'Placement proved impossible',
  'budget-exhausted': 'Search budget exhausted',
  uncertified: 'Optimality not certified',
  'display-limit': 'Notation display limit',
};

function beat(value: number, signed = false) {
  return `${signed && value > 0 ? '+' : ''}${Number(value.toPrecision(10))}`;
}

function RhythmDiagnostics({
  score,
  notes,
}: {
  score: PreparedScore;
  notes: readonly NoteEvent[];
}) {
  const { classification, certificationEvidence, diagnostics } = score;
  const label =
    PREPARATION_LABELS[
      classification === 'optimal' && !certificationEvidence.certified ? 'bounded' : classification
    ];
  if (diagnostics.length === 0 && !certificationEvidence.reason) {
    return (
      <p className="notation-page__rhythm" role="status">
        Rhythm · {label}
      </p>
    );
  }

  const byId = new Map(notes.map((note) => [note.id, note]));
  return (
    <details className="notation-page__rhythm">
      <summary>
        Rhythm · {label}
        {diagnostics.length > 0 &&
          ` · ${diagnostics.length} ${diagnostics.length === 1 ? 'entry' : 'entries'}`}
      </summary>
      {certificationEvidence.reason && <p>{DIAGNOSTIC_REASONS[certificationEvidence.reason]}</p>}
      <ul>
        {diagnostics.map(({ code, scope, message, reason, timing }, index) => {
          const source = byId.get(scope.sourceNoteIds[0] ?? '');
          return (
            <li key={index}>
              <strong title={scope.sourceNoteIds.join(', ') || undefined}>
                {source
                  ? `${source.pitch.note}${source.pitch.octave} at beat ${beat(source.startBeat)}`
                  : scope.measureIndex !== undefined
                    ? `Measure ${scope.measureIndex + 1}`
                    : 'Score'}
              </strong>
              <p>
                {message}
                {reason && ` ${DIAGNOSTIC_REASONS[reason]}.`}
              </p>
              {timing && (
                <dl>
                  <dt>Original start</dt>
                  <dd>{beat(timing.sourceTiming.startBeat)}</dd>
                  <dt>Written start</dt>
                  <dd>{beat(timing.writtenTiming.startBeat)}</dd>
                  <dt>Onset deviation</dt>
                  <dd>{beat(timing.deviations.onsetBeats, true)}</dd>
                  <dt>Original duration</dt>
                  <dd>{beat(timing.sourceTiming.durationBeats)}</dd>
                  <dt>Written duration</dt>
                  <dd>{beat(timing.writtenTiming.durationBeats)}</dd>
                  <dt>Duration deviation</dt>
                  <dd>{beat(timing.deviations.durationBeats, true)}</dd>
                </dl>
              )}
              {code === 'omitted-event' && source && (
                <p>
                  Original duration {beat(source.durationBeats)} beats. Written fragment
                  unavailable.
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </details>
  );
}

export default function NotationPage() {
  const composition = useCompositionStore((state) => state.composition);

  const selectedTrackId = useCompositionStore((state) => state.selectedTrackId);

  const selectTrack = useCompositionStore((state) => state.selectTrack);

  const [mode, setMode] = useState<NotationMode>('both');

  const [clef, setClef] = useState<Clef>('treble');

  const [tuningId, setTuningId] = useState<TuningId>('guitarStandard');

  const [showCents, setShowCents] = useState(true);

  const [maxStretch, setMaxStretch] = useState(4);
  const [splitMidi, setSplitMidi] = useState(DEFAULT_PIANO_SPLIT);
  const [zoom, setZoom] = useState(1);
  const [followMode, setFollowMode] = useState(DEFAULT_FOLLOW_MODE);

  const track =
    composition.tracks.find((item) => item.id === selectedTrackId) ?? composition.tracks[0];

  const tuning = INSTRUMENT_TUNINGS[tuningId];

  const lengthBeats = getCompositionLength(composition);
  const timeSignature = composition.timeSignature;
  const notes = track?.notes;
  const showStaff = mode !== 'tablature';
  const showTablature = mode === 'tablature' || mode === 'both';
  const { note, octave } = midiToNote(splitMidi);
  const trackId = track?.id;
  const [session] = useState(() =>
    createScorePreparationSession({
      schedule: (work) => window.setTimeout(work, 0),
      cancel: (ticket) => window.clearTimeout(ticket),
    }),
  );
  const snapshot = useSyncExternalStore(session.subscribe, session.getSnapshot);
  const [numerator, denominator] = timeSignature;
  const input = trackId && notes ? { trackId, notes, lengthBeats, timeSignature } : null;

  useLayoutEffect(() => session.attach(), [session]);

  useLayoutEffect(() => {
    if (trackId && notes)
      session.request({ trackId, notes, lengthBeats, timeSignature: [numerator, denominator] });
    else session.cancel();
  }, [trackId, notes, lengthBeats, numerator, denominator, session]);

  const current =
    input && snapshot.status !== 'idle' && samePreparationInput(input, snapshot.input)
      ? snapshot
      : null;
  const prepared = current?.status === 'ready' ? current.result : null;
  const requestId = current?.requestId;
  const isCurrent = useCallback(
    () => requestId !== undefined && session.isCurrent(requestId),
    [requestId, session],
  );

  return (
    <section className="notation-page">
      <header className="notation-page__header">
        <Music size={26} />

        <div>
          <span>Workspace</span>

          <h1>Notation & Tablature</h1>

          <p>{composition.name}</p>
        </div>
      </header>

      <div className="notation-page__modes">
        {MODES.map((item) => (
          <button
            key={item.value}
            type="button"
            className={mode === item.value ? 'is-active' : ''}
            aria-pressed={mode === item.value}
            onClick={() => setMode(item.value)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="notation-page__toolbar">
        <label>
          Track
          <select value={track?.id ?? ''} onChange={(event) => selectTrack(event.target.value)}>
            {composition.tracks.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>

        {(mode === 'standard' || mode === 'both') && (
          <label>
            Clef
            <select value={clef} onChange={(event) => setClef(event.target.value as Clef)}>
              <option value="treble">Treble</option>
              <option value="bass">Bass</option>
              <option value="alto">Alto</option>
              <option value="tenor">Tenor</option>
            </select>
          </label>
        )}

        {showTablature && (
          <>
            <label>
              Instrument
              <select
                value={tuningId}
                onChange={(event) => setTuningId(event.target.value as TuningId)}
              >
                {Object.entries(INSTRUMENT_TUNINGS).map(([id, item]) => (
                  <option key={id} value={id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Fret stretch: {maxStretch}
              <input
                type="range"
                min={2}
                max={8}
                step={1}
                value={maxStretch}
                onChange={(event) => setMaxStretch(Number(event.target.value))}
              />
            </label>
          </>
        )}

        {mode === 'piano' && (
          <>
            <label>
              Split pitch: {note}
              {octave}
              <input
                type="range"
                min={21}
                max={108}
                step={1}
                value={splitMidi}
                aria-valuetext={`${note}${octave}`}
                onChange={(event) => setSplitMidi(event.target.valueAsNumber)}
              />
            </label>
            <label>
              Score zoom: {Math.round(zoom * 100)}%
              <input
                type="range"
                min={0.75}
                max={1.5}
                step={0.05}
                value={zoom}
                aria-valuetext={`${Math.round(zoom * 100)}%`}
                onChange={(event) => setZoom(event.target.valueAsNumber)}
              />
            </label>
          </>
        )}

        <label className="notation-page__checkbox">
          <input
            type="checkbox"
            checked={showCents}
            onChange={(event) => setShowCents(event.target.checked)}
          />
          Show microtonal deviations
        </label>
      </div>

      <div className="notation-page__information">
        <span>{composition.bpm} BPM</span>

        <span>{composition.timeSignature.join('/')}</span>

        <span>{track?.notes.length ?? 0} notes</span>
      </div>

      {track && current?.status === 'error' && <p role="alert">{current.message}</p>}
      {track && (!current || current.status === 'preparing') && (
        <p role="status">Preparing score…</p>
      )}
      {track && prepared && <RhythmDiagnostics score={prepared} notes={track.notes} />}
      {track && prepared && (
        <>
          {showStaff && (
            <StaffNotation
              score={prepared}
              isCurrent={isCurrent}
              follow={{ mode: followMode, setMode: setFollowMode }}
              piano={mode === 'piano'}
              splitMidi={splitMidi}
              zoom={zoom}
              timeSignature={composition.timeSignature}
              clef={clef}
              showCents={showCents}
            />
          )}

          {showTablature && (
            <Tablature
              notes={track.notes}
              score={prepared}
              isCurrent={isCurrent}
              timeSignature={composition.timeSignature}
              tuning={tuning}
              maxStretch={maxStretch}
              showCents={showCents}
            />
          )}
        </>
      )}
    </section>
  );
}
