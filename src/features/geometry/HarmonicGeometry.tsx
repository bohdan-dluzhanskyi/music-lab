import { useState } from 'react';

import { generateHarmonics } from '@/core/music/harmonics';
import { clockAngleToPoint } from '@/core/geometry/noteClock';

interface HarmonicGeometryProps {
  onPlay: (frequencies: number[]) => void;
}

export default function HarmonicGeometry({ onPlay }: HarmonicGeometryProps) {
  const [fundamental, setFundamental] = useState(110);
  const [count, setCount] = useState(16);

  const harmonics = generateHarmonics(fundamental, count);

  return (
    <div className="geometry-panel">
      <div className="geometry-controls">
        <label>
          Fundamental
          <select
            value={fundamental}
            onChange={(event) => setFundamental(Number(event.target.value))}
          >
            {[55, 110, 220, 440, 880].map((value) => (
              <option key={value} value={value}>
                {value} Hz
              </option>
            ))}
          </select>
        </label>

        <label>
          Harmonics: {count}
          <input
            type="range"
            min={2}
            max={32}
            value={count}
            onChange={(event) => setCount(Number(event.target.value))}
          />
        </label>
      </div>

      <svg className="geometry-canvas" viewBox="-190 -190 380 380" aria-label="Harmonic geometry">
        <circle r={135} className="geometry-grid" />

        {harmonics.map((harmonic) => {
          const point = clockAngleToPoint(harmonic.clockAngle, 135);

          return (
            <g key={harmonic.harmonic}>
              <line
                x1={0}
                y1={0}
                x2={point.x}
                y2={point.y}
                className="geometry-line"
                opacity={Math.sqrt(harmonic.amplitude)}
              />

              <circle
                cx={point.x}
                cy={point.y}
                r={3 + 6 * harmonic.amplitude}
                className="geometry-point is-active"
              />
            </g>
          );
        })}
      </svg>

      <div className="geometry-results">
        {harmonics.map((harmonic) => (
          <button key={harmonic.harmonic} onClick={() => onPlay([harmonic.frequency])}>
            <strong>H{harmonic.harmonic}</strong>

            <span>{harmonic.frequency.toFixed(2)} Hz</span>

            <span>{harmonic.clockAngle.toFixed(2)}°</span>

            <span>
              {harmonic.pitch.note}
              {harmonic.pitch.octave}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
