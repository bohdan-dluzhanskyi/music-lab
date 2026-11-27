# ADR-001 · Exact Musical Data Preservation

**Status** Accepted. Implementation pending.

## Context

Composer accepts events that exact rhythmic decomposition cannot express. A single note
or intervening gap can currently interrupt rendering of the whole score.

## Decision

Preserve every source `NoteEvent` frequency, start position, and duration without implicit
rounding. When standard notation cannot express an event exactly, use a separate derived
notation representation that retains its source identity and exact position.

Render the nearest supported rhythmic value. Visibly flag the approximation and expose
its magnitude in quarter-note beats, including any displayed onset or duration deviation.
Keep the original timing for playback and analysis. The approximation must leave the
canonical composition intact, and one unrepresentable event must not prevent the
remaining score from rendering.

The algorithm must be deterministic and account for bar boundaries, event order, voices,
and rests. The feature specification will define the supported rhythm set, tie-breaking,
and display details. Arbitrary tuplets may be specified separately.

## Consequences

Verification must cover exact and approximate rhythms, bar and voice constraints, and
preservation of canonical values. This supports constitution principles III, IV, and VII.
Delivery is tracked in [11D](../roadmap.md) and [TD-001](../technical-debt.md).
