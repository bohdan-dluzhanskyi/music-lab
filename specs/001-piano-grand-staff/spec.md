# Feature Specification: Piano Grand Staff & Sequencer Synchronization

**Feature Directory**: `specs/001-piano-grand-staff/`

**Created**: 2026-11-27

**Status**: Clarified, awaiting approval for planning

**Input**: Roadmap stage 11D. Display a selected track on a piano grand staff and follow
composition playback from the Notation page.

## Clarifications

### Session 2026-11-27

- Q: How should the score viewport follow playback? → A: CL-001 enables Follow Playback by default, respects reduced motion, and suspends automatic following on manual scrolling until explicitly resumed.

- Q: Which written rhythms are supported in 11D? → A: CL-002 supports whole through sixty-fourth values, undotted through double-dotted values, tied combinations, corresponding rests, and multiple voices within measure boundaries. Arbitrary tuplets remain out of scope.

- Q: How should a derived rhythm be chosen and explained? → A: CL-003 sets the priority order for valid candidates, requires exact source preservation and reviewable deviations, and uses explicit diagnostics with safe partial rendering when placement is impossible.

- Q: Which score modes and data flows must preserve the same behavior? → A: CL-004 applies shared preparation to Standard, Tablature, and Piano Grand Staff, keeps playback, analysis, storage, and source events intact, and leaves Standard and Tablature cursor synchronization to 11E.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Read a piano part (Priority: P1)

As a composer, I want to read a selected track on a piano grand staff so I can see its
upper and lower parts together.

**Why this priority**: Reading a two-staff part is the primary value of Piano mode.

**Independent Test**: Open a fixture with treble-only, bass-only, and mixed passages
and inspect the score with playback stopped.

**Acceptance Scenarios**:

1. **Given** a track with pitches at or above C4 only, **When** I select Piano mode,
   **Then** the notes appear on the treble staff and the bass staff remains visible,
   with rests and matching measure boundaries.
2. **Given** a track with pitches below C4 only, **When** I open it in Piano mode,
   **Then** its notes appear on the bass staff and the treble staff remains visible.
3. **Given** a chord that spans the split and a passage with overlapping voices,
   **When** I open Piano mode, **Then** the chord shares one horizontal onset across
   both staves and each voice remains readable with the expected rests and dotted values.
4. **Given** a score with notes around the split, **When** I change the split,
   **Then** the affected notes move to the appropriate staff with their original
   IDs, timing, and frequencies intact.
5. **Given** microtonal pitches and pitches outside A0–C8, **When** I display the score
   with cents enabled, **Then** I see the nearest written pitches with the applicable
   signed cents deviations and a piano-range diagnostic. Playback retains the source
   frequencies and the composition retains every event.
6. **Given** a score in a supported meter, **When** I read it in Piano mode,
   **Then** a piano brace joins the treble and bass staves and the displayed meter
   and shared barlines reflect the composition.

### User Story 2 - Read exact and approximate rhythms (Priority: P1)

As a composer, I want a readable score even when a valid event falls outside the notation
grid so I can inspect the music while preserving the timing I wrote.

**Why this priority**: Exact timing and resilient display apply to every score mode.

**Independent Test**: Open the same off-grid fixture in Piano, Standard, and Tablature
and compare source events before and after display.

**Acceptance Scenarios**:

1. **Given** an off-grid onset or duration and adjacent expressible events, **When**
   I open the score, **Then** the rendered approximation and its signed deviation are
   identifiable alongside the source and written start and duration, unrelated notes
   still render, and the source events are unchanged.
2. **Given** a sustained event that needs tied segments within a bar, across a barline,
   and across a system break, **When** I read the score, **Then** each continuation
   is visible and belongs to the same source event. A separate repeat at the same
   pitch has no continuation link to that event.
3. **Given** off-grid events in overlapping voices near a barline, **When** I reopen
   the same score, **Then** the displayed rhythms and deviations repeat consistently
   while preserving bar boundaries, event order within each voice, and readable rests.
4. **Given** fixtures with the supported base durations, zero through two dots,
   tied values, and corresponding rests, **When** the values fit the meter and voices,
   **Then** the score displays them without rhythmic approximation.
5. **Given** competing events with no valid placement that satisfies the mandatory
   constraints, **When** I open the score, **Then** it identifies the affected
   source notes, renders the remaining material, and leaves playback unchanged.

### User Story 3 - Follow and navigate composition playback (Priority: P2)

As a composer, I want to play the whole composition from Notation while following the
selected track so I can review my piano part in context.

**Why this priority**: Playback makes the score useful for review and navigation.

**Independent Test**: Start a multitrack fixture on Notation, navigate between bars,
and compare the active passage with the shared composition Transport.

**Acceptance Scenarios**:

1. **Given** a selected piano part and other tracks with mute and solo settings,
   **When** I press Play in Notation, **Then** I hear the same audible tracks as in
   Composer and see the selected part only. Composition BPM and master volume are
   available through the shared Transport.
2. **Given** playback through multiple measures and systems, **When** I play, pause,
   stop, seek, or loop, **Then** the vertical cursor spans both staves at the shared
   position. It holds on Pause, returns to the start on Stop, moves to the seek
   destination, and follows the loop restart.
3. **Given** a score with multiple measures, **When** I navigate to a selected measure,
   **Then** the composition position moves to that measure's start and the cursor
   and other composition views reflect it. The selected measure is shown even when
   Follow Playback is off or suspended.
4. **Given** Follow Playback is enabled, **When** playback starts or enters a new
   system outside the viewport, **Then** the active system is brought into view.
   Staying in an already visible system produces no repeated scrolling.
5. **Given** Follow Playback is enabled, **When** I scroll manually, **Then**
   automatic following is suspended while playback and cursor updates continue.
   When I explicitly resume following, it follows the current system again.
   Automatic scrolling does not suspend following.
6. **Given** the score has scrolled away from the start, **When** I pause,
   **Then** cursor and scroll position hold. On Stop with Follow Playback enabled,
   the cursor resets and the viewport shows the score start.
7. **Given** reduced motion is enabled, **When** Follow Playback or navigation
   brings a measure into view, **Then** the viewport moves without smooth-scroll
   animation.
8. **Given** an audible sustained note, **When** I seek repeatedly into it during
   playback, **Then** each new position produces one fresh attack at the original
   frequency and plays the remaining duration at the track's gain. Obsolete events
   no longer sound. Muted or excluded tracks remain inaudible.

### User Story 4 - Review playback without changing the score (Priority: P2)

As a composer, I want the sounding and displayed composition to stay consistent while
I navigate, so I can resume editing when I pause or stop.

**Why this priority**: A consistent composition prevents unintended changes during review.

**Independent Test**: Attempt edits during initialization and playback, then pause,
edit, and resume from the current position.

**Acceptance Scenarios**:

1. **Given** playback is initializing or active, **When** I try to change notes,
   tracks, BPM, or track mix settings, **Then** the composition remains unchanged.
   Navigation, track selection, visual zoom, and master volume remain available.
2. **Given** an active playback session, **When** I pause or stop and edit, **Then**
   edits are accepted and subsequent playback uses the current composition.
3. **Given** existing Standard, Tablature, Both, Composer, and Piano Roll workflows,
   **When** I open previously saved material and perform supported viewing, editing,
   and playback actions, **Then** those workflows retain their behavior where this
   specification introduces no change. Exact event data and audio timing survive
   opening the score, changing score modes, and saving and reopening the composition.
   Notation remains legible in the existing
   desktop visual style and new controls work with the keyboard.

### Edge Cases

- An empty track or a track with an empty staff preserves the two-staff layout and
  shows applicable rests for the visible measures.
- For a split at C4, a pitch exactly equal to C4 goes to treble. An out-of-range note
  remains part of the composition and receives a range diagnostic.
- A chord may divide across the split. A repeated pitch with a different source ID
  starts its own event even when it follows a tie fragment.
- Very short valid events, off-grid gaps, and notes that cross bar or system boundaries
  must not suppress unrelated score content. If an event has no legal placement,
  report it and show a safe partial score. Written notes must remain positive in
  duration, preserve simultaneity, and avoid incompatible overlaps within one voice.
- A series of off-grid durations must not accumulate display drift through independent
  rounding. Approximation uses original onsets and ends as its timing reference.
- User scrolling suspends following. Programmatic scrolling, including showing a
  chosen measure during Seek, leaves the current follow state intact.
- Paused or stopped navigation changes the shared position without starting audio.
  When initialization is interrupted by Pause or Stop, the cancelled start must not
  later play stale material or keep the editing lock active.
- Seek at an event's end does not restart that event. While looping, the cursor follows
  the actual restart position.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001 · Piano Grand Staff** — Notation MUST offer Piano mode for the selected track.
  It MUST show a braced treble and bass pair with shared barlines, horizontally aligned
  onsets, composition meter, chords, rests, multiple voices, dotted notes, and ties.
  Standard, Tablature, and Both MUST remain available.
- **FR-002 · Staff distribution** — The default split MUST be C4 (MIDI 60). Pitches
  below the selected split MUST go to bass, and pitches at or above it to treble.
  Users MUST be able to change the split. This is a visual assignment. It MUST
  preserve source IDs, frequencies, starts, and durations and diagnose pitches
  outside A0–C8 without removing events from the composition.
- **FR-003 · Exact musical data** — Piano, Standard, and Tablature MUST share the same
  rhythmic preparation rules. Under [ADR-001](../../docs/decisions/adr-001-exact-musical-data-preservation.md),
  every valid fractional onset and duration MUST retain its exact source value.
  Approximation MUST affect only the derived score. Source NoteEvent identity,
  frequency, start, duration, and velocity MUST remain unchanged. When exact
  notation is unavailable, derive the written rhythm deterministically using
  these priorities in order:

  1. Keep measures and voices valid, including rests. Written durations must be
     positive, and incompatible events must not overlap within a voice.
  2. Preserve event order and groups of simultaneous notes.
  3. Minimize deviations of written onset and end from source onset and end.
     Compare against original positions so independently rounded durations cannot
     accumulate timing error.
  4. Minimize the number of written fragments and ties.
  5. For otherwise equivalent choices, prefer the earlier onset and shorter
     duration when the higher priorities allow it.

  Users MUST be able to distinguish exact and approximate events. For each
  approximated event, provide original and displayed start, original and displayed
  duration, and signed onset and duration deviations in quarter-note beats.
  Deviations are displayed values minus original values. When no valid placement
  satisfies the mandatory constraints, diagnose affected source notes explicitly
  and show the rest of the score safely. No source note may disappear silently.
  A single event or gap MUST NOT prevent the rest of the score from rendering. Base durations in quarter-note beats MUST be whole (4),
  half (2), quarter (1), eighth (0.5), sixteenth (0.25), thirty-second (0.125),
  and sixty-fourth (0.0625). The supported vocabulary MUST include undotted, single-dotted,
  and double-dotted values, tied combinations of notes, and corresponding rests
  in multiple voices, with note fragments and rests respecting measure boundaries.
  Visual approximation MUST leave playback, mathematical analysis and persisted
  composition values unchanged, including source microtonal frequencies and identities.
- **FR-004 · Ties across systems** — Written continuations MUST be visible within a bar,
  between bars, and across system breaks. The link MUST follow source event identity,
  including the individual note within a chord.
- **FR-005 · Unified Transport** — Notation MUST control the existing composition
  Sequencer for Play, Pause, Stop, Seek, and Loop and show composition status and BPM.
  Users MUST be able to change BPM when editing is allowed and adjust master volume.
  Selected track affects the displayed part. Playback MUST include the whole composition
  as permitted by mute, solo, and track gain.
- **FR-006 · Playback cursor** — The Piano cursor MUST span both staves and follow the
  original musical time from the shared Sequencer and its corresponding position in
  the displayed layout across measures and systems, including approximated passages.
  It MUST follow
  Play, Pause, Stop, Seek, and Loop. Cursor-only movement MUST cause zero full-score
  redraws and MUST use the shared playback position without a separate playback clock.
- **FR-007 · Score navigation** — Users MUST be able to seek to a selected measure's
  start and bring that measure into view independently of the follow state.
  **Follow Playback** MUST be enabled by default. With following active, Play MUST
  bring the active system into view and a transition to a system outside the viewport
  MUST scroll it into view. Position updates while that system remains visible MUST
  produce no additional scrolling. Automatic scrolling MUST be smooth when motion is
  permitted and non-animated when reduced motion is requested. Pause MUST preserve the
  cursor and scroll position. Stop MUST reset the cursor and show the score start
  when Follow Playback is enabled, including during temporary suspension.
  Loop MUST follow the actual Sequencer position.
  Manual scrolling MUST temporarily suspend automatic following, and users MUST be
  able to explicitly resume it through Follow Playback. Programmatic scrolling MUST
  NOT trigger suspension. Disabling or suspending following MUST leave playback and
  cursor updates active. Scrolling MUST leave audio and the canonical composition unchanged.
- **FR-008 · Playback editing policy** — Under
  [ADR-002](../../docs/decisions/adr-002-playback-editing-policy.md), musical mutations
  MUST be blocked during startup and playback, including attempts from other views or
  actions. Navigation, track selection, zoom, and master volume MUST stay available.
  Pause and Stop MUST restore editing. Resume MUST use the latest composition.
- **FR-009 · Seek behaviour** — Under [ADR-003](../../docs/decisions/adr-003-seek-behaviour.md),
  playback from inside a sustained note MUST reattack at the source frequency for the
  remaining duration, applying mute, solo, and track gain. Replaced playback MUST
  leave no obsolete or duplicate events. The fresh attack MUST be documented as the
  current playback behavior.
- **FR-010 · Microtonality** — Piano mode MUST retain the source frequency and display
  the nearest written pitch, with signed cents deviations under the existing display
  option. Disabling the option MUST affect annotations only.
- **FR-011 · Design consistency** — Piano mode MUST reuse the established desktop
  notation style, design tokens, dark palette, and ash-green accent. New controls MUST
  have accessible labels, keyboard operation, and visible focus.

### Key Entities

- **Composition, track, and source note** — The composition carries meter, tempo, and
  tracks. Each source note belongs to a track and has a stable identity, frequency,
  position, and duration.
- **Derived score event** — One or more written fragments reference the source
  event and describe staff, voice, measure, notation timing, ties, and any deviation.
  A rest accounts for a gap in a voice.
- **Measure and system** — A measure defines a shared musical-time interval for both
  staves. A system is one displayed row of measures.
- **Transport position** — One shared composition position drives playback,
  score navigation, and cursor location.

### Scope Boundaries

Excluded from 11D are direct score editing, physically optimized piano fingering,
arbitrary tuplets, MusicXML or MIDI import, score export, realistic piano samples,
analysis of musical works, a separate audio engine, Standard and Tablature cursor
synchronization planned for 11E, and unrelated refactoring.

### Required Verification

Per Constitution v1.0.0, automated tests MUST cover new domain rules and regression cases
for off-grid rendering, Transport, ties, and playback editing and seek. Integration checks
MUST exercise synchronization across views. Acceptance MUST include direct browser score
rendering and actual audio playback. Before closing 11D, ESLint, TypeScript, Vitest, and
the production build MUST pass. Preserve the audited baseline of 186 tests, without
unjustified deletion or weakening of assertions.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001** — All reference fixtures for treble-only, bass-only, split chords, empty
  staves, multiple voices, dotted values, and a changed split render the expected
  staves and aligned measures, including the specified base and dotted rhythms.
- **SC-002** — In all three score representations, the off-grid fixtures render without
  losing unrelated events. Every changed onset or duration in those fixtures has a
  corresponding deviation with original and displayed values. The fixtures produce zero
  invalid written durations or incompatible voice overlaps, preserve simultaneous
  onsets and event order, and diagnose each unplaceable event. Comparing source IDs,
  frequencies, starts, durations, and velocities finds zero changes.
- **SC-003** — Every continuation in the within-bar, cross-bar, and cross-system tie
  fixtures belongs to the expected source event. No tie is drawn between unrelated
  repeated notes of the same pitch.
- **SC-004** — The multitrack acceptance fixture follows the shared position through
  all five operations: Play, Pause, Stop, Seek, and Loop. Measure navigation lands on
  the expected boundary and shows the selected measure. The viewport follows actual
  playback across system boundaries with zero repeated scrolls while the system is
  visible and zero full-score redraws on cursor-only updates. Follow suspension and
  resumption, reduced motion, Pause, Stop, and Loop pass their viewport scenarios.
- **SC-005** — Each sustained-note seek in the acceptance fixture yields exactly one
  audible attack at the original frequency for the remaining duration on eligible
  tracks and zero attacks on excluded tracks. No obsolete scheduled notes sound.
- **SC-006** — All tested edits during startup or active playback leave musical data
  unchanged. The four allowed interactions stay available, and both Pause and Stop
  restore editing. The first resume after an edit uses the edited composition.
- **SC-007** — Microtonal annotations, piano-range diagnostics, and keyboard operation
  pass their acceptance cases. Existing Standard, Tablature, Both, Composer, and Piano
  Roll acceptance flows pass the regression review.

## Assumptions

- The existing offline workspace, selected-track model, and composition Sequencer are
  the baseline. Piano mode represents a single selected track at a time.
- The initial split and piano-range checks compare source pitch to the stated
  boundaries. Written pitch and cents remain a separate display decision.
- The feature retains existing composition storage and works with previously saved
  compositions. Plan will justify the rhythm search, numerical tolerances, derived
  score structure, and diagnostic presentation. Plan will also define verification
  workloads and fixtures for competing or unplaceable events and cursor mapping.

### Governing References

- [Music Lab Constitution v1.0.0](../../.specify/memory/constitution.md)
- [Roadmap](../../docs/roadmap.md)
- [Architecture](../../docs/architecture.md)
- [Technical debt register](../../docs/technical-debt.md)
