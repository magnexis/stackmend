# STACKMEND Phase 4 Delivery Plan

## Product move

Phase 4 shifts STACKMEND from:

- persistent software maintenance operating system

to:

- continuously learning engineering intelligence platform

## Delivery stages

### Stage 1. MendMemory foundation

Build:

- memory schemas
- scoped memory layers
- Repair Genome format
- Outcome Loop format
- confidence and provenance model

Exit criteria:

- learned patterns can be stored with scope, confidence, and evidence
- raw repository content is not required for persistent reuse

### Stage 2. Outcome learning

Build:

- repair lifecycle tracking
- accepted or rejected repair feedback
- developer correction comparison
- verified success and failure capture

Exit criteria:

- repairs produce structured outcome records
- rejected and failed repairs reduce confidence correctly

### Stage 3. Memory specialization

Build:

- repository dialect detection
- workspace and organization memory
- developer preference memory
- contradiction resolution
- knowledge decay

Exit criteria:

- memory remains scoped and context-aware
- conflicting patterns can be specialized instead of overwritten

### Stage 4. External and historical learning

Build:

- Git history ingestion
- test-derived learning
- CI and deployment ingestion
- structured external source ingestion

Exit criteria:

- change-impact and regression reasoning improve from historical evidence
- external knowledge remains provenance-tracked and bounded

### Stage 5. Evaluation and promotion

Build:

- benchmark harness
- confidence calibration
- pattern promotion rules
- Mend Reflex safety gates

Exit criteria:

- no pattern becomes trusted without benchmark support
- confidence remains calibrated against real outcomes

## Package additions

```text
packages/
  contradiction-resolver/
  evaluation-harness/
  git-history-intelligence/
  memory-engine/
  outcome-learner/
  verification-patterns/
```

## Package responsibilities

### `packages/memory-engine`

Owns MendMemory schemas, storage, scoping, and retrieval.

### `packages/outcome-learner`

Tracks repair outcomes, rejections, edits, confirmations, and reverts.

### `packages/git-history-intelligence`

Extracts co-change, ownership, instability, and recurring repair patterns from history.

### `packages/contradiction-resolver`

Detects conflicting learned patterns and specializes them safely.

### `packages/verification-patterns`

Stores and reuses verification requirements linked to fracture and subsystem types.

### `packages/evaluation-harness`

Benchmarks whether learning improves diagnosis, repair, and confidence quality.

## Success criteria

Phase 4 is successful when STACKMEND can answer:

- have I seen this problem before
- which repair worked previously
- which repair failed previously
- what this repository prefers
- what usually breaks after this kind of change
- how confident the reused pattern should be
