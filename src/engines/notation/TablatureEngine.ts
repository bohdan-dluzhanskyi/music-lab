import { Annotation, Dot, Formatter, GhostNote, Renderer, TabNote, TabStave, Voice } from 'vexflow';

import type { NoteEvent } from '@/core/types/music.types';
import type { InstrumentTuning } from '@/core/types/notation.types';

import type { PreparedScore } from '@/core/notation/score';

import { prepareTablatureScore, type TablatureGroup } from '@/core/notation/tablature';

import { NOTATION_LAYOUT } from './constants';

export interface TablatureRenderOptions {
  notes: readonly NoteEvent[];
  score: PreparedScore;
  timeSignature: readonly [number, number];
  tuning: InstrumentTuning;
  maxStretch?: number;
  showCents?: boolean;
}

export interface TablatureRenderResult {
  groups: TablatureGroup[];
  unplayableCount: number;
  diagnostics: PreparedScore['diagnostics'];
}

export class TablatureEngine {
  // Render tablature as SVG.
  render(container: HTMLDivElement, options: TablatureRenderOptions): TablatureRenderResult {
    const { score, notes, timeSignature, tuning, maxStretch = 4, showCents = true } = options;
    const { measures, groups, diagnostics, unplayableCount } = prepareTablatureScore(
      score,
      notes,
      tuning,
      maxStretch,
    );

    const layout = NOTATION_LAYOUT;

    // Calculate tablature dimensions.
    const rowHeight = Math.max(layout.staffHeight, tuning.strings.length * 16 + 100);

    const rows = Math.ceil(measures.length / layout.measuresPerRow);

    const width =
      layout.firstMeasureWidth +
      (layout.measuresPerRow - 1) * layout.measureWidth +
      layout.padding * 2;

    const height = rows * rowHeight + layout.padding * 2;

    // Initialize the SVG renderer.
    container.replaceChildren();

    const renderer = new Renderer(container, Renderer.Backends.SVG);

    renderer.resize(width, height);

    const context = renderer.getContext();

    context.setFillStyle(layout.foreground);
    context.setStrokeStyle(layout.foreground);

    // Render tablature measures.
    for (const measure of measures) {
      const row = Math.floor(measure.index / layout.measuresPerRow);

      const column = measure.index % layout.measuresPerRow;

      const x =
        layout.padding +
        (column === 0 ? 0 : layout.firstMeasureWidth + (column - 1) * layout.measureWidth);

      const y = layout.padding + row * rowHeight;

      const measureWidth = column === 0 ? layout.firstMeasureWidth : layout.measureWidth;

      // Create a stave with the instrument's string count.
      const stave = new TabStave(x, y, measureWidth, {
        numLines: tuning.strings.length,
      });

      // Add tablature glyph and time signature.
      if (column === 0) {
        stave.addTabGlyph();

        stave.addTimeSignature(`${timeSignature[0]}/${timeSignature[1]}`);
      }

      stave.setContext(context).draw();

      // Convert score events into tablature voices.
      const voices = measure.voices.map(({ segments }) => {
        const voice = new Voice({
          numBeats: timeSignature[0],
          beatValue: timeSignature[1],
        });

        const tickables = segments.map(({ event, positions }) => {
          const duration = event.duration;
          const dots = event.dots;

          // Ghosts preserve the formatted interval for rests and unplayable events.
          if (event.isRest || positions.length !== event.sourceNoteIds.length) {
            return new GhostNote({ duration, dots });
          }

          const tabNote = new TabNote(
            {
              positions: positions.map(({ position }) => ({
                str: position.string,
                fret: position.fret,
              })),
              duration,
              dots,
            },
            true,
          );

          // Attach rhythmic dots.
          for (let index = 0; index < event.dots; index++) {
            Dot.buildAndAttach([tabNote], {
              all: true,
            });
          }

          // Display microtonal deviations.
          if (showCents && !event.tieFromPrevious) {
            event.notes.forEach((note, index) => {
              const cents = note.pitch.cents;

              if (Math.abs(cents) <= 0.5) {
                return;
              }

              const sign = cents > 0 ? '+' : '';

              tabNote.addModifier(
                new Annotation(`${sign}${cents.toFixed(1)} ct`).setFont('Arial', 10),
                index,
              );
            });
          }

          return tabNote;
        });

        voice.addTickables(tickables);

        return voice;
      });

      // Format voices within the measure.
      if (voices.length) new Formatter().joinVoices(voices).formatToStave(voices, stave);

      // Draw formatted voices.
      voices.forEach((voice) => {
        voice.draw(context, stave);
      });
    }

    // Return fingering information and diagnostics.
    return {
      groups,
      unplayableCount,
      diagnostics,
    };
  }

  // Remove rendered tablature.
  clear(container: HTMLElement): void {
    container.replaceChildren();
  }
}

export const tablatureEngine = new TablatureEngine();
