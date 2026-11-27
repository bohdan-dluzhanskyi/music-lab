# ADR-002 · Playback Editing Policy

**Status** Accepted. Implementation pending.

## Context

The Sequencer schedules a snapshot of the composition. The current UI blocks some edits,
and the underlying mutation paths can still change musical data during playback.

## Decision

Block edits to musical data during playback initialization and active playback. The rule
applies at the mutation boundary as well as to editing controls. Navigation, track
selection, zoom, and master volume remain available.

Pause and Stop restore editing. Resuming after an edit must schedule the latest
composition from the applicable transport position. Live editing may be specified
and implemented separately.

## Consequences

Test initialization as well as active playback, all permitted interactions, restoration
of editing on Pause and Stop, and resumption with edited data. This supports constitution
principles III and VI. See [11D](../roadmap.md) and [TD-004](../technical-debt.md).
