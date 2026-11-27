# ADR-006 · Repository Hygiene

**Status** Accepted.

## Context and evidence

`music-lab-source.zip` was introduced in commit `434b12c`. Listing and
integrity checks show a source snapshot with 129 file entries, including source,
configuration, and a macOS metadata file. Selected notation and tablature files differ
from the working tree. Repository searches found no reference from the app, tests,
build configuration, or existing usage instructions. The debt register references the
archive solely to document its review.

## Decision

Remove the outdated source snapshot from Git while preserving the local copy. Add
the root-scoped rule `/music-lab-source.zip` to `.gitignore`.

## Consequences

The local copy remains available and future checkouts omit the archive. The ignore rule
applies only to that path at the repository root. Earlier commits retain the snapshot.
See [TD-012](../technical-debt.md).
