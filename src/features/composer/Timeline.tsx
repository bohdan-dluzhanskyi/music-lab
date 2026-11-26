import { useCompositionStore } from '@/stores/composition.store';
import { useSequencerStore } from '@/stores/sequencer.store';

import { getCompositionLength } from '@/core/composition/composition';

export default function Timeline() {
  const composition = useCompositionStore((state) => state.composition);

  const selectTrack = useCompositionStore((state) => state.selectTrack);

  const { position, seek } = useSequencerStore();

  const beatWidth = 48;
  const rowHeight = 132;
  const headerHeight = 28;

  const beats = Math.ceil(getCompositionLength(composition));

  const width = beats * beatWidth;

  const height = headerHeight + composition.tracks.length * rowHeight;

  const beatsPerBar = composition.timeSignature[0] * (4 / composition.timeSignature[1]);

  return (
    <section className="composer-timeline">
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        onClick={(event) => {
          const bounds = event.currentTarget.getBoundingClientRect();

          seek(((event.clientX - bounds.left) / bounds.width) * beats);
        }}
      >
        {Array.from({ length: beats + 1 }, (_, beat) => (
          <g key={beat}>
            <line
              x1={beat * beatWidth}
              x2={beat * beatWidth}
              y1={headerHeight}
              y2={height}
              stroke="var(--color-border)"
              strokeWidth={beat % beatsPerBar === 0 ? 1.5 : 0.5}
            />

            {beat % beatsPerBar === 0 && (
              <text
                x={beat * beatWidth + 5}
                y={18}
                fontSize={11}
                fill="var(--color-text-secondary)"
              >
                {beat / beatsPerBar + 1}
              </text>
            )}
          </g>
        ))}

        {composition.tracks.map((track, index) => {
          const y = headerHeight + index * rowHeight;

          return (
            <g key={track.id} opacity={track.muted ? 0.3 : 1} onClick={() => selectTrack(track.id)}>
              <rect
                x={0}
                y={y}
                width={width}
                height={rowHeight}
                fill="transparent"
                stroke="var(--color-border)"
              />

              {track.notes.map((note) => (
                <rect
                  key={note.id}
                  x={note.startBeat * beatWidth}
                  y={y + 12 + (11 - (((note.pitch.midi % 12) + 12) % 12)) * 8}
                  width={Math.max(2, note.durationBeats * beatWidth - 1)}
                  height={6}
                  rx={2}
                  fill={track.color}
                >
                  <title>{note.pitch.frequency.toFixed(2)} Hz</title>
                </rect>
              ))}
            </g>
          );
        })}

        <line
          x1={position * beatWidth}
          x2={position * beatWidth}
          y1={0}
          y2={height}
          stroke="var(--color-text)"
          strokeWidth={1.5}
          pointerEvents="none"
        />
      </svg>
    </section>
  );
}
