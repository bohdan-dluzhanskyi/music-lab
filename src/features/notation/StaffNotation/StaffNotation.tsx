import { useLayoutEffect, useRef, useState, type ComponentProps } from 'react';
import { notationEngine, type NotationRenderOptions } from '@/engines/notation/NotationEngine';
import { createScoreLayoutPublisher } from '@/engines/notation/scoreGeometry';
import type { Diagnostic } from '@/core/types/notation.types';

import PlaybackCursor, { type ScoreViewport } from './PlaybackCursor';

import './StaffNotation.scss';

export default function StaffNotation({
  score,
  follow,
  isCurrent,
  timeSignature,
  clef = 'treble',
  showCents = true,
  piano = false,
  splitMidi,
  zoom = 1,
}: NotationRenderOptions & {
  isCurrent?: () => boolean;
  follow?: Pick<ComponentProps<typeof PlaybackCursor>, 'mode' | 'setMode'>;
}) {
  const surfaceRef = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [publisher] = useState(createScoreLayoutPublisher);
  const [viewport, setViewport] = useState<ScoreViewport | null>(null);
  const [error, setError] = useState('');
  const [diagnostics, setDiagnostics] = useState<readonly Diagnostic[]>([]);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const surface = surfaceRef.current;
    if (!container || !surface) return;

    let frameId = 0;
    let lastWidth = 0;
    const render = () => {
      const version = publisher.begin();
      setViewport(null);
      cancelAnimationFrame(frameId);
      lastWidth = surface.clientWidth;
      frameId = requestAnimationFrame(() => {
        if (isCurrent && !isCurrent()) return;
        try {
          const result = notationEngine.render(
            container,
            {
              score,
              timeSignature,
              clef,
              showCents,
              piano,
              splitMidi,
              zoom,
              availableWidth: lastWidth,
            },
            version,
          );
          if (isCurrent && !isCurrent()) return;
          if (result.snapshot && !publisher.publish(version, result.snapshot)) return;
          const svg = container.querySelector('svg');
          if (result.snapshot && svg) {
            setViewport({
              layout: result.snapshot,
              viewBox: svg.getAttribute('viewBox') ?? '',
              width: svg.width.baseVal.value,
              height: svg.height.baseVal.value,
              scale: zoom,
            });
          }
          setDiagnostics(result.diagnostics);
          setError('');
        } catch (error) {
          notationEngine.clear(container);
          setDiagnostics([]);
          setError(error instanceof Error ? error.message : 'Unable to render notation');
        }
      });
    };

    render();
    const observer = piano
      ? new ResizeObserver(() => {
          if (surface.clientWidth !== lastWidth) render();
        })
      : undefined;
    observer?.observe(surface);

    return () => {
      observer?.disconnect();
      cancelAnimationFrame(frameId);
      publisher.invalidate();
      notationEngine.clear(container);
    };
  }, [score, timeSignature, clef, showCents, piano, splitMidi, zoom, publisher, isCurrent]);

  const outsideRange = diagnostics.filter((diagnostic) => diagnostic.code === 'piano-range').length;
  const invalidVoices = diagnostics.filter(
    (diagnostic) => diagnostic.code === 'invalid-staff-voice',
  ).length;

  return (
    <section
      className="staff-notation"
      ref={surfaceRef}
      aria-label={piano ? 'Piano grand staff' : 'Standard notation'}
    >
      {error && (
        <p className="staff-notation__error" role="alert">
          {error}
        </p>
      )}
      {piano && outsideRange > 0 && (
        <p className="staff-notation__diagnostic" role="status">
          {outsideRange} {outsideRange === 1 ? 'note is' : 'notes are'} outside the piano range
          (A0–C8).
        </p>
      )}
      {piano && invalidVoices > 0 && (
        <p className="staff-notation__diagnostic" role="status">
          {invalidVoices} {invalidVoices === 1 ? 'staff voice was' : 'staff voices were'} replaced
          with rests.
        </p>
      )}
      <div className="staff-notation__stage">
        <div className="staff-notation__canvas" ref={containerRef} />
        {piano && follow && (
          <PlaybackCursor viewport={viewport} canvas={containerRef} {...follow} />
        )}
      </div>
    </section>
  );
}
