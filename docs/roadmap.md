# Music Lab roadmap

Stages 01–11D are complete, for a total of **14 of 22 stages**. Stage **11E** is next. The first four
stage labels describe a sequence of capabilities whose commits span several stages.
The completion criteria below describe how to verify each capability today or accept a
planned stage. They are documentation proposals and do not reconstruct past acceptance
criteria. No future dates or test outcomes are implied.

Dependencies indicate prerequisites for acceptance in the listed scope. Approved feature
specifications establish detailed requirements. See [architecture](architecture.md) and
[technical debt](technical-debt.md).

## Implemented stages

| Stage | Goal and delivered functionality | Dependencies | Completion criteria for verification | Status |
| --- | --- | --- | --- | --- |
| 01 · Project Setup | Establish the React/Vite/TypeScript project and runnable workspace. | — | A clean checkout can start the app and invoke the baseline build commands. | Implemented |
| 02 · Dependencies | Establish a locked application and development toolchain. | 01 | A compatible runtime can install the lockfile and invoke the declared tool scripts. | Implemented |
| 03 · Architecture | Establish module boundaries, styling tokens, and application structure. | 01, 02 | Entry points and aliases resolve, and UI and core responsibilities are identifiable in the tree. | Implemented |
| 04 · Mathematical Core | Implement frequency, pitch, intervals, harmonics, constants, and sequence primitives. | 03 | Deterministic numerical cases and boundary inputs can be checked through the core tests. | Implemented |
| 05 · Application Workspace | Deliver navigation, layout, transport controls, and frequency conversion. | 03, 04 | Users can navigate the implemented workspace and convert between supported pitch units. | Implemented |
| 06 · Audio Engine | Preview tones and chords using oscillator and additive synthesis with envelopes and volume. | 04, 05 | Supported frequencies can be auditioned and stopped after browser audio activation. | Implemented |
| 07 · Music Theory | Explore scales, chords, inversions, keys, harmony, progressions, and the circle of fifths. | 04–06 | Theory operations produce the expected intervals, and users can audition supported results. | Implemented |
| 08 · Geometry Laboratory | Present note clocks, spirals, harmonics, angle sequences, and Lissajous figures. | 04–06 | Geometric coordinates follow their declared mappings and supported pitches can be auditioned. | Implemented |
| 09 · Mathematical Composition | Generate, blend, quantize, and preview note sequences and Euclidean rhythms. | 06–08 | Identical generator inputs reproduce the pitch sequence, and current Composer integration transfers its notes. | Implemented |
| 10 · Composer & Sequencer | Edit and play multitrack compositions with local persistence, mix flags, undo, and redo. | 05, 06, 09 | Users can edit tracks and events, reopen saved state, and play, pause, stop, seek, and loop. | Implemented |
| 11A · Notation Core | Define pitches, durations, measures, tunings, and basic string positions. | 04, 10 | Supported notes and durations map to notation primitives and string candidates. | Implemented |
| 11B · Notation Engine | Prepare voices, measures, rests, and tie fragments and render a single SVG staff. | 11A | A supported track renders with the chosen clef, meter, and microtonal annotations. | Implemented |
| 11C · Tablature Engine & Chord Fingering | Render tablature and offer fingering alternatives with constraints and diagnostics. | 11A, 11B | Playable groups use available strings and respect the declared span. Unplayable events are reported. | Implemented |
| 11D · Piano Grand Staff & Sequencer Synchronization | Deliver aligned piano staves, shared derived rhythm with deviation diagnostics, source-linked ties across systems, and score navigation with Follow Playback. Share the composition Transport, isolate cursor updates, and gate editing during playback and startup. | 10, 11B | [Final verification](../specs/001-piano-grand-staff/verification.md#t042t045-final-technical-verification) records 45/45 tasks, 22/22 acceptance scenarios and 7/7 criteria, including offline production and owner listening. | Completed |

The repository audit recorded 186 passing Vitest tests across 10 files, successful ESLint and
TypeScript runs, and a successful production build with a large-chunk warning. That baseline
primarily covers domain code. It does not establish browser rendering or audio acceptance.

## Planned stages

| Stage | Goal and scope | Dependencies | Proposed completion criteria | Status |
| --- | --- | --- | --- | --- |
| 11E · Standard Notation & Tablature Synchronization | Coordinate timing, selection, and navigation across notation and instrument tablature. | 11C, 11D | Views identify the same source events and time positions, including split and unplayable events. | Planned |
| 11F · Interactive Score Editing | Apply supported score and tablature edits to the canonical composition. | 10, 11E | Supported edits, undo, redo, and validation remain consistent across views. Unsupported edits receive a clear diagnostic. | Planned |
| 12 · Project Storage, Import & Export | Introduce a versioned local project format and supported file exchange. | 10, canonical event contracts from 11A–11F | Verify offline round trips, migration, corrupted-input handling, and external format loss. Verify both tempo choices from [ADR-004](decisions/adr-004-mathematics-transfer-tempo.md) and specify versioned provenance with stage 14. | Planned |
| 13 · Musical & Mathematical Analyzer | Compute and report musical and mathematical descriptors for existing works. | 07, 10, 12 | Reference scores produce verifiable outputs with documented units, assumptions, and limits. Users can analyze supported imported works. | Planned |
| 14 · Scientific Experiments Laboratory | Record protocols, parameters, seeds, comparison conditions, and results. | 09, 12, 13 | A saved experiment reproduces outputs within declared tolerances. Manual edits preserve the original generation record per [ADR-005](decisions/adr-005-generation-provenance.md). | Planned |
| 15 · Realistic Instrument Engine & Mixer | Render realistic instruments and provide track and master mix controls. | 06, 10, 12 | Supported instruments and local resources play within documented limits, with verified gain, voice and resource lifecycle, and licensing. | Planned |
| 16 · Desktop Application | Package Music Lab in Tauri for approved platforms. | 12 and the capabilities selected for desktop release | A desktop package starts offline and opens, saves, and plays a supported local project on each approved target. | Planned |
| 17 · Performance, Stability & Release | Verify release quality with representative workloads and end-to-end flows. | Approved release scope from 11D–16 | Meet published performance budgets, pass release checks, and document configurations, known limits, and verification evidence. | Planned |
