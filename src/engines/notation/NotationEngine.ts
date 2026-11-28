import {
  Accidental,
  Annotation,
  Dot,
  Formatter,
  Renderer,
  Stave,
  StaveConnector,
  StaveNote,
  StaveTie,
  Voice,
} from 'vexflow';
import type { RenderContext } from 'vexflow';
import type {
  Clef,
  Measure,
  Voice as ScoreVoice,
  WrittenContinuity,
} from '@/core/types/notation.types';
import type { PreparedScore, ScoreEvent } from '@/core/notation/score';
import { projectPianoScore } from '@/core/notation/pianoStaffProjection';
import { frequencyToNotationPitch } from '@/core/notation/pitch';
import { NOTATION_LAYOUT, PIANO_LAYOUT } from './constants';
import {
  monotoneSourceAnchors,
  type LayoutSnapshot,
  type MeasureGeometry,
  type SourceAnchor,
  type WrittenAnchor,
} from './scoreGeometry';

export interface NotationRenderOptions {
  score: PreparedScore;
  timeSignature: readonly [number, number];
  clef?: Clef;
  showCents?: boolean;
  piano?: boolean;
  splitMidi?: number;
  availableWidth?: number;
  zoom?: number;
}

interface RenderedEvent {
  event: ScoreEvent;
  note: StaveNote;
  staff: number;
  row: number;
}

interface RenderedVoice {
  voice: Voice;
  stave: Stave;
}

interface PianoDrawingMeasure {
  staves: [Stave, Stave];
  voices: RenderedVoice[];
  events: RenderedEvent[];
  connectors: { kind: 'brace' | 'singleLeft' | 'singleRight'; element: StaveConnector }[];
}

function makeNotes(voices: readonly ScoreVoice<ScoreEvent>[], clef: Clef, showCents: boolean) {
  return voices.map((voice) =>
    voice.segments.map((event) => ({ event, note: createNote(event, clef, showCents) })),
  );
}

function createNote(event: ScoreEvent, clef: Clef, showCents: boolean): StaveNote {
  const pitches = event.notes.map((note) => frequencyToNotationPitch(note.pitch.frequency));
  const staveNote = new StaveNote({
    clef,
    keys: event.isRest ? [clef === 'bass' ? 'd/3' : 'b/4'] : pitches.map((pitch) => pitch.key),
    duration: event.duration + (event.isRest ? 'r' : ''),
    dots: event.dots,
  });

  for (let index = 0; index < event.dots; index++) {
    Dot.buildAndAttach([staveNote], { all: true });
  }

  pitches.forEach((pitch, index) => {
    if (pitch.accidental) staveNote.addModifier(new Accidental(pitch.accidental), index);
    if (showCents && Math.abs(pitch.cents) > 0.5) {
      const sign = pitch.cents > 0 ? '+' : '';
      staveNote.addModifier(
        new Annotation(`${sign}${pitch.cents.toFixed(1)} ct`).setFont('Arial', 10),
        index,
      );
    }
  });
  return staveNote;
}

function staveFor(
  x: number,
  y: number,
  width: number,
  opening: boolean,
  clef: Clef,
  meter: readonly [number, number],
) {
  const stave = new Stave(x, y, width);
  if (opening) stave.addClef(clef).addTimeSignature(meter.join('/'));
  return stave;
}

function createVoices(
  groups: ReturnType<typeof makeNotes>,
  stave: Stave,
  meter: readonly [number, number],
) {
  return groups
    .filter((group) => group.length > 0)
    .map((group) => {
      const notes = group.map(({ note }) => note.setStave(stave));
      return new Voice({ numBeats: meter[0], beatValue: meter[1] })
        .setStave(stave)
        .addTickables(notes);
    });
}

export function buildScoreTies(
  continuities: readonly WrittenContinuity[],
  events: readonly RenderedEvent[],
) {
  const notes = new Map<string, RenderedEvent>();
  const ties: { sourceNoteId: string; tie: StaveTie }[] = [];
  for (const item of events)
    if (!item.event.isRest) notes.set(`${item.staff}:${item.event.id}`, item);
  for (const {
    sourceNoteId,
    fragmentEndpoints: [from, to],
  } of continuities) {
    for (const staff of [0, 1]) {
      const first = notes.get(`${staff}:${from}`);
      const last = notes.get(`${staff}:${to}`);
      if (!first || !last) continue;
      const firstIndex = first.event.sourceNoteIds.indexOf(sourceNoteId);
      const lastIndex = last.event.sourceNoteIds.indexOf(sourceNoteId);
      if (firstIndex < 0 || lastIndex < 0) continue;
      if (first.row === last.row) {
        ties.push({
          sourceNoteId,
          tie: new StaveTie({
            firstNote: first.note,
            lastNote: last.note,
            firstIndexes: [firstIndex],
            lastIndexes: [lastIndex],
          }),
        });
      } else {
        ties.push(
          {
            sourceNoteId,
            tie: new StaveTie({
              firstNote: first.note,
              firstIndexes: [firstIndex],
              lastIndexes: [firstIndex],
            }),
          },
          {
            sourceNoteId,
            tie: new StaveTie({
              lastNote: last.note,
              firstIndexes: [lastIndex],
              lastIndexes: [lastIndex],
            }),
          },
        );
      }
    }
  }
  return ties;
}

function drawTies(context: RenderContext, ties: ReturnType<typeof buildScoreTies>) {
  for (const { tie } of ties) {
    context.openGroup(tie.isPartial() ? 'score-tie-partial' : 'score-tie');
    tie.setContext(context).draw();
    context.closeGroup();
  }
}

// One visible rest line is sufficient when every voice on a staff is silent.
function visibleVoices(voices: readonly ScoreVoice<ScoreEvent>[]) {
  const active = voices.filter((voice) => voice.segments.some((event) => !event.isRest));
  return active.length > 0 ? active : voices.slice(0, 1);
}

function anchorsFor(
  measure: Measure<ScoreEvent>,
  events: readonly RenderedEvent[],
  contentLeft: number,
  contentRight: number,
  onsets: PreparedScore['onsetGroups'],
) {
  const [start, end] = measure.writtenRange;
  const written = new Map<number, number>([
    [start, contentLeft],
    [end, contentRight],
  ]);
  const optional: SourceAnchor[] = [];
  for (const { event, note } of events) {
    const x = note.getAbsoluteX() - (note.isCenterAligned() ? note.getCenterXShift() : 0);
    written.set(event.startTick, x);
    if (!event.tieToNext) {
      for (const source of event.notes) {
        optional.push({
          sourceBeat: source.startBeat + source.durationBeats,
          writtenTick: event.startTick + event.durationTicks,
        });
      }
    }
  }

  const [sourceStart, sourceEnd] = measure.sourceInterval;
  const playableEnd = measure.playableInterval[1];
  const required: SourceAnchor[] = [{ sourceBeat: sourceStart, writtenTick: start }];
  for (const group of onsets) {
    required.push({ sourceBeat: group.sourceOnsetBeat, writtenTick: group.writtenOnsetTick });
  }
  if (measure.writtenPlaybackCutoff !== null && playableEnd < sourceEnd) {
    required.push({ sourceBeat: playableEnd, writtenTick: measure.writtenPlaybackCutoff });
  }
  required.push({ sourceBeat: sourceEnd, writtenTick: end });

  const anchors = [...written]
    .sort(([a], [b]) => a - b)
    .map(([writtenTick, x]) => ({ measureIndex: measure.index, writtenTick, x }));
  return { anchors, sourceAnchors: monotoneSourceAnchors(required, optional) };
}

export class NotationEngine {
  layoutPiano(options: NotationRenderOptions, version: number, context?: RenderContext) {
    const { score, timeSignature: meter, showCents = true, splitMidi, zoom = 1 } = options;
    const projection = projectPianoScore(score, splitMidi);
    const { padding } = NOTATION_LAYOUT;
    const { braceGutter, minMeasureWidth, maxSystemWidth } = PIANO_LAYOUT;
    const preparedMeasures = projection.measures.map((measure) => ({
      measure,
      upper: makeNotes(visibleVoices(measure.treble), 'treble', showCents),
      lower: makeNotes(visibleVoices(measure.bass), 'bass', showCents),
    }));
    const upperRoom = { above: 0, below: 0 };
    const lowerRoom = { above: 0, below: 0 };
    const reference = new Stave(0, 0, minMeasureWidth);

    function reserveLedgerRoom(groups: ReturnType<typeof makeNotes>, room: typeof upperRoom) {
      for (const group of groups) {
        for (const { event, note } of group) {
          if (event.isRest) continue;
          for (const key of note.getKeyProps()) {
            const y = reference.getYForNote(key.line);
            room.above = Math.max(room.above, 36 - y);
            room.below = Math.max(room.below, y - 100);
          }
        }
      }
    }

    for (const { upper, lower } of preparedMeasures) {
      reserveLedgerRoom(upper, upperRoom);
      reserveLedgerRoom(lower, lowerRoom);
    }

    const staffSeparation = PIANO_LAYOUT.staffSeparation + upperRoom.below + lowerRoom.above;
    const systemHeight =
      PIANO_LAYOUT.systemHeight +
      upperRoom.above +
      upperRoom.below +
      lowerRoom.above +
      lowerRoom.below;
    const available = Math.min(maxSystemWidth, (options.availableWidth || 1080) / zoom);
    const snapshots: MeasureGeometry[] = [];
    const drawing: PianoDrawingMeasure[] = [];
    const onsetsByMeasure = new Map<number, PreparedScore['onsetGroups'][number][]>();
    let cursor = 0;
    for (const group of score.onsetGroups) {
      while (
        cursor + 1 < projection.measures.length &&
        group.sourceOnsetBeat >= projection.measures[cursor]!.sourceInterval[1]
      )
        cursor++;
      const index = projection.measures[cursor]?.index;
      if (index === undefined) break;
      const items = onsetsByMeasure.get(index);
      if (items) items.push(group);
      else onsetsByMeasure.set(index, [group]);
    }

    let row = 0;
    let x = padding + braceGutter;
    let right = x;
    for (const { measure, upper, lower } of preparedMeasures) {
      const firstX = padding + braceGutter;
      // Reserve a conservative clef and meter gutter before wrapping whole measures.
      const create = (opening: boolean, applyAccidentals: boolean) => {
        const y = padding + upperRoom.above + row * systemHeight;
        const top = staveFor(x, y, minMeasureWidth, opening, 'treble', meter);
        const bottom = staveFor(x, y + staffSeparation, minMeasureWidth, opening, 'bass', meter);
        const upperVoices = createVoices(upper, top, meter);
        const lowerVoices = createVoices(lower, bottom, meter);
        if (applyAccidentals) {
          Accidental.applyAccidentals(upperVoices, 'C');
          Accidental.applyAccidentals(lowerVoices, 'C');
        }
        const formatter = new Formatter();
        if (upperVoices.length) formatter.joinVoices(upperVoices);
        if (lowerVoices.length) formatter.joinVoices(lowerVoices);
        const allVoices = [...upperVoices, ...lowerVoices];
        const content = allVoices.length ? formatter.preCalculateMinTotalWidth(allVoices) : 0;
        const left = Math.max(top.getNoteStartX(), bottom.getNoteStartX());
        const width = Math.max(minMeasureWidth, content + left - x + 2 * Stave.defaultPadding + 24);
        return { top, bottom, upperVoices, lowerVoices, formatter, allVoices, left, width };
      };

      let opening = x === firstX;
      let layout = create(opening, true);
      if (!opening && x + layout.width + padding > available) {
        row++;
        x = firstX;
        opening = true;
        layout = create(true, false);
      }

      const { top, bottom, upperVoices, lowerVoices, formatter, allVoices, left, width } = layout;
      top.setWidth(width).setNoteStartX(left);
      bottom.setWidth(width).setNoteStartX(left);
      const endX = Math.min(top.getNoteEndX(), bottom.getNoteEndX());
      if (allVoices.length) {
        formatter.format(allVoices, endX - left - Stave.defaultPadding, context ? { context } : {});
      }

      const events = [upper, lower].flatMap((groups, staff) =>
        groups.flatMap((group) => group.map((item) => ({ ...item, row, staff }))),
      );
      const connector = (kind: PianoDrawingMeasure['connectors'][number]['kind']) => ({
        kind,
        element: new StaveConnector(top, bottom).setType(kind),
      });
      drawing.push({
        staves: [top, bottom],
        events,
        voices: [
          ...upperVoices.map((voice) => ({ voice, stave: top })),
          ...lowerVoices.map((voice) => ({ voice, stave: bottom })),
        ],
        connectors: [
          ...(opening ? [connector('brace'), connector('singleLeft')] : []),
          connector('singleRight'),
        ],
      });

      snapshots.push({
        index: measure.index,
        systemIndex: row,
        sourceInterval: measure.sourceInterval,
        playableInterval: measure.playableInterval,
        writtenRange: measure.writtenRange,
        contentLeft: left,
        contentRight: endX,
        left: x,
        right: x + width,
        top: top.getYForLine(0),
        bottom: bottom.getBottomLineY(),
        ...anchorsFor(measure, events, left, endX, onsetsByMeasure.get(measure.index) ?? []),
      });
      x += width;
      right = Math.max(right, x);
    }

    const systems: LayoutSnapshot['systems'][number][] = [];
    for (const measure of snapshots) {
      const system = systems[measure.systemIndex];
      const bounds = {
        left: system?.left ?? measure.left,
        right: measure.right,
        top: measure.top,
        bottom: measure.bottom,
      };
      systems[measure.systemIndex] = { index: measure.systemIndex, ...bounds, staffBounds: bounds };
    }
    const last = snapshots.at(-1);
    const terminal = projection.measures.at(-1);
    const cutoff = terminal?.writtenPlaybackCutoff;
    const anchor = last?.anchors.find((item) => item.writtenTick === cutoff);
    const playbackEndAnchor =
      last && anchor ? { ...anchor, sourceBeat: last.playableInterval[1] } : null;
    const anchors: WrittenAnchor[] = snapshots.flatMap((measure) => measure.anchors);
    const snapshot: LayoutSnapshot = {
      version,
      systems,
      measures: snapshots,
      staffBounds: systems.map((system) => system.staffBounds),
      anchors,
      playbackEndAnchor,
    };

    return {
      snapshot,
      measures: drawing,
      ties: buildScoreTies(
        projection.continuities,
        drawing.flatMap((measure) => measure.events),
      ),
      diagnostics: projection.diagnostics,
      width: right + padding,
      height: (row + 1) * systemHeight + padding,
    };
  }

  render(container: HTMLDivElement, options: NotationRenderOptions, version = 0) {
    this.clear(container);
    const renderer = new Renderer(container, Renderer.Backends.SVG);
    const context = renderer.getContext();
    const { foreground } = NOTATION_LAYOUT;
    context.setFillStyle(foreground).setStrokeStyle(foreground);

    if (options.piano) {
      const drawing = this.layoutPiano(options, version, context);
      const zoom = options.zoom ?? 1;
      renderer.resize(drawing.width * zoom, drawing.height * zoom);
      context.scale(zoom, zoom);
      for (const measure of drawing.measures) {
        for (const stave of measure.staves) stave.setContext(context).draw();
        for (const connector of measure.connectors) connector.element.setContext(context).draw();
        for (const { voice, stave } of measure.voices) voice.draw(context, stave);
      }
      drawTies(context, drawing.ties);
      return { snapshot: drawing.snapshot, diagnostics: drawing.diagnostics };
    }

    const drawing = this.layoutStandard(options, context);
    renderer.resize(drawing.width, drawing.height);
    for (const { stave, voices } of drawing.measures) {
      stave.setContext(context).draw();
      for (const voice of voices) voice.draw(context, stave);
    }
    drawTies(context, drawing.ties);
    return { snapshot: undefined, diagnostics: drawing.diagnostics };
  }

  layoutStandard(options: NotationRenderOptions, context?: RenderContext) {
    const { padding, firstMeasureWidth, measureWidth, measuresPerRow, staffHeight } =
      NOTATION_LAYOUT;
    const { score, timeSignature: meter, clef = 'treble', showCents = true } = options;
    const events: RenderedEvent[] = [];

    const measures = score.measures.map((measure) => {
      const row = Math.floor(measure.index / measuresPerRow);
      const column = measure.index % measuresPerRow;
      const x = padding + (column === 0 ? 0 : firstMeasureWidth + (column - 1) * measureWidth);
      const stave = staveFor(
        x,
        padding + row * staffHeight,
        column === 0 ? firstMeasureWidth : measureWidth,
        column === 0,
        clef,
        meter,
      );
      if (context) stave.setContext(context);
      const groups = makeNotes(measure.voices, clef, showCents);
      const voices = createVoices(groups, stave, meter);
      if (voices.length) {
        Accidental.applyAccidentals(voices, 'C');
        const formatter = new Formatter().joinVoices(voices);
        if (context) formatter.formatToStave(voices, stave);
        else
          formatter.format(
            voices,
            stave.getNoteEndX() - stave.getNoteStartX() - Stave.defaultPadding,
          );
      }
      for (const group of groups) for (const item of group) events.push({ ...item, staff: 0, row });
      return { stave, voices };
    });

    return {
      measures,
      ties: buildScoreTies(score.continuities, events),
      diagnostics: score.diagnostics,
      width: firstMeasureWidth + (measuresPerRow - 1) * measureWidth + padding * 2,
      height: Math.ceil(score.measures.length / measuresPerRow) * staffHeight + padding * 2,
    };
  }

  clear(container: HTMLElement): void {
    container.replaceChildren();
  }
}

export const notationEngine = new NotationEngine();
