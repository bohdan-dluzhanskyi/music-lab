import { useState } from 'react';
import { Music } from 'lucide-react';

import type { Clef } from '@/core/types/notation.types';

import { getCompositionLength } from '@/core/composition/composition';

import { useCompositionStore } from '@/stores/composition.store';

import StaffNotation from '@/features/notation/StaffNotation/StaffNotation';

import './NotationPage.scss';

export default function NotationPage() {
  const composition = useCompositionStore((state) => state.composition);

  const selectedTrackId = useCompositionStore((state) => state.selectedTrackId);

  const selectTrack = useCompositionStore((state) => state.selectTrack);

  const [clef, setClef] = useState<Clef>('treble');

  const [showCents, setShowCents] = useState(true);

  const track =
    composition.tracks.find((item) => item.id === selectedTrackId) ?? composition.tracks[0];

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

        <label>
          Clef
          <select value={clef} onChange={(event) => setClef(event.target.value as Clef)}>
            <option value="treble">Treble</option>
            <option value="bass">Bass</option>
            <option value="alto">Alto</option>
            <option value="tenor">Tenor</option>
          </select>
        </label>

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
        <StaffNotation
          notes={track.notes}
          lengthBeats={getCompositionLength(composition)}
          timeSignature={composition.timeSignature}
          clef={clef}
          showCents={showCents}
        />
      )}
    </section>
  );
}
