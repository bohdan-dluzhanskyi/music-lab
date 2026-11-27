import { useState } from 'react';
import { Music } from 'lucide-react';

import type { Clef, NotationMode } from '@/core/types/notation.types';

import { INSTRUMENT_TUNINGS, type TuningId } from '@/core/notation/tunings';

import { getCompositionLength } from '@/core/composition/composition';

import { useCompositionStore } from '@/stores/composition.store';

import StaffNotation from '@/features/notation/StaffNotation/StaffNotation';

import Tablature from '@/features/notation/Tablature/Tablature';

import './NotationPage.scss';

const MODES: {
  value: NotationMode;
  label: string;
}[] = [
  { value: 'standard', label: 'Standard' },
  { value: 'tablature', label: 'Tablature' },
  { value: 'both', label: 'Both' },
];

export default function NotationPage() {
  const composition = useCompositionStore((state) => state.composition);

  const selectedTrackId = useCompositionStore((state) => state.selectedTrackId);

  const selectTrack = useCompositionStore((state) => state.selectTrack);

  const [mode, setMode] = useState<NotationMode>('both');

  const [clef, setClef] = useState<Clef>('treble');

  const [tuningId, setTuningId] = useState<TuningId>('guitarStandard');

  const [showCents, setShowCents] = useState(true);

  const [maxStretch, setMaxStretch] = useState(4);

  const track =
    composition.tracks.find((item) => item.id === selectedTrackId) ?? composition.tracks[0];

  const tuning = INSTRUMENT_TUNINGS[tuningId];

  const lengthBeats = getCompositionLength(composition);

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

        {mode !== 'tablature' && (
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

        {mode !== 'standard' && (
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

      {track && (
        <>
          {mode !== 'tablature' && (
            <StaffNotation
              notes={track.notes}
              lengthBeats={lengthBeats}
              timeSignature={composition.timeSignature}
              clef={clef}
              showCents={showCents}
            />
          )}

          {mode !== 'standard' && (
            <Tablature
              notes={track.notes}
              lengthBeats={lengthBeats}
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
