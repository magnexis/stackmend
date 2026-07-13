# Repository Knowledge Engine

## Purpose

The Repository Knowledge Engine, or `RKE`, is the persistent intelligence core for STACKMEND Phase 3.

It is responsible for:

- maintaining repository state across runs
- updating knowledge incrementally
- storing evidence and history
- storing learned patterns and reusable maintenance knowledge
- exposing queryable repository objects
- feeding repair, prediction, memory, and verification systems

## Core responsibilities

### Persistent model

The RKE should preserve:

- repository entities
- relationships
- evidence
- contracts
- feature registry
- repair history
- snapshots

### Event ingestion

The RKE should process:

- file changes
- test results
- CI events
- dependency changes
- policy updates
- repair outcomes
- structured external knowledge sources

### Derived intelligence

The RKE should produce:

- change impact predictions
- contract break detection
- duplicate logic signals
- repository memory summaries
- feature health assessments
- learned recommendation priors
- reusable repair and contract patterns

## Continuous learning loop

The RKE should maintain a bounded learning loop:

1. Read code, config, tests, docs, and structured external inputs.
2. Normalize them into repository entities, evidence, contracts, and patterns.
3. Store verified patterns and repair outcomes.
4. Reuse those patterns to improve ranking, impact prediction, and repair planning.
5. Revalidate learned assumptions whenever fresh evidence contradicts them.

The key rule is:

- learned knowledge may improve prioritization and pattern recognition
- learned knowledge may not override repository evidence or safety gates

## Storage model

The first durable repository layer should live under `.stackmend/`.

Suggested early persisted artifacts:

- `repository.db`
- `feature-registry.yaml`
- `learning/`
- `history/`
- `snapshots/`
- `reports/`

Suggested learning-specific artifacts:

- learned pattern library
- repair outcome ledger
- ingestion source registry
- confidence calibration records

## Safety and trust

The RKE must remain evidence-backed.

It should never treat stale cache as truth without revalidation where required.

It should also never allow autonomous ingestion to become an untrusted source of silent truth.
