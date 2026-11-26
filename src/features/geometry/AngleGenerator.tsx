import { useState } from 'react';

import { GOLDEN_ANGLE } from '@/core/mathematics/constants';
import { generateAngleSequence } from '@/core/geometry/angleSequence';
import { clockAngleToPoint } from '@/core/geometry/noteClock';

interface AngleGeneratorProps {
  onPlay: (frequencies: number[]) => void;
}

export default function AngleGenerator({ onPlay }: AngleGeneratorProps) {
  const [angle, setAngle] = useState(GOLDEN_ANGLE);
  const [count, setCount] = useState(12);

  const sequence = generateAngleSequence(440, angle, count);

  const points = sequence.map((note) => ({
    ...note,
    ...clockAngleToPoint(note.clockAngle, 135),
  }));

  return (
    <div className="geometry-panel">
      <div className="geometry-controls">
        <label>
          Angle: {angle.toFixed(6)}°
          <input
            type="range"
            min={0}
            max={360}
            step={0.1}
            value={angle}
            onChange={(event) => setAngle(Number(event.target.value))}
          />
        </label>

        <label>
          Notes: {count}
          <input
            type="range"
            min={2}
            max={32}
            value={count}
            onChange={(event) => setCount(Number(event.target.value))}
          />
        </label>

        <button onClick={() => setAngle(GOLDEN_ANGLE)}>Golden angle</button>
      </div>

      <div className="geometry-controls">
        {[30, 60, 90, 120, 180, 210].map((value) => (
          <button key={value} onClick={() => setAngle(value)}>
            {value}°
          </button>
        ))}
      </div>

      <svg
        className="geometry-canvas"
        viewBox="-190 -190 380 380"
        aria-label="Angular note sequence"
      >
        <circle r={135} className="geometry-grid" />

        <polyline
          points={points.map(({ x, y }) => `${x},${y}`).join(' ')}
          className="geometry-line"
        />

        {points.map((point) => (
          <g key={point.index}>
            <circle cx={point.x} cy={point.y} r={5} className="geometry-point is-active" />

            <text
              x={point.x * 1.12}
              y={point.y * 1.12}
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {point.index + 1}
            </text>
          </g>
        ))}
      </svg>

      <div className="geometry-results">
        {sequence.map((note) => (
          <button key={note.index} onClick={() => onPlay([note.frequency])}>
            <strong>
              {note.index + 1}. {note.pitch.note}
              {note.pitch.octave}
            </strong>

            <span>{note.frequency.toFixed(3)} Hz</span>
            <span>{note.clockAngle.toFixed(3)}°</span>
            <span>{note.pitch.cents.toFixed(2)} ct</span>
          </button>
        ))}
      </div>
    </div>
  );
}
