# Shared composition playback contract

Notation in all modes uses the same composition controls as Composer and Piano Roll.
The chosen track affects the score only. Playback uses the existing audibility rules
and track mix across the whole composition. Lab preview remains on AudioEngine.
Switching pages never implicitly restarts playback or creates a second clock.

## Commands and state

| Command or event | Observable result |
| --- | --- |
| Play from stopped or paused | Acquire the edit lock synchronously, clear preview, capture current composition and requested beat, then enter initializing. Successful current startup enters playing. |
| Play while initializing or playing | Ignore a redundant start. Pause and Stop remain available. |
| Pause | Invalidate the pending start and stop the engine. Retain the last valid audio-derived beat, or the pending target when initializing. Publish paused and restore editing. |
| Stop | Invalidate the pending start, dispose the composition graph, stop preview, reset beat to zero, and restore editing. Follow behavior is defined in the rendering contract. |
| Seek while stopped or paused | Clamp to the effective playback extent and publish the target without audio. Any request in the final measure's visual padding resolves to the actual playback end. |
| Seek while initializing or playing | Invalidate the previous attempt, keep the edit lock, publish the clamped target, and start only the latest request. |
| Loop at end | Keep the edit lock while replacing the session and publish the actual restart beat. Natural end without loop follows Stop semantics. |
| No playable range or startup failure | Dispose resources for that attempt. Publish a recoverable non-active state and release the lock. At the exact end, a non-looping request schedules no events. |
| Master volume | Remains available in all phases. Apply the latest value once an asynchronous graph is ready and update active gain without rescheduling. |
| BPM | Edits composition BPM while unlocked. Display it while locked. |

The final measure's visual padding never changes composition length, source events,
scheduled duration or loop boundaries. At the terminal beat the cursor uses the
actual playback-end anchor before any existing Stop or Loop transition.

## Ownership and cancellation

The sequencer store owns public playback phase, clamped position, loop, and error. A small
standalone edit gate carries the private synchronous lock and its owner token. The sequencer
store drives it. Composition actions consult it without importing the sequencer store. Expose
the public phase to UI with narrow selectors. The private lock and public phase change within
the same command transition, with replacement operations retaining lock ownership throughout.
Prevent subscribers from observing an editable interval during seek or loop replacement.

Retain the store's operation generation for async UI results and the engine's generation for
audio graph ownership. They serve different boundaries. Invalidate before each cancellation
and check ownership after audio initialization, before resource creation and scheduling, and
before publishing async results. Ignore a stale success or failure. Ensure owned partial
graphs dispose on failure; a stale completion must never dispose a newer graph. Use one
existing animation-frame publication loop per active request and cancel it on replacement
or exit. Continue using the audio engine clock to derive beats, including the scheduled
start offset. Never derive time from visual animation or scroll.

## Scheduling and mutation contract

Reuse the composition scheduling helper. Each eligible source event intersects the half-open
playback range. For a seek at beat S into an event occupying [a, b), schedule one fresh
attack at its source frequency and velocity, beginning at S and lasting b minus S, clipped
to the playback extent. Convert time with the current composition BPM. The gain path uses
track volume and master volume, with existing mute and solo filtering. For example, at
120 BPM, a note spanning beats 3–7 sought to beat 5 sounds for 1 second before release.
Seeking to beat 7 schedules no remaining portion. Carry `NoteEvent.id` and `NoteEvent.trackId` through the derived schedule.
Deduplicate by session and source event ID. Preserve distinct same-pitch events.

### Event-scoped voices

Each current playback session owns a voice pool per audible track and a queue of
scheduled events. Allocate a `VoiceLease` to each event entering a bounded lookahead
window. Use the existing Tone audio context for the queue wakeup and timestamps.
Do not derive audio scheduling from animation frames, navigation, or wall time.
Initial lookahead and refill settings are engineering parameters to validate with
actual browser timing. Use a fixed time horizon independent of composition length.
If a currently leased voice will become available before a pending attack, retry at
the reclaim point when it still permits timely scheduling. Do not treat temporary
lookahead reservations as permanent overload.

A lease owns one Tone.Synth until the release tail is safely over. See
[data-model.md](../data-model.md#render-and-interaction-state) for
`VoiceLease.sessionId`, `VoiceLease.trackId`, `VoiceLease.sourceNoteId`,
`VoiceLease.attackAt`, `VoiceLease.releaseAt`, `VoiceLease.reusableAfter`
and `VoiceLease.token`. Send exactly one
attack with the numeric source Hz and velocity, and a release to that same Synth
at the clipped end. Two overlapping events, including identical frequencies or close
microtones, cannot share a lease. Preserve each track's oscillator or additive
partials, envelope, gain and audibility. Reuse an idle same-track voice only after
its scheduled release tail and any automation have finished. The earliest reuse is
the scheduled release plus the configured envelope release, extended if required
by observed node lifecycle. Identify every queued callback by session and lease.
An idle notification is advisory and cannot reclaim a current lease early.

Allocate lazily for overlapping leases in the lookahead and active window. Respect
the existing per-track polyphony ceiling and treat overload explicitly using a
deterministic policy, with no stealing of a voice assigned to a still-playing event.
The independent-duration contract applies within supported polyphony. Validate
reuse, attack and release ordering with the installed Tone API, including sustain
zero, resumed notes and rapid replacement. On cancellation, clear the queue wakeup,
invalidate leases, then dispose active, reserved and idle synths, track gains and
the session limiter before replacement. Do not close the shared preview audio context.

Guard every mutation before any history, persistence, selection, ID creation, or other
side effect attributable to that mutation. Cover setName and setBpm, note add/update/remove,
track add/update/remove including synth, gain, mute and solo, undo, redo, reset, and
sequence import. Do not change histories or composition-coupled selection when a mutation
is rejected. Selection commands, navigation, zoom, and master gain remain available.
No current production caller writes raw state directly. Keep composition writes inside
guarded actions and avoid exposing a new bypass. Use the active gate both for control
availability and at the command boundary as applicable.

Mathematics transfer currently calls Stop before import and sets BPM afterward. Reject
an attempted transfer while locked **before** stopping playback, changing BPM, or
navigating. Also guard the import action against direct calls. The current unlocked
path sets the Mathematics Lab BPM after import, as recorded in ADR-004.
Preserve the current unlocked behavior in 11D. ADR-004's approved future tempo choice
and ADR-005 provenance remain assigned to stages 12 and 14.
