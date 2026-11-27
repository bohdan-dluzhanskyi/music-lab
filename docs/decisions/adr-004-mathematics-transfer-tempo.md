# ADR-004 · Mathematics Transfer Tempo

**Status** Accepted. Implementation pending.

## Context

Mathematics Lab and Composer use separate tempo settings. A sequence transfer currently
preserves beats and uses the destination composition's tempo.

## Decision

Offer **Keep composition tempo** and **Use generator tempo** when transferring a
sequence. Default to **Keep composition tempo**. Applying the generator tempo changes
composition-wide playback, so require an explicit choice before changing BPM.

## Consequences

Verify both choices in a multitrack composition. Capture the original generator BPM
as provenance when provenance support is delivered. This supports constitution
principles IV, XII, and XIII. See [stage 12](../roadmap.md),
[TD-005](../technical-debt.md), and [ADR-005](adr-005-generation-provenance.md).
