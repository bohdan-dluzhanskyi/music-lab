# Tasks: Piano Grand Staff & Sequencer Synchronization

**Feature** `001-piano-grand-staff` · Roadmap 11D

**Inputs** [Spec](spec.md), [Plan](plan.md), [Research](research.md),
[Data model](data-model.md), [Rendering contract](contracts/notation-rendering.md),
[Playback contract](contracts/playback.md), [Quickstart](quickstart.md),
[Requirements checklist](checklists/requirements.md), and
[Constitution](../../.specify/memory/constitution.md).

## Format

Each item uses `- [ ] Tnnn [P?] [USn?] Description with file path`.
Paths beginning with `src/` refer to the repository root. New module and test paths below
are planned files. References such as `Measure.writtenRange` name fields in the
linked data model even where it describes fields in prose. Write each test before its
corresponding implementation and observe the applicable regression or new case fail first.
Keep the audited 186-test baseline and its assertions. Test names and paths allow checks
to run independently with Vitest.

## Phase 1: Setup (Shared Infrastructure)

**Dependencies** Approved 11D artifacts and existing locked dependencies.

- [X] T001 Verify repository scope and record the pre-change ESLint, TypeScript, Vitest and production-build results in `specs/001-piano-grand-staff/verification.md` using `package.json` and the commands in `specs/001-piano-grand-staff/quickstart.md`. Account for any difference from the audited 186 tests before changing code.
- [X] T002 Add reusable, deterministic score, transport and pre-11D persistence fixtures in `src/tests/fixtures/pianoGrandStaff.ts` using the quickstart fixture definitions and existing canonical types. Include exact, off-grid, split, multi-voice, final-bar, seek and mixed-track inputs.

**Exit check** Baseline and known pre-existing findings recorded. Fixtures are reusable
across phases and use the current persistence payload.

## Phase 2: Foundational (Blocking Prerequisites)

**Dependencies** T001–T002. Implements the shared rhythm and score contracts consumed by
both P1 stories. Establishes the independent lock primitive used by later playback work.

- [X] T003 [P] Add tests for the 21 rhythm values, the 76-tick greedy regression and minimum-fragment tie-breaking in `src/tests/notationRhythm.test.ts`.
- [X] T004 [P] Add the exhaustive small-measure oracle and tests for endpoint cost, order, simultaneity, bar pins, non-overlap, determinism, all four result classes, budget exhaustion and fair allocation. Include the independent multi-bar oracle for tied endpoint costs with different fragment/tie counts, and step-size invariance and resumed incumbent tests in `src/tests/notationPlacement.test.ts`.
- [X] T005 [P] Add shared-score tests for exact source snapshots, simultaneous onsets with different durations, voices, rests, source-linked ties, affected-ID diagnostics and final-bar padding in `src/tests/notationEngine.test.ts`. Verify the playback cutoff for an end at beat 5.5 and a tail smaller than one token. Add a persisted canonical payload regression in `src/tests/composition.test.ts` for unchanged scheduling inputs and effective length.
- [X] T006 [P] Add lock lifecycle tests for ownership, transfer and stale release in `src/tests/compositionEditGate.test.ts`.
- [X] T007 Define derived score fields alongside existing notation types in `src/core/types/notation.types.ts`, citing [data-model.md](data-model.md#derived-score) for `Measure.index`, `Measure.sourceInterval`, `Measure.playableInterval`, `Measure.writtenRange`, `Measure.voices`, `Measure.writtenPlaybackCutoff`, `Measure.visualTail`, `OnsetGroup.sourceOnsetBeat`, `OnsetGroup.sourceNoteIds`, `OnsetGroup.writtenOnsetTick`, `Voice.id`, `Voice.segments`, `WrittenEvent.id`, `WrittenEvent.voiceId`, `WrittenEvent.measureIndex`, `WrittenEvent.startTick`, `WrittenEvent.durationTicks`, `WrittenEvent.baseDuration`, `WrittenEvent.dots`, and `WrittenEvent.sourceNoteIds`.
- [X] T008 Extend derived outputs in `src/core/types/notation.types.ts` with [data-model.md](data-model.md#derived-score) citations for `WrittenContinuity.sourceNoteId`, `WrittenContinuity.fragmentEndpoints`, `TimingDeviation.sourceNoteId`, `TimingDeviation.sourceTiming`, `TimingDeviation.writtenTiming`, `TimingDeviation.deviations`, `PreparationResult.classification`, `PreparationResult.localResults`, `PreparationResult.certificationEvidence`, `Diagnostic.code`, `Diagnostic.scope`, `Diagnostic.message`, `Diagnostic.timing` and `Diagnostic.reason`. Before T012–T014, define pure search initialization and bounded-step signatures and the state fields from [data-model.md](data-model.md#render-and-interaction-state) `SearchState.frontier`, `SearchState.bestCandidate`, `SearchState.position`, `SearchState.remainingBudgets`, `SearchState.certificationEvidence` and `SearchState.orderingState`.
- [X] T009 [P] After T003 and T007–T008, implement the 256-tick vocabulary and minimum-fragment reachability table in `src/core/notation/duration.ts` and `src/core/notation/rhythm.ts`, wiring the [data-model.md](data-model.md#derived-score) constraints on `WrittenEvent.durationTicks`, `WrittenEvent.baseDuration` and `WrittenEvent.dots`. Retain exact representable decompositions and stable token ordering.
- [X] T010 [P] After T006, implement the non-persisted ownership gate in `src/stores/compositionEditGate.ts` with the [data-model.md](data-model.md#render-and-interaction-state) constraint on `PlaybackSession.editLock`. Keep it independent of both stores.
- [X] T011 Wire stable onset groups, chord atoms, source voices and measure intersections in `src/core/notation/voices.ts` and `src/core/notation/measures.ts`. Enforce the [data-model.md](data-model.md#derived-score) rules for `OnsetGroup.writtenOnsetTick`, `Voice.segments` and `Measure.sourceInterval`.
- [X] T012 Implement measure-local absolute placement and certified objective ranking in `src/core/notation/placement.ts` after T004 and T009–T011. Use the T008 step contract and research-defined objective, tolerances, constraints and final cutoff. Prove dominance and global composition across bar signatures before certifying. Leave complete uncertified results bounded. Cite [data-model.md](data-model.md#derived-score) for `Measure.writtenPlaybackCutoff` and `PreparationResult.certificationEvidence`.
- [X] T013 Add deterministic measure and score quotas, fair probe distribution, resumable work units across initialization, search and finalization, legal partial retention, per-event omission diagnostics and exact/optimal/bounded/partial evidence in `src/core/notation/placement.ts`. Use the preliminary research limits and distinguish proven infeasibility, search exhaustion and display limits per [data-model.md](data-model.md#derived-score) `PreparationResult.classification` and `Diagnostic.scope`.
- [X] T014 Extend the existing entry point in `src/core/notation/score.ts` with the shared draft and result flow, positive note/rest tokens, source-linked ties, padded final measure and diagnostics. Consume the [data-model.md](data-model.md#canonical-inputs) fields `Composition.lengthBeats`, `Composition.timeSignature`, `Composition.tracks`, `Track.notes`, `NoteEvent.id`, `NoteEvent.trackId`, `NoteEvent.pitch.frequency`, `NoteEvent.startBeat`, `NoteEvent.durationBeats`, `NoteEvent.velocity`, `ScoreInput.notes`, `ScoreInput.effectiveLengthBeats`, and `ScoreInput.timeSignature` without mutating canonical data. Emit the linked [derived fields](data-model.md#derived-score) `WrittenContinuity.sourceNoteId`, `TimingDeviation.sourceTiming`, `TimingDeviation.writtenTiming`, `TimingDeviation.deviations`, and `Measure.visualTail`.
- [X] T015 Run the foundational regression and oracle suites in `src/tests/notationRhythm.test.ts`, `src/tests/notationPlacement.test.ts`, `src/tests/notationEngine.test.ts` and `src/tests/composition.test.ts`. Confirm source IDs, exact timing, velocity and pitch, effective length and scheduling inputs stay equal after shared score preparation.

**Exit check** Exact and approximate cases pass the oracle and regression suites.
Unplaceable fixtures have diagnostics without invalid voices, canonical mutation or
playback padding. No storage schema changes. Independent from renderer, Zustand,
Tone.js and DOM for the score and rhythm code.

## Phase 3: User Story 1 - Read a piano part (Priority: P1)

**Dependencies** Phase 2.

**Independent test** With playback stopped, open treble-only, bass-only, empty and
split-chord tracks. Change the split and cents setting. Compare source data and measure
positions. Inspect rendering and controls in US1.1–US1.6.

### Tests for User Story 1

- [X] T016 [P] [US1] Add pure projection tests with threshold/range edges, changing split, unchanged written positions, simultaneous attacks and staff-local gap reachability, including a 4-tick false gap and invalid projection fallback, in `src/tests/pianoStaffProjection.test.ts`.
- [X] T017 [P] [US1] Add rendering-contract tests for aligned staff timing, connectors, complete rests, written-to-formatted geometry and stale publication in `src/tests/pianoNotationRendering.test.ts`. Leave actual SVG appearance to manual acceptance.

### Implementation for User Story 1

- [X] T018 [US1] Implement deterministic staff projection in `src/core/notation/pianoStaffProjection.ts`. Compare source pitch to the selected split and A0–C8, preserve voice/token spans, replace removed note spans with legal rests, validate empty/partial staffs and retain diagnostics per [data-model.md](data-model.md#derived-score) `OnsetGroup.writtenOnsetTick`, `Voice.segments`, `WrittenEvent.startTick` and `Diagnostic.scope`.
- [X] T019 [US1] Extend `src/engines/notation/NotationEngine.ts` and `src/engines/notation/constants.ts` to accept the prepared result from T014, using the verified paired-staff formatter, brace and synchronized barlines, treble/bass, meter, multi-voice rests/chords and existing cents spelling. Preserve existing single-staff rendering.
- [X] T020 [US1] Publish the versioned geometry contract from `src/engines/notation/NotationEngine.ts` and `src/engines/notation/scoreGeometry.ts` using shared tick offsets, measure/system extents, terminal cutoff and formatted anchor coordinates. Cite [data-model.md](data-model.md#render-and-interaction-state) `LayoutSnapshot.version`, `LayoutSnapshot.systems`, `LayoutSnapshot.measures`, `LayoutSnapshot.staffBounds`, `LayoutSnapshot.anchors` and `LayoutSnapshot.playbackEndAnchor`.
- [X] T021 [US1] Add Piano mode, split and zoom controls, range reporting, existing cents option, and accessible labels, keyboard and focus styling in `src/pages/NotationPage/NotationPage.tsx`, `src/pages/NotationPage/NotationPage.scss`, `src/features/notation/StaffNotation/StaffNotation.tsx`, `src/features/notation/StaffNotation/StaffNotation.scss` and `src/core/types/notation.types.ts`. Apply [data-model.md](data-model.md#canonical-inputs) `ScoreInput.mode`, `ScoreInput.splitPitch`, `ScoreInput.zoom`, `ScoreInput.clef` and `ScoreInput.showCents` as display-only preferences. For the US1 checkpoint, call T014 from the page or its host session, then pass the result into the renderer. T027 completes the same host path for all modes.

**Exit check** Piano renders independently of playback and legacy views still open;
staff-local gaps validate and split changes leave written positions intact.

## Phase 4: User Story 2 - Read exact and approximate rhythms (Priority: P1)

**Dependencies** Phase 2 and the US1 render surface for Piano coverage.

**Independent test** Load the same saved off-grid fixture into Piano, Standard,
Tablature and Both. Inspect deviations, ties, safe partial output and exact source data
with playback stopped. Covers US2.1–US2.5.

### Tests for User Story 2

- [X] T022 [P] [US2] Add Standard and Piano adapter regressions for source-ID tie fragments within/across bars and across systems, same-pitch repeats, and explicit diagnostic routing in `src/tests/scoreNotationCompatibility.test.ts`.
- [X] T023 [P] [US2] Extend `src/tests/tablature.test.ts` with shared timing/deviation and partial-output cases, preserving existing source fingering and unplayable-event behavior.
- [X] T024 [P] [US2] Add deterministic work-slicing, cancellation and stale snapshot fixtures, including cancellation within a difficult measure and different slice sizes at a fixed budget in `src/tests/scorePreparationSession.test.ts`.

### Implementation for User Story 2

- [X] T025 [P] [US2] After T022–T024, extend the existing T019 prepared-result path in `src/engines/notation/NotationEngine.ts` for Standard and Piano to render source-keyed full/partial system ties per `specs/001-piano-grand-staff/contracts/notation-rendering.md`. Verify chord member identity and preserve current clef and cents behavior.
- [X] T026 [P] [US2] After T022–T024, adapt `src/engines/notation/TablatureEngine.ts`, `src/core/notation/tablature.ts` and `src/features/notation/Tablature/Tablature.tsx` to the same frozen T014 prepared-result input used by T019 and T025, including written spans and diagnostics. Neither adapter calls prepareScore. Preserve physical fingering decisions and [data-model.md](data-model.md#canonical-inputs) `ScoreInput.tuning`. Keep T025 and T026 on separate adapter files.
- [X] T027 [US2] After T025 and T026, make the host preparation session the sole caller of the bounded preparation API from T008 and T012–T014 for all modes and deliver one identical prepared result to both adapters in Both. Schedule bounded work and enforce request ownership using [data-model.md](data-model.md#render-and-interaction-state) `PreparationSession.requestId`, `PreparationSession.inputIdentity` and `PreparationSession.searchState` in `src/features/notation/scorePreparationSession.ts` and `src/pages/NotationPage/NotationPage.tsx`. Prevent obsolete score, layout and diagnostics from publishing under [data-model.md](data-model.md#render-and-interaction-state) `LayoutSnapshot.version`.
- [X] T028 [US2] Present result distinctions, exact versus approximate source/display details and omission reasons on the existing page in `src/pages/NotationPage/NotationPage.tsx` and `src/pages/NotationPage/NotationPage.scss`, covering [data-model.md](data-model.md#derived-score) `PreparationResult.classification`, `TimingDeviation.deviations` and `Diagnostic.message`. Maintain source snapshots and no cursor in Standard or Tablature.

**Exit check** Cross-mode rhythm, legacy tablature, within/across-system ties,
save/reopen and stale-work checks pass. Source data and scheduling are unchanged.

## Phase 5: User Story 3 - Follow and navigate composition playback (Priority: P2)

**Dependencies** Phase 2 lock primitive, US1 geometry and US2 preparation for full
end-to-end coverage. Playback tests and engine work can begin independently of notation
work once their own prerequisites are met.

**Independent test** Play the multitrack fixture from Notation, navigate measures across
systems, seek into sustained events and toggle follow while checking cursor and audio.
Covers US3.1–US3.8.

### Tests for User Story 3

- [x] T029 [P] [US3] Add audio and store integration cases for initializing and interruption, current-session guard, muted/solo/gain mixing, rapid Seek and Loop, fresh attack for remaining time, obsolete schedules, voice reuse and resource disposal. Exercise overlapping equal and close microtonal frequencies, including reversed release order, Seek inside both notes, Loop and Stop, in `src/tests/sequencer.integration.test.ts`.
- [x] T030 [P] [US3] Add monotone cursor geometry and navigation tests over conflicting anchors, rests, empty measures, score end/padding and new layout versions in `src/tests/scoreCursor.test.ts`.
- [x] T031 [P] [US3] Add follow state tests for transitions, no repeated scrolls, manual suspension vs programmatic movement, reduced motion, Pause, Stop, Seek and Loop in `src/tests/scoreFollow.test.ts`.

### Implementation for User Story 3

- [x] T032 [US3] Implement session ownership, cancellable audio-context refill, source interval clipping and pooled event-scoped Tone.Synth leases in `src/engines/audio/Sequencer.ts`, `src/core/composition/composition.ts` and the transient `ScheduledNote` type in `src/core/types/composition.types.ts`. Preserve [data-model.md](data-model.md#canonical-inputs) `Track.muted`, `Track.solo`, `Track.volume`, `Track.synth`, `Track.id`, `Composition.bpm`, `NoteEvent.id`, `NoteEvent.trackId`, `NoteEvent.pitch.frequency`, `NoteEvent.velocity`, `NoteEvent.startBeat` and `NoteEvent.durationBeats`. Use [data-model.md](data-model.md#render-and-interaction-state) `VoiceLease.sessionId`, `VoiceLease.trackId`, `VoiceLease.sourceNoteId`, `VoiceLease.attackAt`, `VoiceLease.releaseAt`, `VoiceLease.reusableAfter` and `VoiceLease.token`. Verify exact-end Seek, per-event reattack and release, session deduplication and pool cleanup.
- [x] T033 [US3] Extend `src/core/types/composition.types.ts` and `src/stores/sequencer.store.ts` with the initializing phase, lock ownership through Seek/Loop replacement and current-session completion checks. Cite [data-model.md](data-model.md#render-and-interaction-state) `PlaybackSession.pendingTargetBeat`, `PlaybackSession.positionBeat`, `PlaybackSession.phase`, `PlaybackSession.loop`, `PlaybackSession.error`, `PlaybackSession.requestId`, `PlaybackSession.composition` and `PlaybackSession.editLock`. Retain the existing audio clock and preview engine boundary.
- [x] T034 [US3] Wire Notation to composition Transport in `src/components/Transport/Transport.tsx` and `src/components/Transport/Transport.scss`. Show current phase and composition BPM, retain master volume and lab preview, and keep view changes from implicitly restarting playback.
- [x] T035 [US3] Implement monotone mapping and independent overlay in `src/engines/notation/scoreGeometry.ts` and `src/features/notation/StaffNotation/PlaybackCursor.tsx`. Use [data-model.md](data-model.md#render-and-interaction-state) `Cursor.systemIndex`, `Cursor.x`, `Cursor.sourceBeat`, `Cursor.layoutVersion` and `LayoutSnapshot.playbackEndAnchor`. Drop conflicting optional anchors, validate geometry and update without full-score redraw.
- [x] T036 [US3] Implement measure seek and Follow Playback transitions in `src/features/notation/StaffNotation/scoreFollow.ts`, `src/features/notation/StaffNotation/StaffNotation.tsx` and `src/pages/NotationPage/NotationPage.tsx`. Expose accessible follow and navigation controls, apply reduced motion, clamp padded-tail requests and enforce [data-model.md](data-model.md#render-and-interaction-state) `FollowState.mode` with no change to playback or source data from scrolling.

**Exit check** Store/audio doubles verify replacement and cleanup. Actual score viewport
acceptance is independently runnable from Notation. Manual playback evidence closes
in the final phase.

## Phase 6: User Story 4 - Review playback without changing the score (Priority: P2)

**Dependencies** T010, T033 and T034. Full cross-view regression includes the paired
score and cursor from US1–US3.

**Independent test** Attempt edits from multiple routes during startup and playback.
Pause or stop, edit, then resume and check the latest source snapshot. Covers US4.1–US4.3.

### Tests for User Story 4

- [x] T037 [P] [US4] Add guarded mutation and persisted-shape tests in `src/tests/compositionEditProtection.test.ts` for note, track and BPM updates, history, reset, rejected-import selection and current composition after unlock. Compare composition, history and selection for rejected mutations. Independently assert permitted selection and existing selected-track persistence.
- [x] T038 [P] [US4] Add Mathematics transfer integration cases in `src/tests/mathematicsTransfer.test.ts` for rejection before Stop, import, BPM and navigation side effects, and preservation of the existing unlocked path.

### Implementation for User Story 4

- [x] T039 [P] [US4] After T037, enforce the mutation gate before any side effects in `src/stores/composition.store.ts` on setName, setBpm, note and track creation/update/removal including gain/mute/solo/synth, Undo, Redo, Reset and sequence import. Follow [data-model.md](data-model.md#canonical-inputs) `ScoreInput.composition` and [data-model.md](data-model.md#render-and-interaction-state) `PlaybackSession.editLock`. Preserve the selection behavior and storage schema. Apply the linked canonical fields `Composition.id`, `Composition.name`, `Composition.version`, `Track.name` and `NoteEvent.pitch` without rewriting the canonical record.
- [x] T040 [P] [US4] After T038, gate the Mathematics sequence transfer before its first side effect in `src/pages/MathematicsPage/MathematicsPage.tsx` and, if needed for integration tests, `src/features/mathematics/transferSequence.ts`. Preserve unlocked behavior. Leave the future [ADR-004](../../docs/decisions/adr-004-mathematics-transfer-tempo.md) policy and provenance unchanged.
- [x] T041 [US4] Update edit affordances and permitted interactions using the shared phase in `src/pages/ComposerPage/ComposerPage.tsx`, `src/features/composer/TrackList.tsx`, `src/features/piano-roll/PianoRoll.tsx`, `src/features/piano-roll/NoteInspector.tsx` and `src/components/Transport/Transport.tsx`. Verify keyboard navigation, selection, zoom and master volume through both locked phases, and correct editability after Pause and Stop.

**Exit check** Every mutation path rejects while locked, then normal operations and
playback of newly edited data succeed. Saved projects still load and legacy views retain
their behavior outside the approved change.

## Phase 7: Polish & Cross-Cutting Verification

**Dependencies** All story checkpoints. Record outcomes in
`specs/001-piano-grand-staff/verification.md`. Manual acceptance tasks require the
actual browser/audio environment. Record any unavailable verification as pending.

- [x] T042 Execute targeted and full regression suites through `package.json` and `src/tests/`. Compare against the T001 baseline and check source preservation, no schema changes and no weakened assertions. Record results in `specs/001-piano-grand-staff/verification.md`.
- [x] T043 Perform **manual acceptance** for the 22 numbered scenarios and all seven success criteria using actual desktop-browser SVG, visual style, keyboard, zoom, focus, reduced motion, real audio and the separate external-network-blocked production run from `specs/001-piano-grand-staff/quickstart.md`. Record evidence and any outstanding cases in `specs/001-piano-grand-staff/verification.md`.
- [x] T044 Measure 8-, 64- and 256-measure workloads using `specs/001-piano-grand-staff/quickstart.md`. Record preparation, initial and re-layout rendering, cursor-update cost, redraw counts, main-thread blocking, budgets and cancellation, retained heap and audio resources during rapid operations. Record results in `specs/001-piano-grand-staff/verification.md`. Distinguish provisional limits from measured results.
- [x] T045 Run ESLint, TypeScript, Vitest and production build through `package.json` and `tsconfig.json`. Finish the scoped compliance report in `specs/001-piano-grand-staff/verification.md` against the Constitution, approved plan, ADR-001–003 and TD-001–004, TD-009 and TD-013. Preserve offline scope, storage, and unrelated behavior. Record deferred verification plainly.

**Exit check** All automated gates and acceptance evidence are accounted for. Unavailable
manual checks and measured limitations remain visible. No speculative performance
results or unapproved dependency changes.

## Dependencies & Execution Order

- **Phase dependencies** Setup → Foundation → US1 → US2; Foundation → US3 playback
  slice, then US2 → US3 integrated cursor; US3 session/Transport → US4 → final verification
  after all stories. Rule ordering inside Foundation follows the explicitly referenced IDs.
- **Within each story** Test tasks precede the code they exercise. Validate each exit
  checkpoint before depending on its contracts. US2 consumes US1 for full Piano checks
  but remains testable with the shared rhythm input and playback stopped.
- **Parallel opportunities** T003–T006 use disjoint test paths. T009 and T010
  can proceed after their stated prerequisites. T016/T017, T022–T024, T029–T031 and
  T037/T038 are independent within their test batches. T025/T026 use different render
  adapters and the unchanged T014 input established for T019. T027 joins them after both complete, and T039/T040 use different entry points after the shared gate contract.
  Do not overlap tasks that write the same page, shared geometry, type or store file.

## Parallel Examples

| Story | Safe batch |
| --- | --- |
| US1 | T016 and T017 independently exercise the projection and renderer boundaries. |
| US2 | T022, T023 and T024 use separate tests. After those complete, T025 and T026 can run in separate adapters. |
| US3 | T029, T030 and T031 exercise playback, mapping and follow in separate files. |
| US4 | T037 and T038 can run together. After their tests, T039 and T040 touch separate production files. |

## Implementation Strategy

**MVP first.** Complete Setup, Foundation and US1 to deliver a readable Piano view for a
selected track with adjustable split and independent verification. This is an internal
checkpoint. The 11D release requires US2 resilient score modes, US3 shared playback
and US4 mutation protection, followed by manual acceptance and quality gates.

**Incremental delivery.** Stabilize shared rhythmic preparation, render Piano and legacy
modes, then connect owned playback, cursor and follow. Close the editing gate at every
mutation boundary before rollout. Keep 11E, 11F and later work outside this task list.

## Traceability

| Scope | Implementation and verification tasks |
| --- | --- |
| FR-001–002 | T016–T021, T043 |
| FR-003 | T003–T005, T007–T009, T011–T015, T022–T028, T042–T044 |
| FR-004 | T005, T014, T022, T025, T043 |
| FR-005 | T029, T032–T034, T043 |
| FR-006 | T017, T020, T024, T027, T030, T035, T043–T044 |
| FR-007 | T030–T031, T035–T036, T043–T044 |
| FR-008 | T006, T010, T029, T033, T037–T041, T043 |
| FR-009 | T029, T032–T033, T043–T044 |
| FR-010–011 | T016–T021, T028, T036, T041, T043 |
| CL-001 | T031, T036, T043–T044 |
| CL-002 | T003, T005, T009, T014, T043 |
| CL-003 | T004–T005, T011–T015, T024, T027–T028, T030, T035, T043–T044 |
| CL-004 | T015, T022–T028, T042–T043 |
| US1.1–US1.6, SC-001 | T016–T021, T043 |
| US2.1–US2.5, SC-002–SC-003 | T003–T005, T014–T015, T022–T028, T042–T043 |
| US3.1–US3.7, SC-004 | T029–T036, T043–T044 |
| US3.8, SC-005 | T029, T032–T033, T043–T044 |
| US4.1–US4.2, SC-006 | T037–T041, T043 |
| US1.5 and US4.3, SC-007 | T017–T021, T023, T028, T041–T043 |
| Constitution I–IV and VII | T003–T005, T007–T019, T022–T028, T042–T045 |
| Constitution V–VI and VIII–IX | T006, T010, T029–T041, T043–T045 |
| Constitution X–XIV and workflow gates | T001–T002, test-first story tasks, T042–T045 |

See the [22-case acceptance table](quickstart.md#acceptance-scenarios) and
[success criteria evidence](quickstart.md#success-criteria-evidence) for individually
numbered checks and their expected outcomes.
