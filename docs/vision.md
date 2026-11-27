# Music Lab vision

Music Lab is an offline desktop-oriented laboratory for making music and investigating
relationships among mathematics, geometry, acoustics, and musical theory. It serves
composers who want playable material and researchers who need reproducible methods.

## Three workflows

- **Mathematics to music.** Map sequences, ratios, angles, and dynamical systems to pitches
  and rhythms. Audition the result, transfer it into a composition, and edit it there.
- **Music to mathematical models.** Analyze existing works for measurable patterns in pitch,
  rhythm, harmony, and form. Report how each pattern was measured and what evidence supports
  its interpretation.
- **Theory and algorithms together.** Combine scale, chord, and progression rules with
  mathematical generators. Make the effect of each transformation audible and inspectable.

## The intended workspace

A musician can create, edit, hear, and analyze a multitrack work in one workspace. Piano Roll,
staff notation, and instrument tablature describe the same musical events. The original
frequency and timing are preserved for playback and analysis. Notation shows microtonal
deviations and the size of any rhythmic approximation. Mathematical synthesis and realistic
instrument sounds support complementary listening tasks.

An experiment can be repeated from its source material, exact parameters, seeds, algorithm
versions, and recorded results. Generation provenance survives later edits to the material.
Observed structure, subjective preference, and evidence about compositional intent are
distinct claims. User projects, experiments, and settings are owned locally, and core
workflows run offline.

## Current scope

The browser workspace implements mathematical generation, theory and geometry labs, synthetic
playback, multitrack editing, single-staff notation, and tablature. The
[roadmap](roadmap.md) tracks the two-staff score, analytical workflows, complete local project
storage, file exchange, realistic instruments, and desktop delivery.
The [constitution](../.specify/memory/constitution.md) governs these capabilities. The [architecture decisions](decisions/README.md) record the
approved policies for notation, playback, and generated material.
