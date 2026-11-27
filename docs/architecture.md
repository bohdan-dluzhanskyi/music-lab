# Music Lab architecture

This document records the current implementation through 11C and the responsibilities
anticipated by the [roadmap](roadmap.md). Planned entries describe capabilities. Their module
layout, APIs, file formats, and technology choices require an approved feature plan.

## Component map

| Component | Status | Responsibility and dependencies |
| --- | --- | --- |
| Mathematical Core | Implemented | Constants, angles, and Fibonacci arithmetic in [core/mathematics](../src/core/mathematics). Supplies numerical definitions to the other cores. |
| Music Theory Core | Implemented | Frequency and pitch conversions, intervals, harmonics, scales, chords, keys, and harmony in [core/music](../src/core/music). Uses domain types and numerical operations. |
| Geometry Core | Implemented | Note clock, spirals, chord coordinates, angle sequences, and Lissajous samples in [core/geometry](../src/core/geometry). Uses mathematics and pitch conversions. |
| Composition Core | Implemented | Composition and track construction, sequence generators, blending, quantization, rhythm, scheduling helpers, and beat conversion in [core/composition](../src/core/composition). Uses music, mathematics, and geometry. |
| Notation Core | Implemented through 11C | Pitch spelling, rhythmic decomposition, voices, measures, score fragments, and tablature preparation in [core/notation](../src/core/notation). Consumes canonical note events. |
| Analysis Core | Planned, 13 | Derive and describe measurable features of canonical works with declared tuning, segmentation, and units. |
| Instrument Core | Partial, expanded in 15 | String tunings and physical fingering constraints live in [core/notation](../src/core/notation). General instrument ranges, capabilities, and playable articulations are future scope. |
| Audio Engine | Implemented, expanded in 15 | [AudioEngine](../src/engines/audio/AudioEngine.ts) wraps Tone.js for synthetic preview, envelopes, gain, and limiting. Realistic instrument rendering is planned. |
| Sequencer | Implemented, expanded in 11D | [Sequencer](../src/engines/audio/Sequencer.ts) schedules a composition snapshot through Tone.js track channels and derives the playback position from the audio clock. |
| Notation Engine | Implemented through 11C | [Notation adapters](../src/engines/notation) prepare events through the core and render a single staff or tablature with VexFlow. Multiple staves, coordinated views, and editing are planned. |
| Import/Export Engine | Planned, 12 | Validate and translate external data at the boundary, reporting unsupported fields and precision loss. A lab-to-Composer transfer already exists inside the application. |
| Storage Engine | Partial capability, dedicated work planned in 12 | [Composition store](../src/stores/composition.store.ts) currently persists a versioned composition and selected track using Zustand browser storage. Project files, validated recovery, and migration are future scope. |
| Experiment Engine | Planned, 14 | Capture inputs and versions, run or reproduce a documented protocol, and record measurements and artifacts. Current generators expose deterministic starting parameters. |
| Application UI | Implemented, expanded across the roadmap | React pages and feature components use Zustand and the engines. The hash router wires the workspace and labs. Analyzer, Experiments, Instruments, Mixer, and Settings still use a generic workspace page. |
| Desktop Runtime | Planned, 16 | Tauri will host the desktop application. The current entry point runs in a browser through Vite. |

## Canonical model and boundaries

- [Composition and Track](../src/core/types/composition.types.ts) describe project-level BPM,
  meter, length, tracks, synthesis parameters, and mix flags.
- [NoteEvent and Pitch](../src/core/types/music.types.ts) carry a stable event ID, track ID,
  start, duration, velocity, source frequency in Hz, and derived fractional MIDI, note name,
  octave, and cents. Start and duration use quarter-note beats.
- Views derive layout from the same events. When a note crosses a barline, score segments
  retain the source note ID. Scale quantization changes the generated or edited material
  through an explicit operation. Under [ADR-001](decisions/adr-001-exact-musical-data-preservation.md),
  notation derives the nearest supported rhythm with a visible deviation. The derived layout
  preserves source IDs and leaves frequency and timing unchanged.
- The core works on data and domain rules. Engines adapt domain results to external APIs.
  UI coordinates user actions and presents results. Local state and external files belong
  at application boundaries, with validation and migration tracked in stage 12.

## Data flow

1. Labs generate a frequency or sequence through the core. Preview requests pass through
   the audio store to AudioEngine. Transferring a sequence creates a track and canonical notes.
2. Composer and Piano Roll read and edit the composition store. The store owns undo and redo.
   Browser persistence currently covers the composition and selected track. Undo history and
   transient playback state remain in memory.
3. Notation selects a track, prepares measures, voices, rests, and ties, then renders SVG.
   Tablature also maps note IDs to string and fret positions before rendering.
4. Transport starts the Sequencer from a snapshot of the composition. The Sequencer converts
   beats to audio time using tempo and applies mute and solo. The sequencer store publishes
   the audio-derived beat position to Timeline and Piano Roll.
5. Notation currently uses the preview mode of Transport. Stage 11D will bring score views
   onto the same playback position without coupling cursor updates to full SVG layout.
   [ADR-002](decisions/adr-002-playback-editing-policy.md) blocks musical edits during
   initialization and playback. Pause and Stop restore editing, and resume uses the latest
   composition. Navigation, track selection, zoom, and master volume remain available.
6. [ADR-003](decisions/adr-003-seek-behaviour.md) defines seek within a sustained note.
   Schedule the original frequency with a fresh attack for the remaining duration, respect
   mute, solo, and track gain, and replace the obsolete queue without duplicate events.
7. A future Mathematics transfer will keep the destination tempo by default and offer
   explicit adoption of generator BPM under [ADR-004](decisions/adr-004-mathematics-transfer-tempo.md).
   [ADR-005](decisions/adr-005-generation-provenance.md) preserves reproducible generation
   inputs across subsequent edits. Stages 12 and 14 will specify the storage schema.

The project store owns lab settings and master volume, while the composition store owns
composition BPM and meter. Preview and sequencing have separate audio graphs. The
[debt register](technical-debt.md) records interactions between these boundaries.
