import { useState } from 'react';

import { PHI } from '@/core/mathematics/constants';
import { generateLissajous } from '@/core/geometry/lissajous';

interface LissajousViewProps {
  onPlay: (frequencies: number[]) => void;
}

const presets = [
  { name: 'Unison', ratio: 1 },
  { name: 'Octave', ratio: 2 },
  { name: 'Perfect fifth', ratio: 3 / 2 },
  { name: 'Perfect fourth', ratio: 4 / 3 },
  { name: 'Major third', ratio: 5 / 4 },
  { name: 'Minor third', ratio: 6 / 5 },
  { name: 'Golden ratio', ratio: PHI },
];

export default function LissajousView({ onPlay }: LissajousViewProps) {
  const [ratio, setRatio] = useState(3 / 2);
  const [phase, setPhase] = useState(90);
  const [cycles, setCycles] = useState(6);

  const points = generateLissajous(1, ratio, (phase * Math.PI) / 180, 4000, cycles);

  return (
    <div className="geometry-panel">
      <div className="geometry-controls">
        <label>
          Interval
          <select value={ratio} onChange={(event) => setRatio(Number(event.target.value))}>
            {presets.map((preset) => (
              <option key={preset.name} value={preset.ratio}>
                {preset.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Phase: {phase}°
          <input
            type="range"
            min={0}
            max={360}
            value={phase}
            onChange={(event) => setPhase(Number(event.target.value))}
          />
        </label>

        <label>
          Cycles: {cycles}
          <input
            type="range"
            min={1}
            max={20}
            value={cycles}
            onChange={(event) => setCycles(Number(event.target.value))}
          />
        </label>

        <button onClick={() => onPlay([220, 220 * ratio])}>Play interval</button>
      </div>

      <svg className="geometry-canvas" viewBox="-190 -190 380 380" aria-label="Lissajous figure">
        <line x1={-165} x2={165} y1={0} y2={0} className="geometry-grid" />

        <line x1={0} x2={0} y1={-165} y2={165} className="geometry-grid" />

        <polyline
          points={points.map(({ x, y }) => `${x * 150},${-y * 150}`).join(' ')}
          className="geometry-line"
        />
      </svg>

      <div className="geometry-results">
        <div>
          <strong>Frequency X</strong>
          <span>220 Hz</span>
        </div>

        <div>
          <strong>Frequency Y</strong>
          <span>{(220 * ratio).toFixed(3)} Hz</span>
        </div>

        <div>
          <strong>Ratio</strong>
          <span>{ratio.toFixed(8)}</span>
        </div>
      </div>
    </div>
  );
}
