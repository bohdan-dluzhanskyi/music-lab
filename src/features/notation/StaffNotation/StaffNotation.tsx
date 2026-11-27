import { useEffect, useRef, useState } from 'react';

import { notationEngine, type NotationRenderOptions } from '@/engines/notation/NotationEngine';

import './StaffNotation.scss';

type StaffNotationProps = NotationRenderOptions;

export default function StaffNotation({
  notes,
  lengthBeats,
  timeSignature,
  clef = 'treble',
  showCents = true,
}: StaffNotationProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const [error, setError] = useState('');

  useEffect(() => {
    const container = containerRef.current;

    if (!container) return;

    const frameId = requestAnimationFrame(() => {
      try {
        notationEngine.render(container, {
          notes,
          lengthBeats,
          timeSignature,
          clef,
          showCents,
        });

        setError('');
      } catch (error) {
        notationEngine.clear(container);

        setError(error instanceof Error ? error.message : 'Unable to render notation');
      }
    });

    return () => {
      cancelAnimationFrame(frameId);
      notationEngine.clear(container);
    };
  }, [notes, lengthBeats, timeSignature, clef, showCents]);

  return (
    <section className="staff-notation">
      {error && (
        <p className="staff-notation__error" role="alert">
          {error}
        </p>
      )}

      <div className="staff-notation__canvas" ref={containerRef} />
    </section>
  );
}
