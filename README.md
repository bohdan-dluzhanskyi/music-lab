# Music Lab

Music Lab is a desktop-oriented, offline music laboratory for composing with mathematics,
exploring acoustics and musical theory, and investigating the patterns that give music structure.

## Current capabilities

- Frequency, MIDI, cents, harmonics, and synthetic sound exploration.
- Scales, chords, progressions, the circle of fifths, note clocks, spirals, and Lissajous figures.
- Mathematical sequence generation, blending, scale quantization, and Euclidean rhythms.
- Multitrack Composer and Piano Roll with local persistence, undo and redo, and sequenced playback.
- Microtonal frequency preservation, single-staff notation, and guitar, bass, and ukulele tablature.

The current app runs in a browser. The piano grand staff, score playback synchronization,
file exchange, musical analysis, experiment records, realistic instruments, and Tauri
packaging are planned. See the [roadmap](docs/roadmap.md).

## Run locally

Use a Node.js version compatible with the locked dependencies. The baseline audit ran on
Node.js 24.14.1 and npm 11.19.1.

```sh
npm ci
npm run dev
```

Open the local URL reported by Vite. Start sound with an explicit action in the app so
the browser can activate audio.

## Verification

```sh
npm run lint
npx --no-install tsc -b
npm run test:run
npm run build
```

Use `npm test` for watch mode, `npm run test:coverage` for a coverage report, and
`npm run preview` to serve a completed build. Changes to notation rendering or audio
also require direct browser verification.

## Stack and layout

React, TypeScript, Vite, SCSS, Zustand, Tone.js, VexFlow, and Vitest. React Router handles
navigation. Tonal is declared in the manifest and has no current application imports.

| Location | Purpose |
| --- | --- |
| [src/core](src/core) | Mathematical and musical models and pure domain logic |
| [src/engines](src/engines) | Tone.js sequencing and audio, VexFlow rendering |
| [src/stores](src/stores) | Zustand composition, project, audio, and playback state |
| [src/app](src/app), [src/pages](src/pages), [src/features](src/features) | Navigation, screens, and feature interactions |
| [src/tests](src/tests) | Vitest suites |
| [.specify](.specify), [.agents/skills](.agents/skills) | Spec Kit configuration, templates, and Codex skills |

## Documentation and development

- [Vision](docs/vision.md)
- [Architecture](docs/architecture.md)
- [Scientific foundations](docs/scientific-foundations.md)
- [Roadmap](docs/roadmap.md)
- [Technical debt](docs/technical-debt.md)
- [Experiment methodology](docs/experiments.md)
- [Architecture decisions](docs/decisions/README.md)
- [Music Lab Constitution](.specify/memory/constitution.md)

Substantial features follow Spec Kit in Codex. Use `$speckit-specify`,
`$speckit-clarify`, `$speckit-checklist`, `$speckit-plan`, `$speckit-tasks`,
and `$speckit-analyze` before `$speckit-implement`. Verify acceptance criteria and
quality gates after implementation. Use `$speckit-converge` when verification finds
outstanding implementation work. Approved decisions on exact timing, playback, and generated
material guide future specifications. Their delivery status is tracked in the roadmap.
