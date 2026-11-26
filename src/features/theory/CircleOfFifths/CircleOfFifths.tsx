import { CIRCLE_OF_FIFTHS } from '@/core/music/circleOfFifths';

import './CircleOfFifths.scss';

interface Props {
  root: number;
  onSelect: (pitchClass: number) => void;
}

export default function CircleOfFifths({ root, onSelect }: Props) {
  return (
    <section className="fifths">
      <h2>Circle of Fifths</h2>

      <svg viewBox="0 0 320 320" role="img" aria-label="Circle of fifths">
        {[48, 98, 148].map((radius) => (
          <circle key={radius} cx={160} cy={160} r={radius} className="fifths__circle" />
        ))}

        {CIRCLE_OF_FIFTHS.map((item) => {
          const angle = (item.angle * Math.PI) / 180;

          const x = Math.sin(angle);
          const y = -Math.cos(angle);

          const active = item.majorPitchClass === root;

          return (
            <g
              key={item.index}
              className={active ? 'fifths__item is-active' : 'fifths__item'}
              role="button"
              tabIndex={0}
              aria-label={`Select ${item.major} major`}
              onClick={() => onSelect(item.majorPitchClass)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onSelect(item.majorPitchClass);
                }
              }}
            >
              <circle cx={160 + x * 122} cy={160 + y * 122} r={20} />

              <text x={160 + x * 122} y={165 + y * 122} textAnchor="middle">
                {item.major}
              </text>

              <text className="fifths__minor" x={160 + x * 76} y={164 + y * 76} textAnchor="middle">
                {item.minor}
              </text>
            </g>
          );
        })}

        <text className="fifths__center" x={160} y={167} textAnchor="middle">
          {CIRCLE_OF_FIFTHS.find((item) => item.majorPitchClass === root)?.major}
        </text>
      </svg>
    </section>
  );
}
