# STACKMEND Autonomous Learning

## Goal

STACKMEND should continuously improve as it reads more code, observes more repositories, and sees the outcomes of more repairs.

The purpose of autonomous learning is to make STACKMEND better at:

- recognizing repository patterns
- ranking likely fractures
- predicting change impact
- selecting repair strategies
- identifying reusable subsystem contracts

## What it should learn from

### Repository-native inputs

- source code
- configuration
- tests
- CI output
- docs
- deployment manifests
- package metadata
- repair results

### Structured external inputs

- OpenAPI specs
- GraphQL schemas
- changelogs
- issue tracker exports
- architecture decision records
- dependency advisories
- internal docs and runbooks

## What it should store

Persist learned data under `.stackmend/learning/`.

Suggested artifacts:

- `pattern-library.json`
- `repair-outcomes.jsonl`
- `ingestion-sources.yaml`
- `confidence-calibration.json`
- `feature-signatures.json`

## Learning model

The system should train itself in bounded ways by:

1. extracting patterns from analyzed repositories
2. correlating patterns with successful and failed repairs
3. updating recommendation weights
4. reusing verified patterns in future analyses

This is best treated as:

- self-improving maintenance intelligence

not:

- unconstrained autonomous AI behavior

## Autonomous ingestion

Autonomous ingestion should be:

- opt-in
- source-scoped
- auditable
- cacheable
- revalidatable

It should not be:

- arbitrary web scraping
- opaque training from unknown sources
- silent mutation of repository truth

## Safety boundaries

- Learned data must never replace repository evidence.
- External ingestion must record source provenance.
- Stale learned patterns must decay or be revalidated.
- Unsafe or low-confidence learning outputs must not auto-apply repairs.
- Teams should be able to disable or clear learning storage.
