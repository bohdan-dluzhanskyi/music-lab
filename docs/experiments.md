# Experiment methodology

This document defines a protocol for future studies. It contains no historical experiments
or results. The [scientific foundations](scientific-foundations.md) define the mathematical
models, and stage 14 of the [roadmap](roadmap.md) covers experiment records in the application.

## Design the comparison

1. State a testable hypothesis, the population or material of interest, and the primary
   outcome. For example, a future study could test whether a specified hybrid generator
   changes listener ratings of perceived tension relative to a theory-only baseline.
2. Define a control condition. For a three-way comparison, prepare comparable
   theory-only, mathematical-only, and hybrid excerpts. State how each excerpt is generated
   or selected, and document the scale, source sequences, and blend weight where applicable.
3. Set the independent variables, such as generation method, weight, tuning, or rhythm.
   Set the dependent variables, such as listener rating, classification accuracy, pitch-class
   entropy, interval distribution, or inter-onset variability. Predefine units, measurement
   windows, rubrics, and how simultaneous events are handled.
4. Hold tempo, duration, register, dynamics, loudness, instrumentation, rendering settings,
   and playback environment constant where compatible with the hypothesis. Record
   unavoidable differences and decide whether they are factors or confounds.
5. Choose the experimental unit, sampling and allocation method, sample size rationale,
   inclusion and exclusion criteria, and analysis plan before collecting outcomes.

## Record and reproduce

Keep the protocol, source material and identifiers, application and algorithm versions,
all parameter values, seeds and initial states, tuning and reference frequencies, tempo,
rendering and instrument settings, and measurement code or procedures. Preserve canonical
note data, generated outputs, stimulus ordering, and the raw and processed results where
appropriate. Record hardware or software details that affect audio and define numerical or
render tolerances for repeating a run. Store participant data locally, obtain appropriate
consent, and keep identifying information apart from analysis records.

A repeat run should use the recorded inputs, reproduce deterministic note results within the
declared tolerance, and document any audio differences from platform or engine changes.
Raw records and derived summaries need identifiers so each published result can be traced to
its inputs. The current application supports deterministic generation but has no dedicated
experiment store. A study conducted now must preserve the required artifacts separately.

## Listening and measurement

Use anonymous condition labels and randomize or counterbalance presentation order.
Blind listeners to condition labels and the expected direction of an effect. Blind
administrators or analysts where feasible, and document when the stimulus itself can reveal
the condition. Match levels, standardize listening instructions and setting, and record
order, fatigue, training, and any equipment differences.

Analyze subjective measures, such as preference or perceived tension, as listener responses.
Analyze objective measures, such as note frequency ratios, onset distributions, and audio
levels, using defined procedures. Link the two only through an explicit hypothesis and
analysis. A mathematically regular excerpt can receive any preference rating.

## Statistical analysis and interpretation

Select a method appropriate to the design and scale of the outcome. Paired comparisons or
models with listener and excerpt effects are candidates when people rate multiple excerpts
or conditions. Avoid treating multiple ratings of the same material as independent evidence.
Report sample and exclusion counts, assumptions, missing-data treatment, effect estimates and
uncertainty intervals, and any planned adjustment for multiple comparisons. Label exploratory
findings and separate them from the prespecified tests.

Limit conclusions to the studied material, population, tuning, and rendering conditions.
A pattern in a score can arise by chance, by convention, or through unrelated compositional
choices. Claims of intentional use need independent historical or documentary evidence.
Associations between structure and listener ratings depend on the design and do not by
themselves establish causation or a universal standard of musical quality.
