# 11D validation guide

This guide defines the checks to run against a future implementation. The historical
baseline is 186 tests. Record the result of each gate and acceptance case during
verification.

## Local setup and quality gates

Run from the repository root with the existing dependencies available. Use the Node
version compatible with the repository's toolchain. The baseline audit used Node
24.14.1 and npm 11.19.1.

```sh
npm run lint
npx --no-install tsc -b
npm run test:run
npm run build
npm run dev
```

Open the URL printed by Vite in a desktop browser. Use a disposable browser profile
for local-storage fixtures and enable audio through the normal Play action. Record
the browser version, viewport, zoom, reduced-motion setting, operating system, hardware,
and audio output settings. Compare the existing assertions and feature coverage against
the baseline as well as checking the test count. Retain the existing 186 tests unless an
approved, documented justification accounts for a change.

## Fixture definitions

Use the approved data model to build deterministic fixtures. Use regular editor controls
where they expose the needed data, and load a test composition through the existing
persistence boundary for exact off-grid values and restored-project checks.

| Fixture | Content |
| --- | --- |
| Staff | Treble-only and bass-only tracks, an empty track, and a track with C3, C4, and E4 starting together. Include an overlapping same-staff voice and a separate dotted passage with rests. Include a non-default supported meter. |
| Pitch | C4 and notes on both sides of the default split and piano-range limits. Use A4 shifted up 25 cents (`440 × 2^(25/1200)` Hz) for an annotation and exact source-frequency check. Keep the out-of-range notes within the audio engine's accepted input range. |
| Rhythm | In separate cases, use onsets and durations `0.1 / 0.5`, `0 / 0.3`, and `0.125 / 0.125` in quarter-note beats. Add off-grid gaps, overlapping voices near a barline, a simultaneous group across staves, and a run of off-grid durations. Cover all seven base values and zero, one, and two dots in measures that accommodate them. Include a deterministic unplaceable fixture constructed from the chosen domain constraints. Keep an unrelated track or passage available to verify recovery. |
| Tie | A sustained note with fragments inside a measure, over a barline, and over a visual system break. Place a different source event of the same pitch immediately afterward. Exercise the system break at two viewport sizes by adjusting the fixture position to straddle the resulting break. |
| Transport | A multitrack score extending across several systems, including a silent measure, sustained notes, and audible notes with distinct frequencies on normal, muted, and solo-eligible tracks. At 120 BPM use a note from beat 1 to beat 5 and seek to beat 3. Its remaining two beats equal one second of scheduled duration. |
| Saved project | A composition persisted before the feature, with off-grid and microtonal values. Compare source ID, frequency, onset, duration, velocity, and other composition fields across mode changes and save/reopen. Snapshot comparison excludes view preferences and transport position. |

## Acceptance scenarios

IDs below are local references to the numbered steps of the user stories in
[spec.md](spec.md). Use fixture assertions for exact musical values and browser checks
for visible behavior.

| Case | Method and action | Expected result |
| --- | --- | --- |
| US1.1 | Browser, open Piano with the treble-only track. | Treble notes only. Bass staff remains visible with applicable rests and matching bars. |
| US1.2 | Browser, switch to the bass-only track. | Bass notes only. Treble staff remains visible. |
| US1.3 | Browser and domain assertions, inspect the split chord and overlapping passage. | Both staves share the chord onset at one horizontal coordinate. Voices, dots, and rests are readable. |
| US1.4 | Browser and snapshot, raise the split above C4. | Affected notes change staff and the original IDs, timing, and frequencies compare exactly. |
| US1.5 | Browser and playback assertions, toggle cents on and off for the pitch fixture. | Nearest pitches, signed cents when enabled, and range diagnostics appear. Annotations toggle independently of input frequencies and event retention. |
| US1.6 | Browser, inspect the non-default meter in the staff fixture. | Both clefs and one brace appear in each system. Meter and shared barlines reflect the composition. |
| US2.1 | Domain, browser, and snapshot, open the off-grid cases in all three representations. | Approximate events are distinguishable and expose original and displayed starts and durations plus signed deviations. Unrelated notes and original data remain intact. |
| US2.2 | Domain identity assertions and browser inspection, open the tie fixture. | Tied fragments link only to the expected event within bars, across bars, and across systems. The same-pitch repeat starts independently. |
| US2.3 | Domain and browser, repeat preparation of the overlapping off-grid fixture. | Repeated output is identical. Simultaneous onsets, order, voices, and bars remain valid. Written durations are positive and gaps have readable rests. |
| US2.4 | Domain and browser, check the vocabulary fixture against expected durations and rests. | All supported base and dotted values and supported tied combinations display exactly when they fit the measure. |
| US2.5 | Domain and browser, open the unplaceable fixture and compare scheduled playback. | Diagnostic identifies affected source notes. Remaining material renders and scheduled source playback agrees with the original. |
| US3.1 | Store integration and actual listening, compare Play on Notation and Composer with the same selected track and mix settings. | Same audible tracks and composition BPM, one selected part visible, and working master volume. |
| US3.2 | Browser and state assertions, exercise Play, Pause, Stop, Seek, and Loop across systems and an empty measure. | Cursor aligns across both staves with shared position. Only overlay updates occur during cursor-only movement. |
| US3.3 | Browser and store integration, seek to a chosen bar while stopped or paused and while playing. Repeat with Follow off and suspended. | The view shows the selected bar and all composition views observe its source start. Stopped or paused navigation does not start audio. |
| US3.4 | Browser, start outside the visible system and cross a system boundary with Follow active. | Active system enters view and no repeated auto-scroll requests occur while it is visible. |
| US3.5 | Browser, scroll manually, let playback cross a system, and explicitly resume Follow. | Manual scroll suspends following while playback and cursor continue. Explicit resume follows the current system. A prior programmatic scroll does not suspend following. |
| US3.6 | Browser, pause away from the start and then stop with Follow enabled, including temporary suspension. | Pause preserves scroll and cursor. Stop resets cursor and shows the score start. |
| US3.7 | Browser, set reduced motion and exercise following and measure seek. | Target appears without animated scrolling. With motion allowed, applicable programmatic scrolling is smooth. |
| US3.8 | Sequencer integration and actual listening, repeatedly seek inside the sustained note, then seek to its end. | Each completed seek restarts the eligible note once at the exact source frequency, with remaining duration and track gain. Obsolete operations leave no audible events. At the exact end the event does not retrigger. |
| US4.1 | Store integration and browser, attempt mutations during initialization and active playback from multiple routes. | Rejected musical mutations leave composition, history, selection and mutation side effects unchanged. Permitted track and note selection, navigation, zoom and master volume still work. Selected-track persistence can update under the existing schema. |
| US4.2 | Store and Sequencer integration, cancel startup with Pause and Stop, then edit and resume from the applicable transport position. | A late start cannot play or relock editing. Pause and Stop restore mutations. Subsequent playback schedules the current composition. |
| US4.3 | Browser and snapshot, load and resave the earlier project, switch Standard, Tablature, Both, and Piano, then exercise Composer and Piano Roll. | Existing workflows continue, source data and playback timing match, and new controls have accessible labels, keyboard operation, and visible focus. |

## Automated and audible checks

- **Domain unit and regression tests.** Verify the supported vocabulary and tie identity,
  deterministic results after repeated preparation, deviations against original boundaries,
  preservation of groups and order, positive durations, valid rests, and absence of
  incompatible overlaps. Include crowded and unplaceable cases and a sequence long
  enough to detect cumulative drift. Assert source preservation exactly. Record the
  declared interpretation of numerical tolerance for derived calculations.
- **Composition store integration.** Exercise all mutations through the public mutation
  boundary during initialization and playback. Include note and track creation, update
  and deletion, BPM, track gain/mute/solo, undo, redo, reset, and Mathematics sequence
  transfer. Attempt transfer during the lock and verify it is rejected before stopping
  or changing playback, importing notes, or changing BPM. While stopped or paused,
  transfer keeps its baseline behavior. Stage 12 owns the transfer tempo policy.
  Use a test-controlled initialization promise to exercise late completion, failure
  recovery, and resumed playback following an edit. Exercise the lock during the
  initialization of a playback replacement caused by Seek or Loop.
- **Sequencer integration.** Capture scheduled frequencies, durations, start times, gain,
  and resource disposal. Exercise overlapping Play/Seek/Stop requests, repeated Seek,
  current-generation ownership, initialization failures, and Loop. Confirm only the
  current session has resources and stale requests cannot update the store. Check amount
  of silence and remaining duration against the actual scheduled event bounds.
- **Browser verification.** Inspect actual notation, rests, cross-row ties and alignment
  at two desktop viewport widths. Validate values and diagnostics in each mode, track and
  split changes, resize, keyboard interactions, scrolling, and reduced motion. Compare
  cursor positions across equal source times over notes, gaps, approximate passages,
  and system edges. Inspect viewport behavior and audible continuity when switching pages.
- **Actual audio verification.** Listen through the real browser audio path at a safe
  level with distinct track pitches. Check mute, solo, volume, sustained-note reattack,
  playback after pause/edit, loops, and rapid seeks. Pair listening evidence with captured
  scheduled values. If measuring a rendered or loopback signal, document sample rate,
  processing and envelope effects, and timing/frequency tolerances. Use scheduled
  duration rather than the audible release tail as the exact duration oracle.

## Additional design verification

| Check | Method and expected evidence |
| --- | --- |
| Exhaustive reference oracle | Independently enumerate legal placements on small one- and two-voice measures, including simultaneous attacks, dotted durations, legal rests and competing events. Compare production results to the oracle for the entire objective and tie-break order. A certified optimal result agrees with the oracle. |
| Determinism and event identity | Repeat identical fixtures after different work-slice schedules and input permutations that retain the same IDs and events. Compare written times, simultaneous groups, tie endpoints, result class and diagnostics. Compare source fields and the sequencer schedule exactly before and after. |
| Staff-local gaps | Include a fixture in which naïvely reassigning remaining events to a single voice would leave a 4-tick gap. Project the prepared voices, change split pitch, and validate the rest reachability at every leading, internal and trailing gap. Require legal measure totals and unchanged written event positions. Force invalid projection and verify local diagnostics rather than layout failure. |
| Partial final measure | In 4/4 use an effective source end at beat 5.5. The score displays two full bars, with 2.5 beats of padding, and playback ends at 5.5. At the terminal beat the cursor reaches the cutoff, before any Stop or Loop transition. Check navigation to the last measure and clamping of any requested position in its padding. Verify unchanged nominal length, events, schedule and loop extent. Add a tail shorter than one token to test approximation or explicit local diagnostics. |
| Monotonic geometry | Sample increasing source beats over conflicting end anchors, simultaneous onsets, rests, empty bars, approximations and same-system bar transitions. X never decreases in one stable system and layout. Check that Seek, Stop, Loop and row changes can legitimately reposition the cursor. |
| Budget and classification | Force a certified result, a valid complete incumbent with unproved optimality, a proved impossible placement, and budget exhaustion with no complete incumbent. Verify the expected result classes, distinct causes, and a diagnostic for every omitted source event. Put difficult measures near the start and end of a long score. Later exact measures must remain intact and unresolved measures must receive their fair search allocation. |
| Superseded work | Switch tracks or inputs during sliced preparation. Cancel the old request and verify that no stale score, layout, diagnostic, or cursor update is published. Changing only the split preserves prepared written times. |
| Audio resource ownership | Race Play, Pause, Stop, repeated Seek and Loop while startup is pending and active. Count live synths, gains, limiters and scheduled work by session. No obsolete resources or events survive cancellation. Compare scheduling against the original events, including the padded bar. |

## Additional regression cases

- Compare small multi-bar placements with an exhaustive oracle that computes every
  objective tier independently. Include equal onset/end error with different fragment
  or tie counts and events spanning boundaries. If global certification is absent,
  the result must remain bounded even when it happens to match the oracle.
- Resume a complex bar with multiple slice sizes and a fixed total budget. Check
  incumbent retention, probe totals, classification and final result. Cancel midway
  through the bar and replace the input. Verify the stale result never publishes.
- On a single track at 120 BPM place equal-Hz notes at beats 0–6 and 1–3, then reverse
  the release ordering in a second fixture. Seek to beat 2. In the first fixture,
  expect two independent fresh attacks and release automation after 2 s and 0.5 s,
  respectively. Repeat with close microtones at distinct numeric Hz, Loop and Stop.
  Inspect actual voice ownership, scheduled release and reuse after the tail.
  The earlier release must not alter the other voice. Verify zero obsolete callbacks
  and no retained disposed-session voices. Use actual audio alongside schedule evidence.
- Count preparation requests in Both. Both adapters must consume the same prepared
  result and neither may trigger preparation. Verify during source replacement as well.

## Offline production acceptance

Build and serve the local production output, using a browser profile containing a saved
fixture. Allow the local app origin and block external network requests. With the
network log open, start the app, open the saved composition, check Piano Grand Staff
and its glyphs, switch to Standard and Tablature, and listen to actual playback.
Record the build, browser, fixture, network policy and any requests. Passing requires
all these flows to work without an external service. This is a manual acceptance
check after implementation.

## Performance measurements

Use deterministic fixtures in 4/4 at 120 BPM with two voices per active staff and occasional
chords, empty measures, and off-grid events. Use the same build, browser, machine, and
viewport for comparisons. Exclude initial audio authorization and font download from
steady-state measurements and record cold load separately.

| Workload | Measures | Composition events | Selected score events |
| --- | ---: | ---: | ---: |
| Short | 8 | 64 across 2 tracks | 32 |
| Medium | 64 | 1,024 across 4 tracks | 256 |
| Long | 256 | 8,192 across 8 tracks | 1,024 |

1. Record one cold run and five warm runs per workload. Record score preparation
   and initial visible rendering separately, then repeat after a resize, split change,
   and track change. Report individual samples, median, and maximum for each case.
   Use a browser performance trace to record wall time, longest main-thread task, count
   and total excess duration above 50 ms (sum of each task's duration minus 50 ms),
   and the cost of preparation slices and SVG layout separately. Observe responsiveness during replacement requests.
2. Collect per-update cursor cost over ten seconds after audio starts. Record median,
   p95, and maximum, including a transition into the next system. Count full score
   layouts during those cursor-only frames and repeated scroll requests while the
   system is visible. Both counts must be zero.
3. Run 20 play/seek/stop cycles and one loop test for each workload. Record active
   scheduled events and audio resources at start, during playback, and after cleanup.
   Capture browser heap observations using the same sampling method before and after
   the run. Report live growth separately from memory reserved by the browser or audio
   library. Retained work owned by obsolete sessions is a failure.
4. Record measured times and recommended performance budgets at implementation
   verification. The planning phase supplies workloads and required invariants.
   Latency and memory budgets require baseline measurements on the target environment.
   Repeat with deliberately exhausted search limits and capture completed, bounded and
   partially represented measures by index. The proposed limits are engineering defaults
   awaiting measurement. Consider more infrastructure only after identifying a measured
   responsiveness bottleneck.

## Success-criteria evidence

| Criterion | Evidence required |
| --- | --- |
| SC-001 | US1.1–US1.4, US1.6, and US2.4. All reference score fixtures render as expected. |
| SC-002 | US2.1, US2.3, US2.5, and US4.3. Verify every deviation and unplaceable note, voice invariants, and zero canonical changes. |
| SC-003 | US2.2. Inspect each kind of continuation and compare the source IDs. |
| SC-004 | US3.1–US3.7 and performance counters. Record all five shared operations, navigation, viewport behavior, and zero cursor-only full redraws. |
| SC-005 | US3.8 and Sequencer and audible checks. Verify remaining duration, source frequency, eligibility, and one attack per completed seek. |
| SC-006 | US4.1–US4.2. Record the mutation matrix, allowed interactions, and successful edit and resume. |
| SC-007 | US1.5 and US4.3. Record diagnostics, cents toggle, keyboard behavior, and regression results. |
