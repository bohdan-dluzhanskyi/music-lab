import { useState } from 'react';

import { midiToFrequency } from '@/core/music/frequency';
import { midiToNote } from '@/core/music/notes';

import { clockAngleToPoint, midiToClockAngle } from '@/core/geometry/noteClock';

import { getChordGeometry } from '@/core/geometry/chordGeometry';

interface NoteClockProps {
  onPlay: (frequencies: number[]) => void;
}

export default function NoteClock({ onPlay }: NoteClockProps) {
  const [octave, setOctave] = useState(4);
  const [selected, setSelected] = useState<number[]>([0, 4, 7]);

  const notes = Array.from({ length: 12 }, (_, index) => {
    const midi = (octave + 1) * 12 + index;
    const frequency = midiToFrequency(midi);
    const angle = midiToClockAngle(midi);
    const point = clockAngleToPoint(angle, 130);

    return {
      index,
      midi,
      frequency,
      angle,
      note: midiToNote(midi).note,
      ...point,
    };
  });

  const frequencies = notes
    .filter((note) => selected.includes(note.index))
    .map((note) => note.frequency);

  const geometry = getChordGeometry(frequencies, 440, 130).sort((a, b) => a.angle - b.angle);

  function toggleNote(index: number) {
    setSelected((previous) =>
      previous.includes(index) ? previous.filter((note) => note !== index) : [...previous, index],
    );
  }

  return (
    <div className="geometry-panel">
      <div className="geometry-controls">
        <label>
          Octave
          <select value={octave} onChange={(event) => setOctave(Number(event.target.value))}>
            {[2, 3, 4, 5, 6].map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>

        <button onClick={() => setSelected([])}>Clear</button>

        <button disabled={!frequencies.length} onClick={() => onPlay(frequencies)}>
          Play chord
        </button>
      </div>

      <svg
        className="geometry-canvas"
        viewBox="-190 -190 380 380"
        aria-label="Interactive note clock"
      >
        {[40, 80, 130].map((radius) => (
          <circle key={radius} r={radius} className="geometry-grid" />
        ))}

        {notes.map((note) => (
          <line key={note.index} x1={0} y1={0} x2={note.x} y2={note.y} className="geometry-grid" />
        ))}

        {geometry.length >= 2 && (
          <polygon
            points={geometry.map(({ x, y }) => `${x},${y}`).join(' ')}
            className="geometry-polygon"
          />
        )}

        {notes.map((note) => {
          const active = selected.includes(note.index);

          const label = clockAngleToPoint(note.angle, 162);

          return (
            <g
              key={note.index}
              role="button"
              tabIndex={0}
              aria-label={`${note.note}${octave}`}
              aria-pressed={active}
              className="geometry-note"
              onClick={() => toggleNote(note.index)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  toggleNote(note.index);
                }
              }}
            >
              <circle
                cx={note.x}
                cy={note.y}
                r={active ? 10 : 6}
                className={active ? 'geometry-point is-active' : 'geometry-point'}
              />

              <text x={label.x} y={label.y} textAnchor="middle" dominantBaseline="middle">
                {note.note}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="geometry-results">
        {notes
          .filter((note) => selected.includes(note.index))
          .map((note) => (
            <div key={note.index}>
              <strong>
                {note.note}
                {octave}
              </strong>

              <span>{note.frequency.toFixed(3)} Hz</span>

              <span>{note.angle.toFixed(2)}°</span>
            </div>
          ))}
      </div>
    </div>
  );
}
