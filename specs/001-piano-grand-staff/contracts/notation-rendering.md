# Notation rendering and navigation contract

This contract covers the planned renderer, the source-time cursor, and the Notation UI.
The [specification](../spec.md) defines the user-facing obligations.

## Input and rendering ownership

The notation engine consumes the shared prepared-score output described in
[data model](../data-model.md). Inputs include the selected track projection, meter,
composition length, mode, its relevant display settings, and viewport layout inputs.
Use the exact [data-model.md](../data-model.md#derived-score) fields
`WrittenEvent.startTick`, `WrittenEvent.durationTicks`, `WrittenEvent.sourceNoteIds`,
`PreparationResult.classification` and `Diagnostic.scope`. The host
`PreparationSession.requestId` owns preparation and publication. Each renderer consumes
the same prepared-result interface, and Both passes the same result to its two adapters.
Renderers never invoke prepareScore independently. Pass immutable source fields through
the core where needed for source identification. Keep DOM,
SVG, VexFlow formatting, and viewport behavior in the engine or view. Standard and Tablature
retain their existing mode-specific options and consume the common preparation result.
Tablature resolves physical positions from original events and retains that assignment for
fragments. Both mode continues to present its two existing views. Only Piano exposes the
two-staff playback cursor in 11D.

Piano mode compares fractional MIDI derived from source frequency with the user-selected
split, defaulting to MIDI 60. Equality goes to treble. Source pitches below A0 (21)
or above C8 (108) produce a range diagnostic without dropping the source event. Convert pitch
to the existing nearest written spelling only after staff assignment. Render signed cents
using the existing display option and preserve the source frequency for playback. Use
the existing notation surface and theme tokens.

For each measure, both staves share X, width, meter, and timing. Allocate separate voices
per staff by projecting prepared voices. Replace a token's removed notes with the
corresponding rest when no chord member remains there, and validate all staff-local
gaps against the same duration vocabulary. Avoid recoloring voices after filtering.
Retain a valid full-measure rest voice on each empty staff. On failure, keep the valid
material and use a local placeholder with affected-source diagnostics. A split change
can reflow the paired layout but preserves written ticks and shared onset alignment. Place treble and bass clefs and the meter at the
system opening. Reserve a gutter for the brace. Wrap whole measures into systems according
to measured minimum widths and the available score width. An oversized measure may use
horizontal overflow instead of squeezing symbols into unreadable positions. Future split,
track, zoom, resize, or annotation changes publish a fresh layout together with its geometry.

## VexFlow 5.11.0 adapter

The following APIs were verified against the installed `build/types/src/*.d.ts` and
`build/esm/src/*.js`. The package source is the version authority. The upstream
[system documentation](https://public.vexflow.com/build/docs/system.html) illustrates the
multi-staff formatter pattern and the
[formatter documentation](https://www.vexflow.com/build/docs/formatter.html) explains
shared timing contexts. These examples are explanatory and may use older signatures.

- Build each pair using `Stave`, `Voice`, and `StaveNote`, reusing the existing SVG
  `Renderer`, pitch spelling, dots, and cents annotations. Use the shared score's base
  value, rest flag, and dot count. The installed `Note.parseNoteStruct` adds dot ticks
  from the dot count. `Dot.buildAndAttach` supplies visible dots. Validate that
  emitted voice ticks equal the measure duration before formatting.
- Bind every voice and tickable to its own stave before formatting. `Voice.setStave`
  sets the voice reference. `Voice.preFormat` attaches its stave to unbound tickables,
  or individual notes can be bound explicitly. Apply accidental and modifier logic in
  staff-local groups so collisions and accidental state remain staff-aware.
- Align initial modifiers with `Stave.formatBegModifiers` or equalize note starts
  with `getNoteStartX` and `setNoteStartX` once stave boundaries are formatted.
  Use the smaller `getNoteEndX` and reserve `Stave.defaultPadding` in the measure
  content width. Join treble and bass voice groups separately on one `Formatter`,
  then call `format` once with all voices, the shared width, and the render context.
  Supplying a single `stave` formatting option would rebind all voices to that stave.
  Draw each voice with its own stave after formatting.
- Use `StaveConnector` with `brace` and `singleLeft` at each system opening and
  `singleRight` to bridge the staves at measure ends. The installed connector source
  puts the right connector at the stave's X plus width. Give any extra padding to the
  system gutter, preserving the paired measure geometry.
- Resolve ties after formatting, by core continuation links and actual chordhead
  indexes. For a continuation inside the same system, pass both note endpoints to
  `StaveTie`. For a system break, draw an outgoing partial tie with `firstNote` only
  and an incoming partial tie with `lastNote` only. Their omitted endpoints use the
  appropriate stave's `getTieEndX` and `getTieStartX`. Specify the applicable chord
  head index on each partial tie. An equal-pitch note with a different source ID
  starts a new attack and receives no continuation tie.
- Discover rhythmic alignment coordinates after formatting. The installed
  `Note.getAbsoluteX` combines the note's tick-context X with its stave's note-start
  offset and can include a center adjustment. Use shared tick-context positions
  with the common stave offset, or absolute X of a representative non-centered
  tickable. Ignore staff-specific collision displacement and centered-rest offsets.
  Keep VexFlow objects inside the adapter.

The API inspection confirms available primitives and their behavior. Browser verification
must still check connector joins, multiple staff voices, glyph sizing, dots, tie halves,
range diagnostics, annotations, and the shared alignment of simultaneous notes.
A local Node smoke check using the installed package confirmed equal absolute X for a
whole-note onset on two staves, partial ties resolving to the stave endpoints, and a
double-dotted sixty-fourth producing 448 VexFlow ticks (`7/64` quarter-note beats).
It ran without a canvas text context, so it provides no evidence about glyph metrics
or visual rendering.

## Layout geometry output

Publish a read-only layout snapshot with an identity that changes when layout changes.
The cursor reads geometry in score SVG user units. Its overlay shares the SVG coordinate
space or applies the same transform as the score. A snapshot contains:

- Systems with stable order, visible bounds, and the vertical span from the treble
  staff's top line to the bass staff's bottom line.
- Measures with source-beat intervals, written-beat intervals, barline edges,
  content bounds, and system membership.
- Per-measure written-time anchors with actual formatted X positions for shared
  ticks and available rest or fragment boundaries. Measure content endpoints are
  explicit anchors, so empty measures and silent regions have a usable mapping.
  Align note-onset anchors with the common tick, independent of head displacement.
- A monotone source-time to written-time map per measure. Seed it with metric
  boundaries, retained shared attack groups, and the actual playback-end cutoff
  in the final measure. At the beginning prefer the aligned attack at that beat over
  the default content start. Combine duplicate source times only when they agree.
  Required anchors must be nondecreasing.
- Sort optional source-end and rest anchors by source beat and stable voice/event
  identity. Discard optional candidates at a required beat that disagree with it.
  For other beats keep at most one candidate, accepting it only if its written
  position lies between the accepted predecessor and the next required successor.
  Keep per-event deviations outside this map. Rests and empty measures remain
  traversable through metric anchors even when no optional anchors fit.

Lookup uses half-open intervals and takes the entering measure at an internal barline.
At the effective playback end use its terminal anchor, which may lie before the
visual barline. Publish monotone formatted X anchors from shared tick positions,
excluding center offsets and glyph displacement. Validate nondecreasing X across
the entire system, including measure transitions. If optional geometry breaks
the ordering, discard it and interpolate between validated anchors. If required
geometry fails validation, report a local layout failure and withhold the cursor for
the affected layout rather than publishing a reversing map. Interpolate source beat
to written tick, then written tick to X. Flat intervals are allowed. For an unchanged
layout, continuously increasing source beats cannot move X backward within a system.
Explicit Seek, Stop, Loop, and entering a different system are discontinuities.
A new valid layout reprojects the same transport beat in its new coordinate space.

The final partial measure remains visually complete, with legal rests after its
playback cutoff. Navigation to a measure still targets its playable start. If a
position control targets the padded tail, clamp it to the actual playback end.
The cursor never proceeds through the tail as time passes. An explicit Stop resets
it and Loop follows the shared restart. The terminal mapping uses the existing final
playback position up to such a transport transition.

The cursor subscribes to shared Sequencer position and references the latest geometry.
A position-only change updates the overlay and active system indicator. It causes zero
full-score renders and starts no independent clock. Track, split, zoom, resize, or score
changes may recompute layout and then reproject the unchanged transport position onto
the new snapshot. Version preparation and layout requests, cancel queued superseded
work and discard stale completions. While no matching layout is available, suppress
the overlay until one is published. Display lookup never alters the transport beat.

## Interaction and follow behavior

- The Notation page exposes mode, track selection, split, Follow Playback, measure
  navigation, approximation and range diagnostics, and the existing cents option.
  Use accessible names, keyboard operation, and visible focus. The existing
  composition Transport remains the only owner of playback actions.
- Follow Playback starts enabled. On Play or transition into a different system,
  scroll if that system needs to be brought into view. If the system is taller than
  the viewport, consider its cursor region visible when that region is in view.
  Trigger at most one request for the same system and layout while visible or while
  an automatic request is in progress. Resolve visibility against the scroll
  container, including any fixed or sticky headers. Match reduced-motion preference.
- Detect user scroll intent separately from scroll events produced by viewport changes.
  Manual wheel, gesture, keyboard scroll, or scrollbar interaction suspends automatic
  following. The follow control shows suspension and can explicitly resume to the
  current active system. An explicit off setting disables automatic following.
  An intervening user scroll cancels or supersedes pending automatic movement.
- Pause retains cursor and viewport. Stop returns the cursor to zero and reveals
  the score start when Follow Playback is enabled, including during suspension.
  Loop follows the actual restarted position. Explicit score measure navigation
  always shows the selected measure and calls the shared seek action for its
  original start beat, even when following is suspended or off. Neither scrolling
  nor switching Follow Playback updates audio or composition data.

Implementation acceptance covers system boundaries, simultaneous clicks and scrolls, and
geometry replacement during track, split, zoom, and viewport changes. Verify the renderer
and follow behavior in a browser using [quickstart](../quickstart.md).
