import type { NoteEvent } from '@/core/types/music.types';

interface SequencePreviewProps {
  notes: readonly NoteEvent[];
  totalBeats: number;
}

export default function SequencePreview({ notes, totalBeats }: SequencePreviewProps) {
  if (!notes.length) {
    return <p>No active notes</p>;
  }

  const width = 900;
  const height = 240;
  const padding = 30;

  const minMidi = Math.floor(Math.min(...notes.map((note) => note.pitch.midi)));

  const maxMidi = Math.max(
    minMidi + 12,
    Math.ceil(Math.max(...notes.map((note) => note.pitch.midi))),
  );

  const pitchRange = maxMidi - minMidi;
  const rowHeight = (height - padding * 2) / pitchRange;

  const timeScale = (width - padding * 2) / Math.max(totalBeats, 1);

  return (
    <svg
      className="math-preview"
      viewBox={`0 0 ${width} ${height}`}
      aria-label="Generated musical sequence"
    >
      {Array.from({ length: pitchRange + 1 }, (_, index) => {
        const y = padding + index * rowHeight;

        return (
          <line
            key={index}
            x1={padding}
            x2={width - padding}
            y1={y}
            y2={y}
            className="math-preview__grid"
          />
        );
      })}

      {Array.from({ length: Math.ceil(totalBeats) + 1 }, (_, beat) => (
        <line
          key={beat}
          x1={padding + beat * timeScale}
          x2={padding + beat * timeScale}
          y1={padding}
          y2={height - padding}
          className="math-preview__grid"
        />
      ))}

      {notes.map((note) => {
        const x = padding + note.startBeat * timeScale;

        const y = padding + (maxMidi - note.pitch.midi) * rowHeight;

        return (
          <rect
            key={note.id}
            x={x}
            y={y - rowHeight * 0.4}
            width={Math.max(2, note.durationBeats * timeScale - 2)}
            height={rowHeight * 0.8}
            rx={2}
            className="math-preview__note"
          >
            <title>
              {`${note.pitch.note}${note.pitch.octave} · ${note.pitch.frequency.toFixed(2)} Hz`}
            </title>
          </rect>
        );
      })}
    </svg>
  );
}
