# Data model

## Canonical inputs

| Entity | Fields and ownership |
| --- | --- |
| Composition | Existing identity, name, BPM, meter, nominal length, and tracks. The store owns the canonical snapshot and edit history. Effective length is the maximum of nominal length and all source note ends. |
| Track | Existing identity, name, notes, synth settings, mute, solo, and volume. The view selects one track and the Sequencer plays all eligible tracks. |
| NoteEvent | Existing stable ID, track ID, Pitch, startBeat, durationBeats, and velocity. Use the source frequency in Hz. Preserve the exact start and duration in quarter beats. Derive end as start plus duration. |
| Score input | Read-only selected track events, composition effective length and meter. Independent display preferences include mode, split, zoom, existing clef and cents controls, and instrument tuning when applicable. |

No canonical schema or persisted payload changes. Exact source values remain authoritative
for storage, audio and analysis. Source values must be finite, with positive duration
and frequency and nonnegative start. Use the existing valid meter definition. Treat
invalid supported-boundary inputs and unsupported display as explicit diagnostics.
A valid event with a sub-tick duration is still a valid source event.

### Canonical field identifiers

| Entity | Exact identifiers and constraints |
| --- | --- |
| Composition | `Composition.id`, `Composition.name`, `Composition.version`, `Composition.bpm`, `Composition.timeSignature`, `Composition.lengthBeats`, `Composition.tracks`. Preserve existing storage and meter validation. |
| Track | `Track.id`, `Track.name`, `Track.notes`, `Track.synth`, `Track.muted`, `Track.solo`, `Track.volume`. Preserve existing mix settings and track identity. |
| NoteEvent | `NoteEvent.id`, `NoteEvent.trackId`, `NoteEvent.pitch`, `NoteEvent.pitch.frequency`, `NoteEvent.startBeat`, `NoteEvent.durationBeats`, `NoteEvent.velocity`. Preserve these values exactly for notation. |
| ScoreInput | `ScoreInput.composition` is the read-only source snapshot. `ScoreInput.notes` belongs to the selected track. `ScoreInput.effectiveLengthBeats` derives from the existing composition extent. `ScoreInput.timeSignature` mirrors meter. `ScoreInput.mode`, `ScoreInput.splitPitch`, `ScoreInput.zoom`, `ScoreInput.clef`, `ScoreInput.showCents`, `ScoreInput.tuning` are display-only. |

## Derived score

One shared rhythmic result uses an integer written-time lattice of 256 ticks per quarter
beat and source time in quarter beats. Placement and voice constraints are defined in
[research](research.md). Render adapters apply clef, pitch spelling, string fingering
and staff distribution to shared written times. Changing renderer or split does not
quantize or replace a source event.

| Entity | Fields and invariants |
| --- | --- |
| Measure | Zero-based index, source-time metric interval, actual playable extent within it, written tick range, and ordered voices. The final partial measure also carries the written playback cutoff and a rest-only visual tail. Both staves share these boundaries. |
| Onset group | Canonical original onset and stable source IDs. One displayed onset for simultaneous attacks even if their durations, voices or staff destinations differ. Within a voice, chord members with the same span can share a written element. |
| Voice | Stable derived ID and positive rhythmic segments in measure order. Independent voices may overlap. Any two incompatible segments in the same voice cannot overlap. Piano projection retains voice identity and token times. Removed note tokens become corresponding rests and each staff-local voice is validated. |
| Written event | Stable derived ID, voice, measure, written start tick, positive duration ticks, base duration and dot count. Its note members carry original source IDs. Rest events carry no source note IDs. |
| Written continuity | Tie edges identify source note ID and neighboring fragment endpoints. Chords with changing membership connect the corresponding member by identity. Rendering can split a tie across systems while retaining this relationship. |
| Timing deviation | Source ID, original start and duration, displayed start and total duration, signed displayed-minus-original onset and duration deviations in quarter beats. Reports describe the full placed note across fragments. |
| Preparation result | Exact, Optimal approximation, Bounded approximation, or Partial representation. Keep per-measure and view results plus the least complete overall result. Store certification or limit reason where applicable. |
| Diagnostic | Stable code, affected source ID or measure/voice span, readable description and optional timing details. Every omitted event has a record distinguishing proved infeasibility, budget exhaustion or a display limit. Out-of-range diagnostics have no effect on audibility. |

Note and rest positions must obey measure bounds. Tied combinations may split across
measures. Retained source IDs must have positive written duration. If a valid placement
cannot be produced, keep exact source events accessible through diagnostics, render
valid material, and fill the resulting gaps with legal rests. Display equality
tolerances apply only to derived comparisons and reporting. The visual metric endpoint
is separate from the composition's effective playback end. A padding rest has no
playback identity and cannot create a seek target beyond that end.

| Entity | Exact identifiers (see invariants above) |
| --- | --- |
| Measure | `Measure.index` (index); `Measure.sourceInterval` (source-time metric interval); `Measure.playableInterval` (actual playable extent); `Measure.writtenRange` (written tick range); `Measure.voices` (ordered voices); `Measure.writtenPlaybackCutoff` (written playback cutoff); `Measure.visualTail` (rest-only visual tail) |
| OnsetGroup | `OnsetGroup.sourceOnsetBeat` (original onset); `OnsetGroup.sourceNoteIds` (stable source IDs); `OnsetGroup.writtenOnsetTick` (displayed onset) |
| Voice | `Voice.id` (stable derived ID); `Voice.segments` (positive rhythmic segments) |
| WrittenEvent | `WrittenEvent.id` (stable derived ID); `WrittenEvent.voiceId` (voice); `WrittenEvent.measureIndex` (measure); `WrittenEvent.startTick` (written start tick); `WrittenEvent.durationTicks` (duration ticks); `WrittenEvent.baseDuration` (base duration); `WrittenEvent.dots` (dot count); `WrittenEvent.sourceNoteIds` (source note IDs) |
| WrittenContinuity | `WrittenContinuity.sourceNoteId` (source note ID); `WrittenContinuity.fragmentEndpoints` (neighboring fragment endpoints) |
| TimingDeviation | `TimingDeviation.sourceNoteId` (source ID); `TimingDeviation.sourceTiming` (original start and duration); `TimingDeviation.writtenTiming` (displayed start and total duration); `TimingDeviation.deviations` (signed onset and duration deviations) |
| PreparationResult | `PreparationResult.classification` (class); `PreparationResult.localResults` (per-measure and view results); `PreparationResult.certificationEvidence` (certification or limit reason) |
| Diagnostic | `Diagnostic.code` (stable code); `Diagnostic.scope` (affected source ID or measure/voice span); `Diagnostic.message` (readable description); `Diagnostic.timing` (optional timing details) |

`TimingDeviation.sourceTiming` and `TimingDeviation.writtenTiming` each carry start and
duration in quarter beats. `TimingDeviation.deviations` carries signed onset and duration
differences in the same units. `WrittenEvent.dots` is 0, 1 or 2.

`Diagnostic.scope` identifies source events or a measure/voice span. `Diagnostic.reason`
distinguishes proven infeasibility, budget exhaustion and a display limit where applicable.
`PreparationResult.certificationEvidence` describes the verified objective tiers,
unresolved boundaries and any pruning or limit reason. The overall classification
aggregates the local results in `PreparationResult.localResults`.

## Render and interaction state

- **Layout snapshot** — immutable render version, systems and ordered measure geometry,
  coordinate bounds for the staff pair, and the anchors needed to map source beats
  to written positions. Details are in the [rendering contract](contracts/notation-rendering.md).
  Measure data includes a monotone mapping to formatted X and an actual playback-end
  anchor distinct from a padded bar edge. Reflow and display changes replace the
  snapshot. A new input version cancels or supersedes any pending preparation, and
  an obsolete completion cannot publish any score, diagnostic or geometry.
- **Cursor** — transient system and x coordinate derived from the current source beat
  and current layout version. It shares the same vertical span across the paired staves.
  Scrolling affects viewport only.
- **Follow state** — off, enabled and active, or enabled and temporarily suspended.
  Defaults to enabled and active. Manual scrolling suspends active follow. Explicit
  activation resumes it. Programmatic movements do not change this state.
- **Playback session** — pending target or audio-derived source beat, phase, loop,
  view-visible error, and request ownership. The playing session captures a canonical
  snapshot. An owned mutation lock covers initializing and playing, including session
  replacement. Pause, Stop and terminal failures restore editability. See the
  [playback contract](contracts/playback.md).

| Entity | Exact identifiers (see invariants above) |
| --- | --- |
| LayoutSnapshot | `LayoutSnapshot.version` (immutable render version); `LayoutSnapshot.systems` (systems); `LayoutSnapshot.measures` (ordered measure geometry); `LayoutSnapshot.staffBounds` (coordinate bounds); `LayoutSnapshot.anchors` (anchors); `LayoutSnapshot.playbackEndAnchor` (actual playback-end anchor) |
| Cursor | `Cursor.systemIndex` (system); `Cursor.x` (x coordinate); `Cursor.sourceBeat` (current source beat); `Cursor.layoutVersion` (current layout version) |
| FollowState | `FollowState.mode` (off, enabled and active, or enabled and temporarily suspended) |
| PlaybackSession | `PlaybackSession.pendingTargetBeat` (pending target); `PlaybackSession.positionBeat` (audio-derived source beat); `PlaybackSession.phase` (phase); `PlaybackSession.loop` (loop); `PlaybackSession.error` (view-visible error); `PlaybackSession.requestId` (request ownership); `PlaybackSession.composition` (canonical snapshot); `PlaybackSession.editLock` (owned mutation lock) |

`SearchState.frontier`, `SearchState.bestCandidate`, `SearchState.position`,
`SearchState.remainingBudgets`, `SearchState.certificationEvidence`, and
`SearchState.orderingState` are pure resumable state. They include pending cross-bar
contributions where needed. `PreparationSession.requestId`,
`PreparationSession.inputIdentity`, and `PreparationSession.searchState` belong to
the host orchestration boundary. Only the current request can publish.

`VoiceLease.sessionId`, `VoiceLease.trackId`, `VoiceLease.sourceNoteId`,
`VoiceLease.attackAt`, `VoiceLease.releaseAt`, `VoiceLease.reusableAfter`, and
`VoiceLease.token` identify one transient voice reservation. A lease cannot overlap
another lease on the same voice. The underlying synth and queue belong to the
current playback session and never enter persisted composition data.
