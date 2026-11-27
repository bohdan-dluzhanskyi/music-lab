import {
  Accidental,
  Annotation,
  Dot,
  Formatter,
  Renderer,
  Stave,
  StaveNote,
  StaveTie,
  Voice,
} from 'vexflow';

import type { NoteEvent } from '@/core/types/music.types';
import type { Clef } from '@/core/types/notation.types';

import { prepareScore, type ScoreEvent } from '@/core/notation/score';

import { frequencyToNotationPitch } from '@/core/notation/pitch';

import { NOTATION_LAYOUT } from './constants';

export interface NotationRenderOptions {
  notes: readonly NoteEvent[];
  lengthBeats: number;
  timeSignature: [number, number];
  clef?: Clef;
  showCents?: boolean;
}

interface RenderedEvent {
  event: ScoreEvent;
  note: StaveNote;
  row: number;
}

export class NotationEngine {
  // Create a notation element from a prepared score event.
  private createStaveNote(event: ScoreEvent, clef: Clef, showCents: boolean): StaveNote {
    const pitches = event.notes.map((note) => frequencyToNotationPitch(note.pitch.frequency));

    const staveNote = new StaveNote({
      clef,
      keys: event.isRest ? [clef === 'bass' ? 'd/3' : 'b/4'] : pitches.map((pitch) => pitch.key),

      duration: event.duration + (event.isRest ? 'r' : ''),

      dots: event.dots,
    });

    // Attach rhythmic dots.
    for (let index = 0; index < event.dots; index++) {
      Dot.buildAndAttach([staveNote], {
        all: true,
      });
    }

    // Add accidentals and microtonal annotations.
    if (!event.isRest) {
      pitches.forEach((pitch, index) => {
        if (pitch.accidental) {
          staveNote.addModifier(new Accidental(pitch.accidental), index);
        }

        if (showCents && Math.abs(pitch.cents) > 0.5) {
          const sign = pitch.cents > 0 ? '+' : '';

          staveNote.addModifier(
            new Annotation(`${sign}${pitch.cents.toFixed(1)} ct`).setFont('Arial', 10),
            index,
          );
        }
      });
    }

    return staveNote;
  }

  // Render the prepared score as SVG.
  render(container: HTMLDivElement, options: NotationRenderOptions): void {
    const { notes, lengthBeats, timeSignature, clef = 'treble', showCents = true } = options;

    const layout = NOTATION_LAYOUT;

    const measures = prepareScore(notes, lengthBeats, timeSignature);

    // Calculate score dimensions.
    const rows = Math.ceil(measures.length / layout.measuresPerRow);

    const width =
      layout.firstMeasureWidth +
      (layout.measuresPerRow - 1) * layout.measureWidth +
      layout.padding * 2;

    const height = rows * layout.staffHeight + layout.padding * 2;

    // Initialize the SVG renderer.
    container.replaceChildren();

    const renderer = new Renderer(container, Renderer.Backends.SVG);

    renderer.resize(width, height);

    const context = renderer.getContext();

    context.setFillStyle(layout.foreground);
    context.setStrokeStyle(layout.foreground);

    const previousEvents = new Map<number, RenderedEvent>();

    const ties: StaveTie[] = [];

    // Render measures.
    for (const measure of measures) {
      const row = Math.floor(measure.index / layout.measuresPerRow);

      const column = measure.index % layout.measuresPerRow;

      const x =
        layout.padding +
        (column === 0 ? 0 : layout.firstMeasureWidth + (column - 1) * layout.measureWidth);

      const y = layout.padding + row * layout.staffHeight;

      const measureWidth = column === 0 ? layout.firstMeasureWidth : layout.measureWidth;

      const stave = new Stave(x, y, measureWidth);

      // Add clef and time signature at the start of each row.
      if (column === 0) {
        stave.addClef(clef);

        stave.addTimeSignature(`${timeSignature[0]}/${timeSignature[1]}`);
      }

      stave.setContext(context).draw();

      // Convert prepared events into VexFlow voices.
      const voices = measure.voices.map((events, voiceIndex) => {
        const voice = new Voice({
          numBeats: timeSignature[0],
          beatValue: timeSignature[1],
        });

        const staveNotes = events.map((event) => {
          const staveNote = this.createStaveNote(event, clef, showCents);

          const previous = previousEvents.get(voiceIndex);

          // Connect sustained notes within the same row.
          if (
            previous &&
            previous.event.tieToNext &&
            event.tieFromPrevious &&
            previous.row === row
          ) {
            const indices = event.notes.map((_, index) => index);

            ties.push(
              new StaveTie({
                firstNote: previous.note,
                lastNote: staveNote,
                firstIndexes: indices,
                lastIndexes: indices,
              }),
            );
          }

          previousEvents.set(voiceIndex, {
            event,
            note: staveNote,
            row,
          });

          return staveNote;
        });

        voice.addTickables(staveNotes);

        return voice;
      });

      // Resolve accidentals within the measure.
      Accidental.applyAccidentals(voices, 'C');

      // Format and draw voices.
      new Formatter().joinVoices(voices).formatToStave(voices, stave);

      voices.forEach((voice) => {
        voice.draw(context, stave);
      });
    }

    // Draw ties after all notes have been positioned.
    ties.forEach((tie) => {
      tie.setContext(context).draw();
    });
  }

  // Remove rendered notation.
  clear(container: HTMLElement): void {
    container.replaceChildren();
  }
}

export const notationEngine = new NotationEngine();
