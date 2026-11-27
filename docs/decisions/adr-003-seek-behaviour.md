# ADR-003 · Seek Behaviour

**Status** Accepted. Full verification pending.

## Context

The current audio engine schedules note attacks and releases. Scheduling the remainder
of a note after seeking into it creates a fresh attack.

## Decision

When playback starts inside a sustained event, schedule a new attack at the source
frequency for the remaining duration. Apply track mute, solo, and gain. Cancel obsolete
scheduled events and prevent duplicate scheduling for the same event in the new range.
The repeated attack is a documented limitation of the current engine.

## Consequences

The scheduling helper already clips sustained events to the playback range. Verify
frequency, remaining duration, audibility, track gain, and queue replacement across
repeated seeks. This supports constitution principles IV, VI, and IX.
See [11D](../roadmap.md) and [TD-004](../technical-debt.md).
