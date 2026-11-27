import { useEffect, useRef, useState } from 'react';

import {
  tablatureEngine,
  type TablatureRenderOptions,
  type TablatureRenderResult,
} from '@/engines/notation/TablatureEngine';

import './Tablature.scss';

type TablatureProps = TablatureRenderOptions;

export default function Tablature({
  notes,
  lengthBeats,
  timeSignature,
  tuning,
  maxStretch = 4,
  showCents = true,
}: TablatureProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const [error, setError] = useState('');

  const [result, setResult] = useState<TablatureRenderResult | null>(null);

  const [showAlternatives, setShowAlternatives] = useState(false);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) return;

    const frameId = requestAnimationFrame(() => {
      try {
        const rendered = tablatureEngine.render(container, {
          notes,
          lengthBeats,
          timeSignature,
          tuning,
          maxStretch,
          showCents,
        });

        setResult(rendered);
        setError('');
      } catch (error) {
        tablatureEngine.clear(container);

        setResult(null);

        setError(error instanceof Error ? error.message : 'Unable to render tablature');
      }
    });

    return () => {
      cancelAnimationFrame(frameId);
      tablatureEngine.clear(container);
    };
  }, [notes, lengthBeats, timeSignature, tuning, maxStretch, showCents]);

  return (
    <section className="tablature">
      <header className="tablature__header">
        <span>{tuning.name}</span>

        <span>{tuning.strings.length} strings</span>

        <span>{tuning.maxFret} frets</span>

        <button type="button" onClick={() => setShowAlternatives((value) => !value)}>
          {showAlternatives ? 'Hide fingerings' : 'Show fingerings'}
        </button>
      </header>

      {error && (
        <p className="tablature__error" role="alert">
          {error}
        </p>
      )}

      {Boolean(result?.unplayableCount) && (
        <p className="tablature__warning" role="status">
          {result?.unplayableCount} notes cannot be played with the selected tuning and fingering
          constraints.
        </p>
      )}

      <div className="tablature__viewport">
        <div className="tablature__canvas" ref={containerRef} />
      </div>

      {showAlternatives && result && (
        <div className="tablature__fingerings">
          {result.groups.map((group) => (
            <details key={group.startBeat}>
              <summary>
                Beat {group.startBeat + 1}
                {' — '}
                {group.alternatives.length} available positions
              </summary>

              {!group.playable && <p>No valid fingering found.</p>}

              {group.alternatives.map((alternative, index) => (
                <div className="tablature__alternative" key={index}>
                  <span>#{index + 1}</span>

                  <span>
                    {alternative.notes
                      .map(({ position }) =>
                        position ? `S${position.string}:${position.fret}` : '—',
                      )
                      .join(' / ')}
                  </span>

                  <span>Cost: {alternative.cost.toFixed(2)}</span>
                </div>
              ))}
            </details>
          ))}
        </div>
      )}
    </section>
  );
}
