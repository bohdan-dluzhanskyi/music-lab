# 11D foundation verification

## T001 baseline

- Branch `001-piano-grand-staff` created from `main` at `3dff1c7`.
- Preserved the existing uncommitted ADR-004 and technical-debt edits and Spec Kit artifacts.
- Requirements checklist passed 16/16. No implementation extension hooks are configured.
- `npm run lint` and `npx tsc -b` passed.
- `npm run test:run` passed all 186 tests across 10 files.
- `npm run build` passed. The existing 500 kB chunk warning was reproduced (2,036.50 kB JS).
- Existing ignore rules cover the actual generated outputs. The app has no publishing,
  Docker, Terraform or Helm setup for this checkpoint.

## T002–T015 checkpoint

- Added deterministic note, materialized score, multitrack/seek, edit-gate and saved
  composition fixtures. The T003–T006 red run reproduced the greedy decomposition defect
  and detected the missing foundation APIs before code was added.
- The renderer-independent result exposes measures, written voices, source onset groups,
  source-ID ties, timing deviations, local classifications and omission diagnostics.
  Existing notation adapters retain the original array-shaped entry point, which delegates
  to the same preparation. The edit gate is an independent transient ownership primitive.
- The 21 written values use 256 ticks per quarter beat. A reachability table minimizes
  token count. Endpoint L1 costs are rounded per endpoint to the approved comparison
  scale and accumulated with BigInt. Written onsets and ends remain integer ticks.
- Placement traverses the layered decision tree depth-first with a bounded stack,
  an error lower bound and reusable rest feasibility. It avoids unproved state merges.
  A complete local search can certify separable placements. Coupled cross-bar
  approximations remain bounded. The score interleaves unresolved bars after an exact
  pass, preserving later exact results when probes run out. The slice API is consumed
  by a single owner and does not use browser scheduling.
- The current display guards allow 65,536 ticks in a meter table, 4,096 measures in
  a preparation window and 250,000 output tokens. Excess data stays canonical with
  display-limit diagnostics. These are resource guardrails, not performance measurements.
- The independent oracle matched three small single-bar cases and a cross-bar case
  in which two choices share endpoint error but require different fragment and tie
  counts. The selected cross-bar result remains bounded. Separate tests cover disjoint
  source groups, fair sharing of probes, continued traversal across slices, deterministic
  input permutations, sub-ULP timing, and the clipped final visual measure.
- The persisted composition payload, note identities, track IDs, microtonal frequencies,
  source timing, velocities, effective length and scheduled values are unchanged.

| Check | Baseline | T015 |
| --- | --- | --- |
| ESLint | Pass | Pass |
| TypeScript | Pass | Pass |
| Vitest | 186 tests / 10 files | 202 tests / 13 files |
| Targeted foundation suites | — | 54 tests / 5 files |
| Production build | Pass with existing chunk warning | Pass with same warning |
| Git diff whitespace check | — | Pass |

The production JS asset grew from 2,036.50 to 2,047.71 kB minified. No browser,
actual audio, offline acceptance or 8/64/256-measure performance evidence is recorded
for this checkpoint. Renderer, cursor, playback and cross-view integration are later tasks.

## T016–T021 checkpoint

### Automated checks

- Branch: `001-piano-grand-staff`. The requirements checklist remains 16/16.
- `npm run lint`, `npx tsc -b`, `npm run test:run`, `npm run build`, and
  `git diff --check` passed on the final code.
- Vitest passed 214 tests in 15 files. The 202 foundation tests remain unchanged.
  Phase 3 adds seven projection cases and five renderer contract cases. The increase
  from 213 in the previous full run is one ledger-line regression case.
- The production entry bundle is 2,056.88 kB JS (970.73 kB gzip) and 32.09 kB CSS
  (5.12 kB gzip). Versus T015, JS increased by 9.17 kB minified and 3.90 kB gzip.
  The pre-existing Vite chunk-size warning remains.

### Browser checks

- Actual SVG checked in headless Chrome with an isolated profile and a saved test
  composition at widths of 1,024, 1,200 and 1,440 px and score zoom of 75%, 100%,
  125% and 150%. A tall 1,024 px viewport exposed two systems at 150% for inspection.
- Inspected brace and connected barlines, a split chord and multiple voices, upper
  and lower ledger lines, and separation of staves and systems. The first split
  chord's three noteheads shared the same X across both staves. Checked actual ink
  extents for text-rendered glyphs and SVG geometry for stems and ledger lines.
- A0 and C8 were within range. Four test events beyond that range were reported and
  remained visible. The fixture also exercised treble-only, bass-only and empty
  tracks, keyboard split adjustment, zoom, the cents toggle, and Piano, Standard,
  Tablature and Both. The stored canonical composition matched the fixture.
- No runtime or application console errors during the flow. Chrome logged one
  pre-existing missing `/favicon.ico` request (HTTP 404).
- Screenshots saved outside the repository at
  `/tmp/music-lab-11d-piano-chords.png`,
  `/tmp/music-lab-11d-piano-ledger-lines.png`, and
  `/tmp/music-lab-11d-piano-split-zoom.png`.

### Known limitations

- The initial fixed vertical spacing could clip very high glyphs. The renderer now
  reserves room based on the projected pitches above and below each staff. The
  ledger regression and Chrome checks cover the updated spacing.
- A 404 for the default favicon is outside the checkpoint scope. No application
  behavior or notation dependency relies on that request.

### Deferred verification

- Cross-system ties and shared Tablature preparation are T022–T028 scope. Shared
  transport, playback cursor, follow behavior and editing protection remain later
  tasks. Actual audio, offline acceptance and performance measurements remain pending.
- The Phase 3 exit check passed. Piano rendered independently of playback, legacy
  modes opened, staff-local gaps validated, and split changes preserved written positions.

## T022–T028 checkpoint

### Automated checks

- ESLint, TypeScript, Vitest, production build and `git diff --check` passed.
- Vitest passed 222 tests in 17 files. All 214 prior cases were retained. Eight
  cases cover source-linked ties, the shared tab adapter and preparation ownership.
- The resumable-search tests retained a feasible incumbent, produced the same
  output for different slice sizes at the same budget, and rejected callbacks
  and publication from superseded requests. The tests also verify that equivalent
  preparation inputs initialize once and share the same result object.
- Production output is 2,061.63 kB JS (972.40 kB gzip) and 32.91 kB CSS
  (5.22 kB gzip). The pre-existing chunk-size warning remains.

### Browser checks

- Headless Chrome in an isolated profile rendered Standard, Piano, Tablature and
  Both from a fixture with exact and off-grid rhythms, chords and overlapping voices.
- Observed outgoing and incoming tie halves in Standard and Piano, alongside full
  ties across barlines. Chord-head mapping including changed membership is covered
  by the renderer tests. The Piano ledger-line fixture still rendered its extreme
  pitches and cents annotations.
- The diagnostic panel exposed the written and original timing, signed deviations,
  a search-budget reason, and a proven unplaceable event in a separate 1/64 fixture.
  The partial fixture still rendered in Both.
- A Chrome debugger count at `initializeScoreSearch` observed one initialization for
  a new track selected in Both. Mode, clef, split, zoom and cents changes on that
  input did not start another preparation. Rapid track and mode changes left the
  final track visible. The saved canonical composition remained identical.
- No application runtime errors were observed. The existing favicon 404 remains.
- Screenshots are outside the repository at `/tmp/music-lab-11d-cross-system-ties.png`,
  `/tmp/music-lab-11d-both-shared-rhythm.png`, and
  `/tmp/music-lab-11d-rhythm-approximation.png`.

### Scope and remaining checks

- Tab fingerings continue to use exact source events and the selected tuning.
  Written intervals come from the prepared score. Unplayable events occupy their
  written slot without transposing source pitches.
- No changes to the persistence schema, dependencies, sequencer or edit gate.
- Playback integration, actual audio, offline production acceptance and the full
  8/64/256-measure benchmarks remain later tasks.

## T029–T036 checkpoint

### Automated checks

- ESLint, TypeScript, production build and `git diff --check` passed. Vitest
  passed 235 tests in 20 files. The 222 earlier tests and their assertions were
  retained. The three new suites add 13 checks and were first run before the
  implementation.
- Controlled audio and frame doubles verified interruption during startup,
  obsolete success and rejection, edit-lock transfer across Seek and Loop,
  exact-end playback, current master volume, mute and solo filtering, track
  gain, deduplication, polyphony overflow, lease reuse and resource disposal.
  Equal-frequency attacks and close microtones used separate voices whose
  release times followed the clipped original intervals.
- Cursor tests covered conflicting source anchors, exact and approximated time,
  monotone in-system movement, rests, empty measures, system boundaries,
  terminal padding, malformed geometry and layout replacement. Follow tests
  covered pause, stop, seek, loop, suspension, explicit resume and reduced motion.
- The production entry bundle is 2,070.03 kB JS (975.23 kB gzip) and 33.87 kB CSS
  (5.42 kB gzip). Vite reports the existing large-chunk warning.

### Chrome checks

- In an isolated headless Chrome profile, a 29-beat multitrack fixture exercised
  Notation playback, route and mode changes, track selection, master volume,
  Pause and resume, Stop, Loop, stopped and paused measure seeks, and seeks
  during playback. The shared transport stayed active across route changes.
  Starting from Composer produced the same initial audible tracks and pitches
  as starting from Notation. The saved canonical composition matched its input.
- The cursor crossed both staves and moved across systems containing rests and
  empty measures. The observed notation SVG had zero full redraws during
  cursor-only motion and the system transition. Scroll requests stopped while
  the current system was visible. Wheel input suspended follow, explicit resume
  restored it, Pause retained the viewport, Stop revealed the score start
  even during suspension, and measure navigation worked with Follow off and suspended. Chrome exercised both instant and smooth scrolling
  via emulated reduced-motion preferences.
- A probe of live Tone.Synth calls observed separate voices for overlapping
  440 Hz events and a 440.03 Hz event. Seeking to beat 8 produced one attack
  per eligible source event, followed by two 0.5-second releases at 120 BPM.
  The shorter event had already ended. The solo bass at 110 Hz played across
  the whole composition mix. The muted and non-solo probe frequencies were
  absent. Stale replacements left no new oscillator starts after Stop, and
  each observed leased synth was disposed.
- Chrome recorded the Web Audio signal before hardware output. The recording
  decoded successfully and contained both signal and near-silent frames. The
  precise 440.03 Hz value and scheduled release times were verified at the
  live Tone API. The recording did not independently resolve that frequency
  separation. No human listening was performed.
- Browser artifacts are outside the repository at
  `/tmp/music-lab-11d-phase5-cursor.png` and
  `/tmp/music-lab-11d-phase5-audio.webm`. No unexpected browser errors were
  observed. The existing favicon 404 remains.

### Known limits and deferred verification

- Per-track polyphony remains 32. Events that cannot acquire a voice before
  attack within that limit are reported by Transport. An interior seek
  retriggers eligible notes and preserves their remaining duration.
- The edit gate owns initialization and playback. Full enforcement at composition
  mutation entry points and complete cross-route editing checks remain T037–T041.
  Standard and Tablature cursor synchronization remains stage 11E.
- Human listening, full audio and offline acceptance, and 8/64/256-measure
  measurements remain T043–T044. Phase 5 evidence covers its checkpoint only.

## T037–T041 checkpoint

### Automated checks

- ESLint, TypeScript, Vitest, production build and `git diff --check` passed.
  Vitest passed 245 tests in 22 files. The 235 previous tests and assertions
  were retained. The two new suites add ten cases and were run before the
  protection was implemented.
- The mutation matrix covers composition name and BPM, note and track
  creation, update and removal, track gain, mute, solo and synth settings,
  undo, redo, reset and direct sequence import. During initialization and
  playback, each rejected action left the canonical record, history,
  selection and persisted payload unchanged and generated no IDs or writes.
  Explicit track and note selection remained available. The existing payload
  stores composition and selected track. Note selection remains transient.
- Controlled startup and frame tests verified lock ownership during Seek and
  Loop, cancellation by Pause and Stop, failure recovery and rejection of
  stale startup. Subsequent playback received the edited composition.
- The Mathematics transfer tests verify rejection before Stop, import, tempo
  and navigation. The stopped and paused paths still import a new track, apply
  the generator BPM and navigate to Composer. ADR-004 and ADR-005 future
  behavior remains outside this checkpoint.
- Production output is 2,070.68 kB JS (975.36 kB gzip) and 34.06 kB CSS
  (5.46 kB gzip). Vite reports the existing large-chunk warning.

### Chrome checks

- An isolated headless Chrome profile loaded a version-1 multitrack fixture.
  Standard, Tablature, Both and Piano retained the source record. The browser
  exercised keyboard zoom, track and note selection, and master volume.
- Play began in Notation. The probe held the Sequencer startup promise
  to expose the initializing phase, then allowed the real Tone.js path
  to start. Both phases were checked in Composer, Piano Roll and
  Mathematics Lab. Editing controls were disabled, double-click did not
  add a note, and the transfer attempt stayed on the lab route without
  stopping playback. The probe compared canonical composition and both
  history arrays in memory and the canonical payload in local storage.
- Pause restored editing. A Note Inspector edit committed with Enter and
  the next Play triggered the updated 111.234 Hz frequency in Tone.js.
  Seek replacement and Loop retained the lock. Stop restored editing,
  and a subsequent unlocked Mathematics transfer succeeded.
- The only browser console errors observed were the existing favicon 404
  requests. No listening or audio recording was performed in this checkpoint.

### Known limits and deferred verification

- The Audio Voice Pool retains the current provisional ceiling of 32 voices per
  track. The playback contract calls for the existing per-track ceiling and
  deterministic overload handling without stealing sounding voices. The
  contract and research do not specify the number 32 or the concrete skip
  policy. Current implementation skips and reports eligible events for which
  no voice can become available in time. Capacity, overload behavior and
  resource cleanup under load remain T044 measurements.
- T042–T045 remain pending, including full audio, offline and load acceptance.
  No dependencies, canonical model or persistence scheme changed.

## T042–T045 final technical verification

T042–T045 are complete. The project owner approved final acceptance after
personally completing all 12 listening checks. The final result is 45 of 45
tasks, 22 of 22 scenarios and 7 of 7 success criteria, with zero FAIL and zero
PENDING. The implementation, specification, dependency manifest and persistence
schema are unchanged by Phase 7.

### Regression and evidence map

- The archived 11C commit `693f110` passed 186 tests in ten suites. A comparison
  of every baseline test file found additions and two expanded import lines,
  with all original test bodies and assertions retained. The current run passed
  245 tests in 22 suites. It covers mathematics, pitch and MIDI, microtones,
  intervals, generation, quantization, hybrid generation, composition/history,
  audio scheduling, notation, Tablature and fingerings, preparation, ties, cursor,
  follow, mutation protection and transfer.
- ESLint, TypeScript, Vitest, production build and both Git whitespace checks
  passed. JS is 2,070.68 kB (975.36 kB gzip); CSS is 34.06 kB (5.46 kB gzip).
  The existing Vite large-chunk warning remains.
- In the offline production run, the version-1 source record was identical after
  preparation, all mode changes and playback. The authorized edit changed only
  the composition name. Reopening yielded the same edited payload, containing
  the existing composition and selected-track fields.
- The evidence root is `/tmp/music-lab-11d-final/`. **B3–B6** name the four
  `music-lab-11d-final-phase*.log` replay logs. **R** is `rhythm.json` with source,
  schedule, diagnostics, ties and the rendered glyph count. **F** is
  `follow.json`. **A** is `transport.json` with live Tone calls and mix probes.
  **O** is `offline.json` plus the production PNG and WebM. **P** is
  `benchmark.json`, `cursor-bench.json` and the three Chrome traces.
- Chrome was 158.0.8127.38 on macOS 15.6.1. The visible engraving probes covered
  850 to 1,440 px widths and the prior ledger fixture's 75% to 150% zoom range.
  Keyboard navigation reached the measure selector with a visible solid outline.
  No runtime errors were observed. The known default favicon request returns 404.

### All 22 acceptance scenarios

| ID | Scenario | Expected | Observed | Method and evidence | Status |
| --- | --- | --- | --- | --- | --- |
| US1.1 | Treble-only track | Treble notes, bass rests and matching bars | Both staves and matching bars; bass has rests | Chrome SVG, B3 | PASS |
| US1.2 | Bass-only track | Bass notes, treble remains visible | Bass notes with the upper staff and rests | Chrome SVG, B3 | PASS |
| US1.3 | Split chord and voices | Shared onset X and readable voices, dots and rests | Three chord heads shared X; separate voices and rests rendered | Chrome glyph geometry, B3; domain tests | PASS |
| US1.4 | Raise split | Notes change staff; source IDs and timing remain exact | Staff redistribution with identical canonical payload | Chrome split and storage comparison, B3 | PASS |
| US1.5 | Cents, range and ledger lines | Signed cents toggle, A0/C8 valid, range diagnostics | Four out-of-range events diagnosed and retained; 25-cent pitch and extreme glyphs retained | Chrome SVG B3/B4, exact source frequency checks and O | PASS |
| US1.6 | Non-default meter | Both clefs, brace and barlines represent the meter | 7/4 vocabulary fixture rendered; clefs, brace and barlines inspected in staff fixtures | Chrome R and B3 | PASS |
| US2.1 | Off-grid inputs in score modes | Deviations show source and written fields; unrelated source is intact | Deviations shown; modes render and payload matches original | Chrome panel and storage B4/R, domain tests | PASS |
| US2.2 | Three kinds of ties and repeated pitch | Link only fragments of the same source across bar and system boundaries | Full and partial ties observed; unrelated repeated note has no edge | Chrome B4/R and source-ID assertions | PASS |
| US2.3 | Repeat dense preparation | Deterministic valid bars and voices, positive durations and simultaneous groups | Slice/ordering regressions agree, off-grid voices and gaps render | Chrome B4/R, deterministic domain tests and P | PASS |
| US2.4 | Rhythm vocabulary | Seven bases, zero to two dots, rests and ties when they fit | All 21 note and 21 rest values exact on 7/4 fixture; tied combination rendered | Chrome R and prepared token comparison | PASS |
| US2.5 | Unplaceable events | Per-event diagnostics, unrelated score intact, original scheduling | Partial result rendered; omission identified; computed playback retained all three source events | Chrome R/B4, exact schedule comparison | PASS |
| US3.1 | Notation and Composer playback | Same mix, BPM and working master volume, confirmed by listening | The owner heard equivalent playback from both views and confirmed mute, solo and master volume | Chrome B5/O/A and owner listening L | PASS |
| US3.2 | Transport and cursor across systems | Shared position, both staves, no cursor-only layout | Play/Pause/Stop/Seek/Loop crossed systems with zero cursor-only SVG redraws | Chrome B5/P | PASS |
| US3.3 | Bar seek during stopped, paused and active states | Correct source start and reveal with Follow off or suspended | Bar revealed in each mode; stopped/paused seek emitted no new attack | Chrome B5, store tests | PASS |
| US3.4 | Reveal active system | Start outside viewport, then reveal on boundary without repeated requests | Start revealed off-screen system; one scroll at natural system change | Chrome F/B5/P | PASS |
| US3.5 | Suspend and resume Follow | Natural crossing continues while suspended; explicit resume follows | Crossed a system with zero automatic requests while suspended; explicit resume scrolled | Chrome F/B5 | PASS |
| US3.6 | Pause and Stop viewport | Pause freezes position and scroll; Stop reveals start even when suspended | Both observed, including Stop after manual suspension | Chrome B5 | PASS |
| US3.7 | Reduced motion | Instant under reduced motion, smooth when allowed | Chrome captured both requested behaviors under the corresponding preferences | Chrome B5 | PASS |
| US3.8 | In-note Seek and event end | One audible reattack for remaining duration, no obsolete sound | The owner heard one reattack of about one second at beat 3, none for the ended note at beat 5, and silence after Stop following rapid seeks | Chrome live calls A/B5 and owner listening L | PASS |
| US4.1 | Edit attempts during both phases | Source, history and selection unaffected by rejected mutations | All actions blocked at the store; browser cross-route attempts and allowed controls observed | Chrome B6, mutation matrix | PASS |
| US4.2 | Cancel startup, edit and resume | Stale completion ignored; Pause and Stop restore editing | Controlled startups canceled safely; Chrome resumed at edited frequency | B6 and store/Sequencer integration | PASS |
| US4.3 | Reopen prior payload and use views | Same source, keyboard operation and visible focus | Version-1 payload reopened unchanged until authorized edit, then reopened exactly; keyboard and focus inspected | Chrome B6/F/O | PASS |

All 22 scenarios passed. Offline production operations and the separate owner listening check passed.

### Success criteria and requirement traceability

| Criterion | Result | Evidence |
| --- | --- | --- |
| SC-001 | PASS | B3 and R cover reference staves, chords, voices, split and rhythm. |
| SC-002 | PASS | B4/R/O and deterministic preparation regressions cover diagnostics, timing, voices and exact source preservation. |
| SC-003 | PASS | B4/R and the tie identity regressions cover all three continuation types and intentional repeats. |
| SC-004 | PASS | B5/F/P establish the transport, viewport and redraw results. L confirms audible parity and cursor agreement. |
| SC-005 | PASS | A records source frequency and scheduling at the live API. L confirms reattack duration, silence for the ended note, and Stop after rapid seeks. |
| SC-006 | PASS | B6 and the mutation/transfer integration tests. |
| SC-007 | PASS | B3/B4/B6/F/O cover cents, range, keyboard focus, score modes and editing views. |

| Requirements | Evidence and outstanding item |
| --- | --- |
| FR-001, FR-002 | US1.1–1.6 and split-position/source checks. |
| FR-003, FR-004 | US2.1–2.5, certified oracle, bounded and partial results, source-linked ties and range checks. |
| FR-005, FR-006, FR-007 | US3.1–3.8 technical runs cover shared transport, positioning, mix, seek and follow. L supplies the corresponding listening evidence for US3.1 and US3.8. |
| FR-008 | US4.1–4.2 and cross-route lock transitions, authorized editing and resume. |
| FR-009 | US3.8 and A verify timing, eligible notes, gain and session deduplication. L confirms the audible Seek and Stop behavior. |
| FR-010, FR-011 | US1.5/US4.3 and the offline run cover compatibility, score controls, visual state, keyboard and focus. |
| CL-001 | US3.3–3.7 and F/P. |
| CL-002 | US2.4 and R, including rests and exact, dotted and tied values. |
| CL-003 | US2.1/2.3/2.5, R, independent oracle, source diagnostics and monotonic cursor tests. |
| CL-004 | US2.1/US4.3 and B4/O. The shared result supplies both render adapters and the canonical schedule remains exact. |

### Offline production and real audio

Vite served the built output on `127.0.0.1:4174`. A fresh Chrome profile
disabled the HTTP cache and used CDP Fetch interception to deny every external
HTTP(S) request. A dead local proxy also prevented browser-level network
fallback. The application issued zero external requests. The request log
contains only the local HTML, JS, CSS, favicon and local Web Audio blob URLs.
The four modes, glyphs, preparation, playback, position overlay, Follow state,
editing after Stop, save and reopen were exercised.

The output tap before the hardware endpoint recorded 3.12 s of Web Audio.
The decoded data had a 44,100 Hz sample rate. A 0.50 s Hann-window spectral
probe found peaks at 110 Hz, 130.81 Hz and about 440 Hz, with mute/solo probe
frequencies 222 Hz and 333 Hz over 20 times weaker than the corresponding
reference peaks. The sweep spacing was 0.1 Hz. Its window limited useful
resolution and did not resolve 440.03 Hz as a separate output peak. B5 and A
record the exact numeric frequencies and scheduled attack/release times at
the running Tone API. Track gain of 0.25 was observed there and master gain
was exercised in the UI. Seeking to beat 3 in the beat 1–5 event at 120 BPM
gave one 447 Hz attack with 1.0 s scheduled duration. Seeking to beat 5
excluded the event. Two 440 Hz notes sought at beat 8 had separate 2.0 s and
0.5 s intervals. Rapid replacement and Stop left no additional attacks in the
observed window. The recording and API trace remain distinct from subjective
listening.

### Performance

The benchmark used real Chrome with the Vite development build to expose
individual preparation and render boundaries. Production offline acceptance
was a separate run. Apple M2, 8 GiB RAM, macOS 15.6.1, viewport 1440 × 900,
score zoom 100%, 4/4 and 120 BPM. The fixture has two overlapping voices per
staff, occasional chords and one empty bar per eight. Core timing uses
cooperative slices of 2,048 work units. SVG timing includes layout flush.
The cold column is the first fixture run with modules already loaded. Warm
columns show five runs, with median and observed range in milliseconds. The
raw data includes every sample and track replacement render/preparation times.

| Bars | Tracks | Source all / selected | Non-rest written fragments exact / bounded | Cold prep / SVG exact; bounded | Warm prep exact; bounded | Warm initial SVG exact; bounded | Warm resize / split median exact; bounded |
| ---: | ---: | ---: | ---: | --- | --- | --- | --- |
| 8 | 2 | 64 / 32 | 15 / 22 | 1.2 / 16.0; 277.2 / 22.4 | 0.7 [0.6–0.7]; 296.7 [264.1–318.4] | 7.0 [6.1–8.9]; 19.6 [15.2–24.9] | 7.6 / 7.1; 14.7 / 12.8 |
| 64 | 4 | 1,024 / 256 | 120 / 128 | 2.2 / 56.2; 278.7 / 65.0 | 11.4 [11.3–12.2]; 289.4 [284.3–299.0] | 47.5 [45.5–50.2]; 74.9 [67.2–81.0] | 48.6 / 47.9; 51.9 / 52.0 |
| 256 | 8 | 8,192 / 1,024 | 480 / 488 | 32.6 / 214.3; 310.2 / 228.6 | 60.3 [59.2–64.7]; 344.7 [342.1–409.5] | 213.7 [191.4–222.6]; 255.1 [220.4–355.5] | 201.4 / 199.1; 241.2 / 244.4 |

The three trace runs separated preparation slices from initial, resize and
split layouts. The exact fixture used zero search probes. Each bounded
fixture spent 98,304 probes across three hard bars. The defaults are 32,768
per measure and 2,000,000 per score. With zero probes, the three hard bars
became partial at indices 0/4/6, 0/32/62 and 0/128/254 respectively, while
all other bars remained exact. A bounded search regression with difficult bars at both ends separately
verified fair allocation. Superseded preparation published only the
replacement track. The synchronous replacement call took 0–0.2 ms on the
measurement clock, excluding fresh preparation.

| Bars | Main thread tasks >50 ms, count / longest / excess | Live overlay update median / p95 / max | Full redraws / redundant scrolls in 10 s | JS heap before → after GC | Synth / Gain / Limiter created and disposed in 20 cycles |
| ---: | --- | --- | --- | --- | --- |
| 8 | 0 / — / 0 ms | 1.8 / 2.1 / 4.1 ms | 0 / 0 | 14.3 → 19.9 MB | 252 / 120 / 40 |
| 64 | 3 / 72.6 / 46.5 ms | 2.2 / 3.5 / 7.8 ms | 0 / 0 | 16.2 → 20.3 MB | 184 / 200 / 40 |
| 256 | 3 / 222.2 / 499.7 ms | 1.7 / 5.5 / 7.0 ms | 0 / 0 | 19.3 → 35.7 MB | 1,008 / 360 / 40 |

Overlay latency is from store publication to the SVG attribute mutation.
Each observed window crossed a system boundary at real playback speed with
588–589 samples. The three 20-cycle runs used Play, replacement Seek and
Stop. The independent loop probe succeeded on every workload. All observed
Tone nodes were disposed. A separate exact-fixture run also counted
260/520/1,040 synth creations and disposals across the three sizes, including
its loop probe. Forced-GC measurements show retained JS heap growth on this
run. They do not attribute ownership or establish a leak. A repeat batch and
heap dominator analysis belong in the follow-up performance work. The
approved specification defines zero redraw/scroll invariants and no
numeric latency or heap acceptance threshold.

### Voice-pool stress

Each case ran three times in live Chrome. The attack sequence repeated,
release calls matched their leases, and all allocated voices were disposed
in each run. Peak simultaneously sounding and allocated voices coincide
for the simultaneous-attack cases. The final case holds the allocations
through the release tail even after the initial note ends.

| Requested | Tracks | Scheduled | Skipped | Peak allocated | Disposed / live after Stop | Reason |
| ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 16 | 1 | 16 | 0 | 16 | 16 / 0 | Within pool |
| 31 | 1 | 31 | 0 | 31 | 31 / 0 | Within pool |
| 32 | 1 | 32 | 0 | 32 | 32 / 0 | At ceiling |
| 33 | 1 | 32 | 1 | 32 | 32 / 0 | Ceiling at attack |
| 64 | 1 | 32 | 32 | 32 | 32 / 0 | Ceiling at attack |
| 192 | 3 | 96 | 96 | 96 | 96 / 0 | 64 requests per track under independent ceilings |
| 32 + 1 | 1 | 32 | 1 | 32 | 32 / 0 | Pending attack arrives during 32 reserved release tails |

Transport displayed one skipped event on the 33-attack check. No occupied
voice was stolen. Repeated Seek, Loop and rapid Stop/Play disposed replaced
sessions in the workload and transport probes. The ceiling remains
provisional. Dense scientific scores can schedule fewer sounding events
than their canonical content; the source events and diagnostics remain
available. Raising the limit or changing the overload contract requires a
separate decision supported by measurements.

### Constitution and ADR audit

| Principle | Assessment |
| --- | --- |
| I. Mathematical Accuracy | Domain regressions, 256-tick units, all 21 rhythm values, independent small oracle and budget tests substantiate the declared domain. Coupled cases remain bounded when certification is unavailable. |
| II. Scientific Integrity | Deterministic fixture input and measured evidence are preserved. The report distinguishes live API values, captured signal estimates and subjective listening by the project owner. |
| III. Single Source of Truth | All score modes use a prepared projection of the same source. Transport schedules the source events, and Both initialized preparation once in the browser probe. |
| IV. Frequency and Time Preservation | Source IDs, Hz, onsets, durations and velocity persisted unchanged through the workflow. Seek clipping and written approximation stay derived. |
| V. Domain Independence | Core owns musical rules, adapters own library calls and UI owns publication and controls. A local TypeScript import-graph check found zero cycles before and after. |
| VI. Unified Playback | One composition Sequencer, one playback position, isolated overlay, and shared transport and editing policy. Automated and technical browser evidence passed. |
| VII. Musical and Instrumental Correctness | Both staves, voices, range, 21 values, dots, rests, ties and existing tab fingerings were covered. Out-of-domain and unplaceable material is diagnosed. |
| VIII. Offline First and Data Ownership | Clean-profile offline production technical flows passed. Validated storage recovery and migration are pre-existing gaps assigned to stage 12. The persisted v1 structure is unchanged. |
| IX. Audio Quality | Source Hz, independent releases, bounded polyphony, limiter and cleanup are evidenced. Owner listening passed all 12 checks. |
| X. Quality and Testing | Original 186 cases and current 245 cases passed. Desktop Chrome, actual SVG and real Web Audio were exercised. The owner completed the manual audio gate. |
| XI. Performance and Scalability | Overlay invariants passed at all sizes. Large SVG work and observed retained heap growth remain measured follow-up items. No new budgets are approved here. |
| XII. User Experience and Design | Existing desktop design, labels, keyboard focus, view preferences and editing affordances verified in Chrome. |
| XIII. Specification-Driven Development | Approved artifacts and checklist preserved. Final acceptance and measured scope limits are documented. |
| XIV. Architecture and Technology Governance | Existing stack and architecture retained. Package manifests and lockfile are unchanged. |

ADR-001 is evidenced by exact source preservation, deterministic approximation
and per-event diagnostics. ADR-002 is evidenced by the store/UI mutation
matrix and real Chrome cross-route run. ADR-003 is evidenced at the live
Tone API and scheduler integration level. Owner listening confirms its audible behavior. ADR-004 still uses the historical unlocked Lab-to-Composer BPM
transfer. ADR-005 provenance and the future tempo choice were not introduced.
ADR-006 repository hygiene remained intact.

The local code review and browser probes found one Sequencer singleton,
no independent preparation from the render adapters, no canonical mutation
during rendering, and no observed publication from superseded work. The
review followed production mutation callers through the store and the separate
Mathematics transfer guard. The package and lockfile comparison and offline
network log show no added runtime dependency. The optimal fixture presents a
certificate and the uncertified fixtures display bounded/partial status.

### Technical debt and findings

| Item | Assessment |
| --- | --- |
| TD-001 | Technical acceptance evidenced for former off-grid failures, existing exact results, diagnostics and canonical persistence. Closed at final acceptance. |
| TD-002 | Shared Transport and cursor verified across routes. Owner listening confirmed audible parity. Closed. |
| TD-003 | Same-source ties verified across bars and visual systems, with no tie to the repeat. Closed at final acceptance. |
| TD-004 | Edit protection and timing/gain/reattack checks passed. Owner listening confirmed audible seek behavior. Closed. |
| TD-009 | Open. Sliced preparation and isolated cursor are measured. Initial and replacement SVG layout and retained heap need further work. |
| TD-013 | Closed for the original acceptance criteria. Browser, SVG, signal and owner listening evidence cover the affected workflows. Release-wide verification remains in stage 17. |

- **MEDIUM — layout responsiveness.** The 256-bar isolated trace included a
  222.2 ms main-thread task. Full long-score layouts and re-layouts are the
  measured bottleneck. Review staged rendering separately, with comparable
  traces and an approved target before adjusting architecture.
- **MEDIUM — voice capacity.** Thirty-three simultaneous events can produce
  one omission and 64 can produce 32. Canonical data, deterministic diagnostics
  and lease ownership are preserved. Review this preliminary capacity with
  target scientific use cases before changing the release or overload policy.
- **MEDIUM — heap observation.** After forced GC, the largest cycle run retained
  16.4 MB more JS heap. All observed Tone allocations were disposed. A repeated
  steady-state heap/retainer study is needed before identifying a leak.
- **LOW — existing tooling/UI notices.** The bundle-size warning and local
  favicon 404 remain. No new in-scope correctness defect was confirmed.
  Phase 7 changed verification documentation and task status only.

### Git audit at the Phase 7 technical checkpoint

The working branch is `001-piano-grand-staff`. The tracked diff includes
32 files, 2,203 insertions and 594 deletions across prior implementation
phases. Thirty-one additional files are untracked. The normal and staged
`git diff --check` passed, and the verification script also checked
untracked whitespace. Candidate files contain no detected common secret
patterns, screenshots, audio files, logs or browser profiles. Ignored
generated output remains outside change candidates. Untracked and tracked
inventories, short status, full stat and the scan report are
`git-untracked.txt`, `git-tracked.txt`, `git-status.txt`,
`git-stat.txt` and `git-audit.json` under the evidence root. The short
status includes the untracked Specs directory, and the untracked inventory
expands it to individual files. No add, commit, merge or push was performed.

### L — Project owner listening evidence

The project owner reported **FINAL GO**, all 12 checks passing and no remarks.
The source is the owner's manual listening and observation in the prepared
isolated Chrome production session. This evidence records audible and visual
behavior. Exact values in hertz come from the separate Tone API trace and
signal analysis above.

| Owner check | Result | Acceptance mapping |
| --- | --- | --- |
| Playback starts correctly from Notation | PASS | US3.1, SC-004 |
| Composer plays the same composition | PASS | US3.1, SC-004 |
| Mute silences the corresponding track | PASS | US3.1, SC-004 |
| Solo leaves the requested track audible | PASS | US3.1, SC-004 |
| Master volume changes the output level | PASS | US3.1, SC-004 |
| Score cursor agrees with the sound | PASS | SC-004 |
| Pause stops playback | PASS | SC-004 |
| Resume continues playback | PASS | SC-004 |
| Seek to beat 3 reattacks for about one second | PASS | US3.8, SC-005 |
| Seek to beat 5 does not reattack the ended note | PASS | US3.8, SC-005 |
| Stop after rapid seeks silences the output | PASS | US3.8, SC-005 |
| Playback works with external Internet blocked | PASS | US3.1 and offline production acceptance |

T043 is closed. Final totals are **45/45 tasks, 22/22 acceptance scenarios and
7/7 success criteria**, with **0 FAIL and 0 PENDING**.
