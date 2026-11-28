# Implementation Plan: Piano Grand Staff & Sequencer Synchronization

**Branch** `main` | **Feature** `001-piano-grand-staff` | **Date** 2026-11-27 | **Spec** [11D](spec.md)

## Summary

Extend the shared score preparation path to derive valid written rhythm from exact source
events. Render the selected track as an aligned treble and bass pair. Route Notation to
the existing composition Transport and project the Sequencer beat onto published score
geometry. Guard composition mutations for playback startup and playback. The Spec Kit feature
identifier is `001-piano-grand-staff`; the checked-out Git branch is `main`.

## Technical Context

| Area | Baseline and plan |
| --- | --- |
| Language and dependencies | TypeScript 6, React 19, Vite 8, SCSS, Zustand 5, Tone.js 15, VexFlow 5.11.0. Reuse the lockfile. |
| Storage | Existing versioned browser persistence stays unchanged. Derived score, geometry, follow state and playback locks are transient. |
| Platform | Existing offline-capable desktop-oriented browser application. |
| Verification | Vitest domain and integration tests, browser and actual audio checks, ESLint, TypeScript and production build. Preserve the 186-test audited baseline and assertions. |
| Performance | Zero full-score redraws from cursor movement and zero repeated scrolling while the active system is visible. Measure workloads in [quickstart](quickstart.md). Use measured latency and memory baselines to establish budgets. |
| Scope | Selected-track notation, whole-composition playback, common preparation for four modes, and guards at current mutation entry points. |

## Constitution Check

| Gate | Before design | After design |
| --- | --- | --- |
| Mathematical correctness and exact data, I–IV | Approved spec and ADR-001 require deterministic, display-only changes. | Exact input is preserved. The pure step contract and proof requirements separate exact, certified, bounded and partial results. |
| Domain independence and playback, V–VI | Existing score preparation is in core, and shared Sequencer is required. | Core remains framework-free. Independent adapters consume a monotone cursor map and shared transport. The edit gate avoids reverse store dependencies. |
| Notation, offline operation and audio, VII–IX | The approved scope uses existing engines and persistence. | Staff-local rests are validated and final-bar padding is visual only. Per-event leases reuse the existing audio context. The blocked-network production check verifies offline operation without storage changes. |
| Verification and performance, X–XI | Existing baseline plus integration and actual environment verification are required. | Traceability includes exhaustive reference cases, 8/64/256-bar workloads, main-thread blocking, cancellation and audio ownership. Measurements are pending implementation. |
| UX, SDD and stack, XII–XIV | Approved design language and 11D scope apply. | Current tokens, keyboard access and reduced motion are retained. No dependencies or exceptions proposed. |

## Project Structure

### Documentation (this feature)

- [Specification](spec.md) and [requirements checklist](checklists/requirements.md)
- [Research](research.md) and [data model](data-model.md)
- [Notation rendering and navigation contract](contracts/notation-rendering.md)
- [Shared playback contract](contracts/playback.md)
- [Quickstart and acceptance verification](quickstart.md)

### Source Code (repository root)

| Existing area | Reuse and planned change |
| --- | --- |
| `src/core/types/{music,composition}.types.ts` | Keep Composition, Track, NoteEvent, Pitch and persistence shape. Extend transient playback status only. |
| `src/core/notation/{score,rhythm,voices,measures,duration,tablature}.ts` | Evolve prepareScore and reuse meter, duration vocabulary, pitch and string mapping. Replace failing greedy decomposition and extend stable onset grouping. Isolate placement search in one notation-core module if needed. |
| `src/engines/notation/` | Extend NotationEngine for a paired view, shared timing, per-note ties, and returned geometry. Adapt TablatureEngine to the same preparation rules and keep its instrument-specific fingering. |
| `src/pages/NotationPage/` and `src/features/notation/` | Add Piano, split pitch, measure navigation, zoom, Follow Playback, and score diagnostics. Separate cursor and viewport behavior from score layout using a small focused controller or hook. Reuse cents, track selector, SCSS tokens and existing wrappers where applicable. |
| `src/engines/audio/{Sequencer,AudioEngine}.ts` | Keep existing synthesis and preview graphs. Use lazy event-scoped voices and audio-context refill under the existing Sequencer ownership. Strengthen cancellation and disposal. AudioEngine remains the preview service. |
| `src/stores/{composition,sequencer}.store.ts` | Keep existing stores. Add a small independent edit gate, explicit initialization phase and coherent session replacement. |
| `src/components/Transport/`, Composer, Piano Roll and Mathematics | Add Notation to composition Transport. Update lock-aware controls and guard all mutation commands including the Mathematics transfer entry point. |
| `src/tests/` | Extend pure domain, score renderer, store, and Sequencer verification using current tools. Browser and actual audio validation use the quickstart. |

**Structure decision** — Keep one application and the existing core, engine, store and UI
layers. New code is limited to independently testable placement, edit gating and
viewport behavior where those responsibilities need a clear boundary.

## Design sequence

Define the resumable search contract and canonical field identifiers first. Extend shared
rhythmic preparation and fixtures, then freeze the prepared-score input before adapting
both renderers. Piano uses this input from its first increment. Extend the same renderer
for ties and Standard compatibility. Tablature consumes the same input. A single host
session prepares all modes and shares one result in Both. Publish piano geometry. Extend playback
ownership and mutation protection against the same composition model. Connect the
cursor, navigation and follow behavior, then run the full verification matrix.

The layout accepts canonical snapshots and settings as inputs. Source quarter-note beats
remain the authority for playback and cursor lookup. Written integer ticks describe the
rendered score. Projection retains prepared voices and replaces removed tokens with legal
rests, so moving the split preserves written positions. The final bar may extend visually
past the effective playback end and includes a separate terminal cursor anchor. Track,
split, zoom, content and geometry changes invalidate the applicable layout. Clear queued
obsolete work and publish only matching results. Cursor-only movement updates the overlay.

## Requirement traceability

Scenario references use story and scenario numbers from the approved specification.

| Requirement | Architecture component | Verification |
| --- | --- | --- |
| FR-001 | Paired layout, staff projection and visual bar padding | Browser US1.1–3, US1.6 and US2.4, plus split-gap and final-bar fixtures. SC-001. |
| FR-002 | Source-frequency split and range diagnostics | Unit boundary cases and browser US1.1–5. SC-001, SC-007. |
| FR-003 | Shared preparation and diagnostics | Exhaustive small-case oracle, budget and determinism fixtures, browser US2.1, US2.3–5 and US4.3, source and audio invariants. SC-002, SC-007. |
| FR-004 | Source-linked fragments and rendered ties | Identity tests and same-system and cross-system browser US2.2. SC-003. |
| FR-005 | Shared Transport, store and Sequencer | Store and audio integration, browser US3.1–3. SC-004. |
| FR-006 | Published layout geometry and cursor overlay | Monotone mapping and invalidation tests, browser US3.2, terminal cutoff and redraw counters. SC-004. |
| FR-007 | Measure navigation and follow controller | Browser US3.3–7, reduced motion and manual scroll checks. SC-004. |
| FR-008 | Composition edit gate and phase transitions | Each mutation action and cross-route flows, US4.1–2. SC-006. |
| FR-009 | Owned playback replacement and clip helper | Fast-seek integration and audible US3.8. SC-005. |
| FR-010 | Existing pitch and cents formatting | Unit and audio comparisons, browser US1.5. SC-007. |
| FR-011 | Notation controls and design tokens | Keyboard, focus and visual review, US4.3. SC-007. |

## Risks, open verification and scope

- **Rhythmic search.** Treat the initial frontier and probe limits as engineering
  values. Validate fair allocation, safe budget exhaustion and deterministic output on
  representative workloads. Measure main-thread blocking and stale-work cancellation
  alongside throughput. Certification is required before claiming optimality.
- **Layout adapter.** Confirm multi-voice alignment, dotted rests, duplicate chord
  pitches, and open ties on real SVG with the installed VexFlow. Scroll and resize must
  reject stale geometry. Source-to-layout mapping must remain stable around barlines.
- **Audio cancellation.** Verify rapid seek, initialization failure, backgrounded
  playback and graph disposal on real audio. Treat any discrepancy as unresolved until
  actual playback verifies it.
- **TD-001–004 and TD-013** are directly in scope. Address cursor isolation and
  measure work identified by TD-009 as needed for 11D. Guard Mathematics transfer during
  playback without expanding TD-005 into tempo policy or provenance work.
  The unlocked transfer sets the Mathematics Lab BPM after import, as now recorded in
  ADR-004 and TD-005. The approved future choice is unchanged.
  See the [debt register](../../docs/technical-debt.md).
- Exclude 11E and 11F, arbitrary tuplets, file exchange, provenance, instrument samples,
  lab and desktop expansion, TypeScript strict migration and unrelated refactors.
  No new dependency is proposed. Any such dependency requires separate approval.
- Approval of this design precedes task generation. There are no unresolved product
  clarifications. Empirical performance and browser compatibility remain to be verified.

## Complexity Tracking

No constitution exceptions are proposed. Bounded search, explicit graph lifecycle and
separate cursor geometry are necessary for the approved rhythm and playback behavior.
