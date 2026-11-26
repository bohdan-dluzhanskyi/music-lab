import { useState } from 'react';

import {
  musicalSpiralPoint,
  goldenSpiralPoint,
  spiralIntersectionRatio,
  spiralIntersectionFrequency,
} from '@/core/geometry/spiral';

import { TAU, PHI } from '@/core/mathematics/constants';

import { frequencyToPitch } from '@/core/music/notes';

interface SpiralViewProps {
  onPlay: (frequencies: number[]) => void;
}

export default function SpiralView({ onPlay }: SpiralViewProps) {
  const [turns, setTurns] = useState(3);
  const [showMusical, setShowMusical] = useState(true);
  const [showGolden, setShowGolden] = useState(true);

  const reference = 440;
  const ratio = spiralIntersectionRatio();

  // Both spirals use the same coordinate scale.
  const maxRadius = Math.max(2 ** turns, PHI ** (4 * turns));

  const scale = 165 / maxRadius;

  const angles = Array.from({ length: 1501 }, (_, index) => (index / 1500) * TAU * turns);

  const musicalPoints = angles.map((angle) => musicalSpiralPoint(angle, scale));

  const goldenPoints = angles.map((angle) => goldenSpiralPoint(angle, scale));

  const intersections = Array.from({ length: 20 }, (_, index) => {
    const frequency = spiralIntersectionFrequency(index, reference);

    const angle = TAU * Math.log2(frequency / reference);

    return {
      index,
      frequency,
      angle,
      pitch: frequencyToPitch(frequency),
      ...musicalSpiralPoint(angle, scale),
    };
  }).filter(({ angle }) => angle <= TAU * turns);

  return (
    <div className="geometry-panel">
      <div className="geometry-controls">
        <label>
          Turns: {turns}
          <input
            type="range"
            min={1}
            max={4}
            step={1}
            value={turns}
            onChange={(event) => setTurns(Number(event.target.value))}
          />
        </label>

        <label>
          <input
            type="checkbox"
            checked={showMusical}
            onChange={(event) => setShowMusical(event.target.checked)}
          />
          Musical
        </label>

        <label>
          <input
            type="checkbox"
            checked={showGolden}
            onChange={(event) => setShowGolden(event.target.checked)}
          />
          Golden
        </label>
      </div>

      <svg
        className="geometry-canvas"
        viewBox="-190 -190 380 380"
        aria-label="Musical and golden spirals"
      >
        {[40, 80, 120, 160].map((radius) => (
          <circle key={radius} r={radius} className="geometry-grid" />
        ))}

        {showMusical && (
          <polyline
            points={musicalPoints.map(({ x, y }) => `${x},${y}`).join(' ')}
            className="geometry-line"
          />
        )}

        {showGolden && (
          <polyline
            points={goldenPoints.map(({ x, y }) => `${x},${y}`).join(' ')}
            className="geometry-line geometry-line--golden"
          />
        )}

        {showMusical &&
          showGolden &&
          intersections.map((point) => (
            <circle
              key={point.index}
              cx={point.x}
              cy={point.y}
              r={4}
              className="geometry-intersection"
            />
          ))}
      </svg>

      <p>Intersection ratio: {ratio.toFixed(6)}</p>

      <div className="geometry-results">
        {intersections.map((point) => (
          <button key={point.index} onClick={() => onPlay([point.frequency])}>
            <strong>Intersection {point.index}</strong>

            <span>{point.frequency.toFixed(3)} Hz</span>

            <span>
              {point.pitch.note}
              {point.pitch.octave}
              {' · '}
              {point.pitch.cents.toFixed(2)} cents
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
