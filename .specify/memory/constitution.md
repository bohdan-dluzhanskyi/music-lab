# Music Lab Constitution

## Core Principles

### I. Mathematical Accuracy

Formulas MUST be correct, documented, and verifiable. Each algorithm MUST define its units,
valid input domain, and limits. Mathematical functions MUST produce deterministic results
for identical inputs, including any required initial values or seeds. Approximations MUST state
their justification, applicable domain, and expected error or precision.

### II. Scientific Integrity

Experiments and reports MUST distinguish established facts, mathematical properties, hypotheses,
and subjective listening judgments. Claims about musical consonance or compositional intent MUST
have independent evidence beyond a detected mathematical pattern. Experiments MUST preserve the
original inputs and parameters, algorithm versions, initial values or seeds, and results
needed to reproduce them.

### III. Single Source of Truth

`Composition`, `Track`, `NoteEvent`, and `Pitch` MUST form the canonical musical model.
Piano Roll, staff notation, tablature, geometric views, analysis, and audio playback MUST use
this model. Derived data, caches, and playback snapshots MUST follow defined update rules.
Transformations between views MUST preserve source event identifiers, including when one source
event is displayed as multiple fragments.

### IV. Frequency and Time Preservation

The original frequency in hertz MUST be authoritative. Fractional MIDI, note name, octave,
and cents MUST be derived values. The model and playback MUST preserve microtonal frequency
within the audio engine's supported range. Musical time MUST be stored in quarter-note beats,
with conversion to seconds based on tempo. Quantization MUST be an explicit user operation.
Notation MAY approximate the display with a documented policy that preserves canonical
frequencies, positions, and durations.

### V. Domain Independence

Mathematical and musical rules MUST reside in `core`. The core MUST remain independent of
React, the DOM, Zustand, Tone.js, and VexFlow. Engines MUST handle interactions with external
rendering and audio libraries. The UI MUST handle presentation and user interaction and
delegate domain calculations to the core. Dependencies MUST remain acyclic, and shared
domain rules MUST have a single implementation.

### VI. Unified Playback

Composition views MUST share one Sequencer, one source of playback position, and consistent
Transport behavior for Play, Pause, Stop, Seek, and Loop. Visual cursors MUST follow the
Sequencer position. Cursor updates MUST be independent of full score rendering. Each affected
feature MUST specify which edits are allowed during playback and when they affect playback
and the displayed score.

### VII. Musical and Instrumental Correctness

Theory calculations MUST follow the declared tuning system. Notation MUST represent rhythm,
rests, voices, chords, and ties correctly within the documented support limits. Instrument
views MUST account for instrument range, tuning, and physical constraints. They MUST identify
unplayable notes or chords and document fingering algorithm limits. Automatic adaptation MUST
disclose any proposed change to musical material and require user approval before applying it
to the composition.

### VIII. Offline First and Data Ownership

Core workflows MUST run offline without a mandatory cloud service. Compositions, experiments,
and settings MUST be stored locally. Storage formats MUST be versioned, validated on read,
and have a migration strategy. Import and export MUST preserve source musical data wherever
the target format allows it and disclose any loss of precision or unsupported data.

### IX. Audio Quality

Playback MUST use the source frequencies within the audio engine's capabilities. Music Lab
MUST support mathematical synthesis, with realistic instrument sounds as a future capability.
Audio graphs MUST bound voice usage, guard against clipping, and release resources when they
are no longer needed. Instrument libraries and samples MUST have documented licenses compatible
with their use and distribution.

### X. Quality and Testing

New domain logic MUST have automated tests. Fixes for reproducible bugs MUST add regression
tests where technically feasible. Mathematical tests MUST cover boundary values and state
the tolerances used to verify numerical accuracy. Integration tests MUST cover changes to
consistency between views and playback. Changes affecting browser rendering or audio MUST
include direct verification of the affected behavior in a browser. Existing tests MUST retain
their coverage and assertions when updated. The stage completion gates below apply to every
implementation stage.

### XI. Performance and Scalability

Implementations MUST avoid redundant calculations, subscriptions, and renders. Playback position
updates MUST be isolated from expensive components. Features handling long compositions or large
sequences MUST define the workloads used for verification. Performance optimizations MUST be
justified by measurements on representative workloads. Numerical accuracy MUST meet the
documented tolerances after optimization.

### XII. User Experience and Design

Music Lab MUST prioritize desktop workflows. The interface MUST use a consistent, minimal
layout and reuse existing design tokens for the dark neutral palette and ash-green accent.
Interactive controls MUST have a task-related purpose and accessible labels, support keyboard
operation, and expose visible focus. Mathematical controls MUST explain the meaning and units
of parameters wherever interpretation is required.

### XIII. Specification-Driven Development

Each substantial feature MUST have user scenarios, requirements, assumptions, and verifiable
acceptance criteria before implementation. Its specification MUST explicitly carry forward the
applicable test obligations in Principle X so that the task generator includes them. Plans MUST
check compliance with this constitution and document significant architectural decisions. Tasks
MUST have verifiable outcomes. Work MUST stay within the approved scope and preserve existing
behavior except where the specification calls for a change. Technical debt MUST be tracked
separately. Reviews MUST record known errors, limits, and unverified assumptions.

### XIV. Architecture and Technology Governance

The current stack is React, TypeScript, Vite, SCSS, Zustand, Tone.js, VexFlow, and Vitest.
Tauri is the target desktop runtime. The project MUST retain its modular architecture unless an
approved specification requires a change. New dependencies MUST have a documented rationale
covering compatibility, licensing, performance, offline operation, and maintenance.

## Project Mission

Music Lab is an offline scientific and creative music laboratory for mathematics, geometry,
acoustics, music theory, composition, and analysis. It turns mathematical models into music,
supports mathematical analysis of musical works, and combines classical music theory with
mathematical algorithms to create new compositions. It serves both reproducible research and
practical music-making.

## Development Workflow and Quality Gates

Each substantial feature follows this Spec Kit sequence.

1. Specify the user scenarios, requirements, and acceptance criteria.
2. Clarify consequential ambiguities and record their resolution.
3. Checklist the completeness and testability of the requirements.
4. Plan the implementation and check it against the constitution.
5. Generate Tasks with dependencies and verifiable outcomes.
6. Analyze consistency across the specification, plan, and tasks.
7. Implement the approved tasks.
8. Verify acceptance criteria and record evidence.
9. Apply Converge when verification identifies outstanding implementation work.

Before closing each implementation stage, run ESLint, TypeScript, Vitest, and the production
build. Record their results along with the applicable browser and audio verification evidence.
Record the scope and rationale for any verification that remains outstanding.

## Governance

This constitution takes precedence over feature plans. Plans and implementation reviews MUST
identify applicable principles and document how compliance is verified. Exceptions MUST be
approved before implementation, with their scope, rationale, impact, and review condition
recorded in the affected feature artifacts.

Amendments MUST document the rationale, intended effect, approval, and any transition required
for existing work. Each amendment MUST review dependent templates and commands for consistency.
Use a MAJOR version for incompatible changes or removals, a MINOR version for compatible new
principles or material expansions, and a PATCH version for non-semantic clarifications.

**Version**: 1.0.0 | **Ratified**: 2026-11-27 | **Last Amended**: 2026-11-27
