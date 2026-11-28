import {
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type RefObject,
  type SetStateAction,
} from 'react';
import { createScoreCursorMap, type LayoutSnapshot } from '@/engines/notation/scoreGeometry';
import { useSequencerStore } from '@/stores/sequencer.store';
import {
  followAfterInput,
  scoreScrollBehavior,
  shouldRevealSystem,
  type FollowMode,
} from './scoreFollow';

export interface ScoreViewport {
  layout: LayoutSnapshot;
  viewBox: string;
  scale: number;
  width: number;
  height: number;
}

export default function PlaybackCursor({
  viewport,
  canvas,
  mode,
  setMode,
}: {
  viewport: ScoreViewport | null;
  canvas: RefObject<HTMLDivElement | null>;
  mode: FollowMode;
  setMode: Dispatch<SetStateAction<FollowMode>>;
}) {
  const position = useSequencerStore((state) => state.position);
  const status = useSequencerStore((state) => state.status);
  const navigation = useSequencerStore((state) => state.navigation);
  const [resume, setResume] = useState(0);
  const last = useRef({ revision: navigation.revision, resume: 0, target: '' });
  const scrolling = useRef<string | null>(null);
  const cursorMap = useMemo(() => viewport && createScoreCursorMap(viewport.layout), [viewport]);
  const cursor = cursorMap?.(position);
  const seek = useSequencerStore((state) => state.seek);
  const currentMeasure = cursor?.measureIndex;

  useLayoutEffect(() => {
    const host = canvas.current;
    const workspace = host?.closest<HTMLElement>('.app-layout__workspace');
    if (!workspace || !host) return;

    const interrupt = () => {
      if (scrolling.current) {
        workspace.scrollTo({ top: workspace.scrollTop, behavior: 'instant' });
        scrolling.current = null;
      }
    };
    const manual = () => {
      interrupt();
      setMode((current) => followAfterInput(current, 'manual'));
    };
    const keyboard = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        (event.target instanceof Element &&
          event.target.closest('button, input, select, textarea, a, [contenteditable]'))
      )
        return;
      if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(event.key))
        manual();
    };
    const scrollbar = (event: PointerEvent) => {
      const left = workspace.getBoundingClientRect().left;
      if (event.clientX >= left + workspace.clientLeft + workspace.clientWidth) manual();
    };
    const end = () => {
      scrolling.current = null;
    };
    workspace.addEventListener('wheel', manual, { passive: true });
    workspace.addEventListener('touchmove', manual, { passive: true });
    workspace.addEventListener('keydown', keyboard);
    workspace.addEventListener('pointerdown', scrollbar);
    workspace.addEventListener('scrollend', end);
    return () => {
      interrupt();
      workspace.removeEventListener('wheel', manual);
      workspace.removeEventListener('touchmove', manual);
      workspace.removeEventListener('keydown', keyboard);
      workspace.removeEventListener('pointerdown', scrollbar);
      workspace.removeEventListener('scrollend', end);
    };
  }, [canvas, setMode]);

  useLayoutEffect(() => {
    const host = canvas.current;
    const workspace = host?.closest<HTMLElement>('.app-layout__workspace');
    if (!host || !workspace) return;
    const changed = navigation.revision !== last.current.revision;
    const resumed = resume !== last.current.resume;
    if (changed && navigation.kind === 'pause') {
      last.current.revision = navigation.revision;
      if (scrolling.current) workspace.scrollTo({ top: workspace.scrollTop, behavior: 'instant' });
      scrolling.current = null;
      return;
    }
    if (!cursor || !viewport) return;
    const kind = changed ? navigation.kind : 'play';
    const system =
      kind === 'stop' ? viewport.layout.systems[0] : viewport.layout.systems[cursor.systemIndex];
    if (!system) return;
    const systemKey = `${viewport.layout.version}:${system.index}`;
    const target = `${systemKey}:${navigation.revision}:${resume}`;
    last.current.revision = navigation.revision;
    last.current.resume = resume;
    if (last.current.target === target || (!changed && !resumed && status !== 'playing')) return;
    last.current.target = target;
    const area = workspace.getBoundingClientRect();
    const score = host.getBoundingClientRect();
    const top = score.top + system.top * viewport.scale;
    const bottom = score.top + system.bottom * viewport.scale;
    const region = bottom - top > area.height ? (top + bottom) / 2 : null;
    const visible =
      region === null
        ? top >= area.top && bottom <= area.bottom
        : region >= area.top && region <= area.bottom;
    const samePendingSystem = scrolling.current === systemKey;
    if (!shouldRevealSystem(mode, kind, visible)) return;
    if ((kind === 'play' || kind === 'loop') && samePendingSystem) return;
    const behavior = scoreScrollBehavior(
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    );
    scrolling.current = behavior === 'smooth' ? systemKey : null;
    workspace.scrollTo({
      top: workspace.scrollTop + (kind === 'stop' ? score.top : top) - area.top - 12,
      behavior,
    });
    const surface = host.closest<HTMLElement>('.staff-notation');
    const measure = viewport.layout.measures[cursor.measureIndex];
    if (kind === 'seek' && surface && measure) {
      const left =
        score.left + measure.left * viewport.scale - surface.getBoundingClientRect().left;
      if (left < 0 || left >= surface.clientWidth) {
        surface.scrollTo({ left: surface.scrollLeft + left, behavior });
      }
    }
  }, [canvas, cursor, mode, navigation, resume, status, viewport]);

  return (
    <>
      <div className="staff-notation__navigation">
        <button
          type="button"
          aria-label="Follow Playback"
          aria-pressed={mode === 'following'}
          onClick={() => {
            if (mode === 'following' && scrolling.current) {
              const workspace = canvas.current?.closest<HTMLElement>('.app-layout__workspace');
              if (workspace) workspace.scrollTo({ top: workspace.scrollTop, behavior: 'instant' });
              scrolling.current = null;
            }
            setMode(followAfterInput(mode, 'toggle'));
            if (mode !== 'following') setResume((value) => value + 1);
          }}
        >
          {mode === 'suspended' ? 'Resume Follow Playback' : 'Follow Playback'}
        </button>
        <label>
          Measure
          <select
            aria-label="Go to measure"
            value={currentMeasure ?? ''}
            disabled={!viewport}
            onChange={(event) => {
              const index = Number(event.target.value);
              const measure = viewport?.layout.measures[index];
              if (measure) {
                seek(measure.playableInterval[0]);
              }
            }}
          >
            {viewport?.layout.measures.map((measure) => (
              <option key={measure.index} value={measure.index}>
                {measure.index + 1}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          disabled={currentMeasure === undefined}
          onClick={() => {
            const measure =
              currentMeasure === undefined ? undefined : viewport?.layout.measures[currentMeasure];
            if (measure) seek(measure.playableInterval[0]);
          }}
        >
          Show current measure
        </button>
      </div>
      {cursor && viewport && (
        <svg
          className="staff-notation__cursor"
          aria-hidden="true"
          width={viewport.width}
          height={viewport.height}
          viewBox={viewport.viewBox}
          data-layout-version={cursor.layoutVersion}
          data-source-beat={cursor.sourceBeat}
          data-system={cursor.systemIndex}
        >
          <line x1={cursor.x} x2={cursor.x} y1={cursor.bounds.top} y2={cursor.bounds.bottom} />
        </svg>
      )}
    </>
  );
}
