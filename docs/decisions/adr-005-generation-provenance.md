# ADR-005 · Generation Provenance

**Status** Accepted. Implementation pending.

## Context

Transferred notes retain the result of a generation run. Reproduction also needs the
inputs and algorithm version. The composition may subsequently be edited.

## Decision

Store versioned provenance for mathematically generated material, including:

- Generator identifier and algorithm version.
- Generator parameters and reference frequency.
- Seed when applicable.
- Mathematical weight, quantization settings, and rhythm settings.
- Original BPM and generation timestamp.
- Source sequence identifier.

Preserve the original generation parameters and their association with the material
through manual edits. Distinguish original generation inputs from subsequent composition
changes. Define the final storage schema in the specifications for stages 12 and 14.

## Consequences

A saved origin record must reproduce the original generation. Editing its resulting
notes must preserve that record. Verify the distinction through save and reload. This
supports constitution principles II, III, and VIII. See [roadmap](../roadmap.md) and
[TD-005](../technical-debt.md).
