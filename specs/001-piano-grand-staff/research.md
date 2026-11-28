# Research — Piano Grand Staff & Sequencer Synchronization

## Rhythmic preparation and approximation

**Decision.** Extend the pure Notation Core around `prepareScore`. Use exact integer
notation ticks, a minimum-fragment duration table, and deterministic bounded optimization
of absolute onset and end positions per measure. Retain the existing exact path as a
fast path after correcting its greedy decomposition. Prepare timing once for the selected
track, then partition the resulting score into treble and bass for Piano mode. Standard
and Tablature consume the same timing. Preserve original `NoteEvent` values by reference
or snapshot and use stable IDs to connect fragments to a source event.

**Rationale.** The current `score.ts` slices notes at barlines, fills rests, and invokes
`decomposeDuration` for every span. `rhythm.ts` greedily chooses the largest available
value and throws on a leftover. This fails even for some representable lengths.
`voices.ts` groups same-onset notes only when durations also match. Keep those groups
as chord atoms while adding an onset group that couples different-duration notes and
both staves. Existing measure validation and pitch conversion remain applicable. Use
source intervals for voice assignment and reserve each carried note's voice through
every bar it crosses. Sort source atoms deterministically by onset, end, and stable ID
before consulting the existing first-available voice rule.

**Alternatives considered.**

| Approach | Finding |
| --- | --- |
| Independently round onsets or durations | Simple, but rounded durations can accumulate drift and break rests, bar capacity, order, and simultaneity. |
| Snap absolute endpoints independently | Avoids accumulated duration rounding. Collisions, zero-length notes, and gaps too short for a rest remain possible. Use absolute endpoint distance to rank legal candidates. |
| Enumerate written token combinations and all simultaneous assignments | Finds legal representations in principle. Repeated decompositions and Cartesian products create unnecessary search growth. |
| Dynamic programming with deterministic bounds | Reuses exact span solutions, shares equal-onset placements, enforces validity before ranking, and makes exhaustion reportable. |

### Written duration arithmetic

Use **256 integer written ticks per quarter-note beat**. The base values whole through
sixty-fourth are 1024, 512, 256, 128, 64, 32, and 16 ticks. A single dot multiplies
by 3/2 and two dots by 7/4. A sixty-fourth with one dot is 24 ticks and with two dots
is 28 ticks. The vocabulary has a common stride of four ticks, so candidate boundaries
may step by four within a measure. This optimization preserves values such as 28 ticks,
which a 16-tick boundary grid would exclude. A lattice point is only a candidate.
For example, a 4-, 8-, or 12-tick gap cannot contain any supported rest.

Build an exact-length table for each used bar length. The table's zero-length entry is
an empty span. For each positive length, try all 21 tokens whose size fits, extend
reachable predecessor lengths, and retain the least fragment count. Use larger base
values first on a token-order tie, then fewer dots, with a stable token order. For note
spans, link consecutive fragments by source ID. For rests, concatenate the same rhythm
tokens without ties. Clip at every crossed barline before tiling; a legal span on one
side cannot borrow capacity across that boundary. For a fixed placement, the minimal
fragment count also minimizes internal ties. Cross-bar ties are determined by source
continuity and rendered fragments. This table is a shortest-path recurrence over lengths
ordered from zero upward. [NIST DAG shortest paths](https://xlinux.nist.gov/dads/HTML/dagShortPath.html)

### Staff projection and final-bar validity

Preserve each prepared voice's identity independently on each staff. For each measure,
filter chord members by split pitch. If no member of a token remains on that staff,
replace its time span with the same base-and-dot rest token. If members remain, retain
the token's exact written span and their tie edges. This proves staff-local rest
reachability for a tiled source voice: removing a run of note tokens leaves a concatenation
of legal rest and note durations, each available as a rest. It would be unsafe to assign
new voices after filtering or to presume that every lattice gap is legal. Keep at least
one full-metric rest voice on an empty staff. Check each projected voice for legal leading,
internal and trailing rests, positive durations, stable onset ticks and exact metric fill.
If optional rest merging fails, keep the original token boundaries. If neither that
projection nor exact rest tiling can validate the voice, show a local placeholder and
diagnose affected source IDs. Changing the split never reruns placement or moves any
event in written time.

Use the existing effective playback length L and the full visual meter endpoint M of
the last measure. When L falls inside the last bar, include a shared written cutoff for
L in placement, require note ends at or before it, and tile cutoff to M with positive
legal rest tokens on each rendered voice. Rank legal cutoffs by the source-end deviation
after the approved note-placement objective, using the earlier cutoff for a tie. For
a tail shorter than one token, move the written boundary as needed within the legal
placement rules. If retaining all notes and a legal tail is impossible, use the explicit
partial classification and individual diagnostics. A 4/4 score ending exactly at beat
5.5 can place its shared cutoff at 5.5 and tile the remaining 2.5 beats as half plus
eighth rests. Neither the source length nor the loop interval changes.

### Absolute placement and bounds

Partition the source into measure intersections. Pin an incoming continuation to the
bar start and an outgoing continuation to its bar end. Group genuinely simultaneous
source attacks into one placement variable across voices, even when their end times
differ. Preserve distinct source attack order within the measure and share each
simultaneous group's written onset. Keep note/rest spans and all bar edges legal.
Within a voice, gaps before, between, and after notes must be zero or reachable in
the rest table. A written note must consume at least one token.

Try exact placement first, including rests and bar tails. When exact placement is
unavailable, traverse a layered state graph. Each layer assigns the next shared onset
or one end of a note atom in that onset group. A state records the last assigned group
onset, the current group's shared onset when needed, and the last end in each
relevant voice. Assign end variables incrementally so the implementation need not
materialize a Cartesian product. Discard invalid states early. Crossing notes keep
fixed bar edges and source voice identity. If fallback omits a crossing fragment,
tie actual contiguous fragments and diagnose the missing piece.

### State equivalence and certification

Store the next decision index, pending shared onset, each live voice end, retained
event and fragment choices, and cross-bar continuation identity. Carry source ID,
original onset and end, written first onset, accumulated fragment and tie counts,
pending continuity, and last written end for every cross-bar source event whose
contribution is still open. Include the final-measure cutoff choice if it affects
later legal decisions or tie-breaking.

Merge states only if they admit identical future decisions and future objective
contributions, including cross-bar continuity and the final source-order tie-break.
Discard a history only when its lexicographic score dominates for every such
completion. If equality or dominance is unproved, keep the histories distinct or
record the pruning as a loss of certification. Fixed bar pins alone do not prove
that all objective tiers separate. Local certificates compose globally only when
bar constraints and all objective contributions, including source-order comparison,
provably factor, or when compatible boundary signatures and pending contributions
are joined with a certified optimum. Otherwise a complete legal result stays bounded.
The implementation may certify separable cases and leave coupled cases bounded.

Compare against an independent exhaustive oracle over small multi-bar fixtures
with cross-bar sustain, simultaneous attacks, and equal endpoint error but different
fragment or tie totals. Compare the complete rank and deterministic winner rather
than only feasibility or the first objective. A certificate covers all relevant
branches, including merged or pruned histories.

Use this ranking for complete legal placements, in order:

1. Enforce measure/voice validity and preserve event order and simultaneous attacks.
2. Minimize endpoint L1 error, `E = Σᵢ (|ŵsᵢ − sᵢ| + |ŵeᵢ − eᵢ|)`, in quarter-note
   beats, counting each source event once. For a crossing note, count its onset only
   in the first bar and its end only in the last bar. Chord grouping does not change
   the per-event weight. Pinned internal edges carry no cost.
3. Minimize written fragment count, then ties. Count shared written chord tokens
   once for the fragment objective and count rest fragments in otherwise equivalent
   placements.
4. Compare the sequence of onset/duration pairs in stable source order, preferring
   earlier onsets and then shorter durations. Use the source ID and canonical token
   order only as final deterministic tie-breaks.

Store source timing as the original JavaScript numbers. Subtract the measure origin
for optimization only. Treat a source endpoint as the nearest exact written endpoint
for comparison when it differs by no more than `1e-8` quarter-note beats. This applies
only to floating-point comparison noise and does not erase any positive source note,
change source order, or permit a zero-length written span. For cost comparisons,
use deterministic integer comparison units of `1e-9` beats per endpoint contribution
to avoid non-transitive epsilon ties. Check accumulation fits the safe integer
range or keep the same integer comparison with arbitrary-precision accumulation.
Signed diagnostics remain displayed-minus-original in beats, computed from source
and written intervals. Present nonzero deviations that survive the exactness
tolerance with enough precision to distinguish them from zero.

For a bar of `T` integer ticks and `K=21` tokens, the duration table takes
`O(TK)` time and `O(T)` storage before applying the common stride. The full
multi-voice state space grows with voice count. Bound actual work with a fixed
candidate/state budget per measure and a cumulative score budget. As an initial
engineering cap, allow at most 256 retained frontier states and 32,768 candidate
probes per measure, with at most 2,000,000 probes per score. Count rejected candidates
as probes. Maintain a bounded ranked frontier and a predecessor trail for
reconstruction. With `V` active voices, `L` layers, frontier cap `B`, and actual
probe count `P`, placement work is bounded by `O(P(V + log B))` with compact per-state
metadata and stable predecessor ranks. Reconstruction storage is bounded by
`O(LBV)`. Use exact windows, table reuse, and deterministic measure traversal rather
than spending the budget on already representable bars. Treat these caps as preliminary
engineering values and verify them on the documented 8-, 64-, and 256-bar workloads.

Run an exact pass over all visited measures before allocating approximation probes.
Give every unresolved bar a deterministic initial share of the score budget, bounded
by its per-bar cap, before any bar receives extra probes. Distribute leftover probes
in bounded rounds across still-unresolved bars, with fixed measure-index ordering for
remainder ties. Thus a difficult opening cannot consume the entire score allocation.
Retain the best validated placement per bar across rounds. On total exhaustion, publish
complete legal incumbents as bounded and legal subsets as partial, with an affected-source
diagnostic for every omitted event or fragment. Preserve later exact bars and never
drop a suffix because earlier search exhausted its share.

Before implementing placement, fix the pure step contract. Initialization derives
a `SearchState` from an immutable score input and deterministic budgets. It carries
the search frontier, best feasible candidate, current decision and candidate position,
remaining budgets, certification evidence and stable ordering state. Each step
consumes at most the requested work units and returns the continuation state or a
terminal prepared result. Bound initialization, candidate expansion, rest-table
building and finalization by resumable units as well. Splitting a step is independent
of how candidate probes are charged, including rejected candidates, and cannot change
traversal, budget accounting or certification. Keep the core free of timers, DOM,
React and Zustand.

The preparation session owns request version, input identity, continuation and host
scheduling. It runs pure steps in cooperatively yielded work slices with the existing
browser runtime. A version change can cancel within a difficult bar at the next
bounded step boundary without discarding already completed unrelated work within
a still-current request.
Check request ownership between slices and before publication. Stop queued work on
cancellation and discard stale geometry, diagnostics and score results together. The
same snapshot and budgets must produce the same answer regardless of scheduling.
Keep the last valid matching snapshot, or show a pending state; stale snapshots cannot
drive cursor or navigation for another input. Measure main-thread slice and blocking
costs as well as total wall time. Consider a worker only if measurements justify it.

### Result classification and certification

| Result | Required evidence |
| --- | --- |
| Exact | Every source event is represented at exact source timing under the declared comparison policy, and placement and required rests validate. |
| Optimal approximation | The complete placement satisfies hard constraints and a complete search, or admissible bounds covering every unexplored branch, certifies all objective and tie-break tiers. |
| Bounded approximation | A complete legal placement exists, but coupled boundaries, unproved reductions or resource limits prevent certification. Disclose the reason and signed deviations. |
| Partial representation | At least one source event or fragment cannot be shown. Distinguish proved infeasibility from search-budget exhaustion. Use a separate display-limit reason for failures outside placement search, such as a projection or resource limit. |

A pruned search alone proves neither optimality nor infeasibility. Retain deterministic
legal subsets when no complete candidate can be returned. Prioritize retained events
before endpoint and fragment ranking and keep simultaneous groups intact. Preserve
other bars and unaffected voices, and emit a diagnostic per omitted source event,
including the affected measures or fragments. A score reports the least complete result
across its measures and projected views while preserving local reasons. Canceled or stale
work publishes no result classification. Verify that ordinary reference fixtures produce
exact or certified results for separable reference cases. Legal coupled cases may remain
bounded without using partial fallback.
Playback and analysis continue to consume original events.

### Worked fixtures

These are predicted contract outcomes, in quarter-note beats, rather than performance results.

| Source | Written result and reason |
| --- | --- |
| In 4/4, start 0.125 and duration 0.125 | Exact start and duration, with a thirty-second leading rest and note. No deviation. |
| In 4/4, isolated start 0.1 and duration 0.5 | Written start 0.09375 and duration 0.5. End 0.59375, onset deviation −0.00625 and duration deviation zero. The leading dotted sixty-fourth rest is valid. |
| In 4/4, isolated start 0 and duration 0.3 | Written duration 0.296875, or 76 ticks, using a dotted thirty-second (48 ticks) tied to a double-dotted sixty-fourth (28 ticks). Duration deviation −0.003125. Greedy subtraction of 64 ticks leaves an impossible 12 ticks. |
| Start 3.9375 and end 4.0625 in 4/4 | Pin 4.0 and write one sixty-fourth on each side, tied by source ID. At a system break, draw two continuation halves with the same identity. |
| Two atoms at 0.1, with durations 0.5 and 1, on different staves or voices | Share written start 0.09375. Preserve their distinct ends and align their attacks. The staff split does not change the timing result. |
| In 1/64, two successive notes in one voice at 0 and 0.03125, each lasting 0.015625 | Each would need a whole 0.0625-beat bar for the shortest written token. Only one can fit. Preserve the earlier note under the stable source-order tie-break and diagnose the other while retaining both in the composition. |

Validate score behavior with the existing `src/tests/notationEngine.test.ts` and
`src/tests/tablature.test.ts` fixtures, add regression cases for the greedy failure,
off-grid starts, long repeated off-grid notes, barline and voice constraints, and
compare the bounded search against exhaustive enumeration on small reference problems.

### Resource bounds outside the reference workloads

Validate written tick arithmetic before iterating and avoid dense allocations indexed by
arbitrary absolute beat values. Cache one bounded remainder table per used meter. Treat
the duration table size, number of visited measures, and total number of emitted tokens
as separate resource budgets. For ordinary meters, prove expected behavior with the
[verification workloads](quickstart.md). For extreme valid inputs, process requested
measure windows or chunks, retaining source IDs and original measure indices across
chunks. A pathological measure that cannot be rendered within the validated budget
gets a local display-limit diagnostic and a safe placeholder with its source extent.
Do not report this as a proof of rhythmic impossibility. Establish table and layout
budget values using the first measured implementation baseline.

## Paired stave rendering and geometry

**Decision.** Extend the installed VexFlow 5.11.0 adapter using paired staves and one
shared timing format pass per measure. Format modifiers within each staff, retain
shared rhythmic X positions, and draw source-note-linked partial ties at system breaks.
Publish renderer-independent geometry. Project source beats through a monotone mapping
and interpolate against formatted positions. A cursor-only update moves the overlay.

**Rationale.** The existing engines share score preparation. The current Standard
renderer formats each staff independently and limits ties to the same row. The
installed types and ESM source provide the formatter, stave connector, and partial
tie behavior needed to keep the two staves aligned. The
[rendering contract](contracts/notation-rendering.md) records the checked calls and the
limits of the local Node smoke checks. Browser verification remains necessary.

**Alternatives considered.** Independent staff formatters can disagree on X when one
staff is sparse. Starting over with another renderer would duplicate existing notation
features. Traversing live SVG on every position update would couple screen layout to
playback frequency. A versioned geometry snapshot supports cheap interpolation and
explicit invalidation after actual layout changes.

## Playback ownership and protection

**Decision.** Reuse the existing sequencer store and engine, add an explicit initializing
phase, and preserve generation-based cancellation with clear store and audio ownership.
Use a small synchronous edit gate shared by the stores through one-way dependencies.
Enable the composition transport on Notation in every mode.

**Rationale.** The current store marks playback active before its asynchronous audio
start settles and temporarily marks seek or loop replacements editable. Composer uses
disabled controls for some changes, while composition actions themselves remain writable.
In particular, Mathematics transfer calls Stop, imports the sequence, and sets BPM.
Guard that entry point before Stop and guard each mutation command. Reuse existing
filtering, interval clipping and master-gain synchronization. The
[playback contract](contracts/playback.md) specifies the resulting transitions.

**Alternatives considered.** UI-only guards leave alternate callers and operation races.
Mutual imports between Zustand stores would introduce a dependency cycle. A second
playback engine or transport clock would violate the synchronization boundary. Live edits
would require rescheduling semantics outside 11D.

## Independent audio voice ownership

**Decision.** Keep the existing Sequencer. Replace pitch-keyed releases for composition
playback with per-event leases of lazily allocated Tone.Synth voices within a bounded
audio-context lookahead. Keep preview on its existing graph.

**Rationale.** Installed Tone.js 15.1.22 `PolySynth.js` chooses the first unreleased
matching MIDI entry. This cannot identify the intended attack for reversed release
order. Installed `Monophonic.d.ts` exposes numeric-frequency `triggerAttack` and
pitch-independent `triggerRelease` on an individual Synth. `Synth.js` stops its oscillator
after the envelope release and exposes disposal. `Context.d.ts` exposes
`setTimeout` and `clearTimeout` against the audio context, enabling one owned refill
callback without another playback clock. Verify future scheduling and pool cleanup
against real Tone behavior. Silence callbacks can precede the end of the reservation
and must not be the sole ownership rule.

**Alternatives.** Keeping PolySynth and adding event IDs to schedule records still
leaves the library release lookup pitch-keyed. Preallocating a Synth per composition
event scales graph size with the whole score. Lazy leases retain distinct releases
with resource use limited by active or reserved polyphony.

**Deferred work.** Unlocked Mathematics transfer currently sets the lab BPM after import.
ADR-004 and TD-005 now describe this baseline. The approved future tempo choice and generation provenance remain
outside 11D. Likewise, measured performance targets and browser/audio compatibility
need implementation evidence. No additional packages are assumed.
