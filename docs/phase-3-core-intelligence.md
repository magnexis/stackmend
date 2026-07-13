# STACKMEND Phase 3 Core Intelligence

## Goal

Transform STACKMEND from a smart repair platform into the operating system for software maintenance.

Phase 3 replaces scan-first thinking with persistent intelligence:

```text
Repository
-> Permanent Knowledge Model
-> Continuous Observation
-> Repair
-> Verification
-> Knowledge Improves
```

The key shift is that STACKMEND should stop relearning the repository from scratch every time.

## Core engine: Repository Knowledge Engine

The Repository Knowledge Engine, or `RKE`, becomes the heart of the platform.

Its job is to maintain a durable model of:

- files
- exported symbols
- APIs
- routes
- schemas
- environment variables
- build scripts
- dependencies
- CLI commands
- tests
- deployment targets
- documentation references
- configuration files
- features
- contracts
- repair history
- ownership and operational memory

Everything becomes a queryable object with evidence, history, and relationships.

## Phase 3 pillars

### 1. Persistent Repository Knowledge

The repository model should survive across sessions and improve incrementally rather than being recomputed from zero.

Required properties:

- persistent storage
- snapshotting
- incremental updates
- historical evidence retention
- queryable graph and index layers

### 2. Continuous Observation

STACKMEND should observe:

- file edits
- test outcomes
- CI results
- dependency changes
- deployment updates
- documentation drift
- repair outcomes

These events should refine repository understanding, confidence, and repair recommendations.

### 2.1 Continuous Learning

STACKMEND should improve as it reads more code and sees more repair outcomes.

That learning should come from:

- repository structure patterns
- repeated fracture classes
- accepted and rejected repairs
- verification outcomes
- feature integrity results
- contract breaks
- external structured sources such as API specs, docs, CI logs, and dependency metadata

This learning must be persisted so the system gets better over time instead of resetting every run.

### 3. Change Impact Prediction

Before or during a change, STACKMEND should estimate:

- affected features
- affected routes and APIs
- downstream files and packages
- regression risk
- recommended verification scope

This must be driven by the repository knowledge engine, not only Git history.

### 4. Smart Refactor Engine

Phase 3 refactors should operate at repository scope, not single-symbol scope.

Examples:

- rename symbol and aligned docs
- rename route and callers
- rename configuration and env variables
- rename CLI command and examples
- rename feature concepts across code, docs, and deployment

### 5. Broken Feature Discovery

STACKMEND should discover product-level features and assess their end-to-end integrity.

Each feature should be modeled with:

- frontend presence
- backend presence
- persistence
- tests
- docs
- deployment state
- known fractures

### 6. Repository Memory

Knowledge must outlive contributors.

Repository memory should record:

- why a subsystem exists
- when it was introduced
- major repairs
- known failure modes
- recommended ownership
- recent regressions

### 7. Duplicate Logic Discovery

Phase 3 should detect duplicated intent, not just duplicated files.

Examples:

- validation rules repeated in multiple runtimes
- redundant fetch wrappers
- repeated auth logic
- duplicate domain transformations

### 8. Repository Contracts

Every subsystem should be able to declare expectations and dependencies.

Examples:

- auth requires sessions and tests
- billing requires persistence and monitoring
- deployment requires documented env vars and smoke checks

Changes should be evaluated against those contracts automatically.

### 9. Automatic Regression Investigation

When failures appear, STACKMEND should investigate likely causes across:

- code changes
- migrations
- env vars
- dependency upgrades
- contract breaks
- deployment drift

### 10. Project Consistency Engine

Phase 3 should identify competing patterns and standardization opportunities such as:

- multiple logging stacks
- multiple HTTP clients
- overlapping auth strategies
- duplicated date handling
- fragmented validation libraries

### 11. Repository Evolution Reports

Reports should describe how the repository is evolving, not just what changed.

Example themes:

- feature growth
- dead route removal
- test expansion
- placeholder reduction
- repair quality trends
- architecture stability

### 12. Universal Adapters

STACKMEND should remain repository-agnostic enough to understand:

- source code
- infrastructure
- CI/CD
- API specifications
- docs
- deployment config
- operational config

This broadens the product from AI-code repair into software integrity across the lifecycle.

### 12.1 Autonomous Knowledge Ingestion

STACKMEND should support optional autonomous ingestion from bounded sources so it can expand knowledge beyond the code currently open in the editor.

Candidate ingestion sources:

- OpenAPI and GraphQL schemas
- CI logs and test reports
- deployment manifests
- package metadata
- changelogs
- documentation sites
- issue tracker exports
- architecture decision records

Important boundary:

This should be structured ingestion and evidence collection, not uncontrolled scraping of arbitrary internet content.

### 13. Safe Repair Mode

Every automated repair should follow a controlled flow:

```text
Preview
-> Dependency analysis
-> Conflict detection
-> Simulation
-> Verification
-> Tests
-> Apply
-> Rollback point
```

### 14. Performance Engine

Phase 3 must prepare for:

- very large repositories
- monorepos
- polyglot codebases
- persistent caches
- parallel parsing
- background workers
- low-memory operation
- offline mode

## `.stackmend/` repository layer

Phase 3 should give STACKMEND a clear on-disk operating layer inside each repository:

```text
.stackmend/
├── config.yaml
├── repository.db
├── feature-registry.yaml
├── contracts/
├── repair-packs/
├── reports/
├── history/
├── cache/
├── plugins/
├── policies/
└── snapshots/
```

This directory should hold persistent state, repair history, cached intelligence, and policy data without polluting product source folders.

Phase 3 should also persist learned artifacts such as:

- ingestion source manifests
- learning corpora
- repair outcome statistics
- pattern libraries
- confidence calibration snapshots

## Strategic product position

The strongest long-term identity is not "AI repair assistant."

The stronger identity is:

- software maintenance operating system
- repository intelligence layer
- software integrity platform

That position is harder to copy because it depends on durable knowledge, evidence, contracts, memory, and operational trust.
