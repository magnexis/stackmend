# STACKMEND Phase 3 Delivery Plan

## Product move

Phase 3 shifts STACKMEND from:

- intelligence and repair platform

to:

- persistent software maintenance operating system

## Delivery stages

### Stage 1. Repository Knowledge Engine foundation

Build the persistent substrate:

- repository database format
- snapshot model
- event ingestion model
- incremental indexing pipeline
- `.stackmend/` repository layer
- learning storage and source registry

Exit criteria:

- repository intelligence can persist between runs
- incremental updates are cheaper than full rescans
- history and evidence survive editor restarts

### Stage 2. Persistent repository modeling

Extend the model with durable repository objects:

- symbols
- features
- contracts
- commands
- deployments
- tests
- docs
- ownership metadata

Exit criteria:

- repository objects can be queried with history and evidence
- features and contracts are first-class knowledge entities

### Stage 3. Change impact and refactor intelligence

Introduce repository-aware pre-change reasoning:

- impact prediction
- regression risk estimation
- smart refactor planning
- duplicate logic discovery

Exit criteria:

- one edited object can produce downstream impact predictions
- whole-repo refactors can be previewed before application

### Stage 4. Operational repository memory

Add long-lived knowledge and maintenance memory:

- repair history
- subsystem notes
- known failure modes
- ownership hints
- evolution reporting
- learned repair and pattern storage

Exit criteria:

- repository knowledge outlives individual contributors
- maintenance context can be surfaced on demand

### Stage 5. Safe repair execution

Add controlled repair orchestration:

- preview mode
- dependency analysis
- conflict detection
- simulation
- verification pipelines
- rollback point creation

Exit criteria:

- no automated repair bypasses safety gates
- repair execution is inspectable and reversible

### Stage 6. Universal integrity layer

Expand repository coverage beyond code-only concerns:

- infrastructure
- CI/CD
- API specs
- configuration
- deployment
- documentation
- structured external knowledge ingestion

Exit criteria:

- STACKMEND can reason about a repository as one connected software system
- cross-surface fractures can span code, infra, docs, and delivery

## Proposed package additions

```text
packages/
  change-impact-engine/
  feature-discovery/
  repository-memory/
  regression-investigator/
  safe-repair/
  smart-refactor/
  standards-normalizer/
```

## Package responsibilities

### `packages/change-impact-engine`

Predicts downstream effect, regression scope, and verification needs for proposed changes.

### `packages/feature-discovery`

Discovers feature-level systems and verifies them across UI, API, data, tests, docs, and deployment.

### `packages/repository-memory`

Stores long-lived maintenance knowledge, history, ownership hints, and subsystem context.

It should also persist reusable learned patterns and repair outcome history.

### `packages/regression-investigator`

Investigates likely causes for failing tests, broken contracts, and sudden repository regressions.

### `packages/safe-repair`

Implements guarded repair flow with preview, simulation, verification, apply, and rollback coordination.

### `packages/smart-refactor`

Plans and executes repository-wide renames and refactors across code, docs, tests, config, and examples.

### `packages/standards-normalizer`

Finds competing implementation patterns and proposes standardized approaches across repositories.

## Required technical qualities

- durable repository state
- bounded storage growth
- fast incremental updates
- explainable maintenance memory
- auditable autonomous ingestion
- safe automation gates
- scalable background processing

## Testing strategy

Phase 3 needs additional test layers:

- repository snapshot tests
- incremental indexing regression tests
- impact prediction fixtures
- smart refactor integration tests
- safe repair simulation tests
- repository memory consistency tests
- large-scale performance and cache recovery tests

## Success criteria

Phase 3 is successful when STACKMEND can answer:

- what this repository is
- how it has evolved
- what this change will affect
- why this subsystem exists
- what broke and why
- what repair is safe to apply
