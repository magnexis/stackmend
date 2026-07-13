# STACKMEND Phase 2 Delivery Plan

## Product position

STACKMEND is moving from:

- scanner

to:

- software intelligence and coordinated repair platform

## Delivery stages

### Stage 1. Repository Intelligence Core

Ship the minimum platform substrate:

- parser framework contracts
- unified repository knowledge model
- evidence engine
- semantic index interfaces
- adapter registration system

Exit criteria:

- one repository scan produces a normalized graph
- graph is queryable by concept
- all fractures link to evidence nodes

### Stage 2. High-Value Domain Intelligence

Add the first system-level domains:

- route contracts
- environment configuration
- authentication chains
- placeholder detection
- documentation verification

Exit criteria:

- one fracture may combine evidence from multiple domains
- one repair plan may coordinate edits across multiple domains

### Stage 3. Repair Planning

Introduce `Repair Pack` planning:

- repair actions
- impact estimation
- rollback metadata
- confidence scoring
- patch grouping
- learning-guided repair ranking

Exit criteria:

- repairs are previewable
- evidence and impacted systems are visible
- risk levels are explicit
- recommendation ordering can improve from validated outcomes without weakening safety review

### Stage 4. Standards and Drift

Add organization and architecture intelligence:

- standards profiles
- policy engine
- architecture memory
- drift detection

Exit criteria:

- repository scans can enforce organization rules
- architectural violations produce human-readable remediation guidance

### Stage 5. Continuous and Enterprise

Add long-running platform features:

- language server or watcher mode
- CI integrations
- audit logging
- multi-repository workspaces
- team profiles
- adaptive telemetry-driven assistance

Exit criteria:

- STACKMEND can run continuously
- repairs and policy results can be consumed outside VS Code
- adaptive behavior remains configurable, inspectable, and bounded

### Stage 6. Learning and Optimization

Add bounded learning systems for optimization and adaptation:

- Q-learning for repair and scan decision loops
- evolutionary optimization for strategy benchmarking
- FSM plus dynamic weights for adaptive UX and workflow behavior
- offline simulation harnesses for safe learning validation

Exit criteria:

- learned policies can be benchmarked against fixed baselines
- every learned recommendation path remains evidence-backed
- production learning behavior can be disabled or constrained by policy

## Proposed package map

```text
apps/
  cli/
  language-server/
  platform-api/
  vscode-extension/
packages/
  architecture-memory/
  dependency-intelligence/
  environment-analyzer/
  evidence-engine/
  fracture-engine/
  learning-engine/
  parser-framework/
  plugin-sdk/
  policy-engine/
  repair-planner/
  repository-intelligence/
  semantic-index/
  shared/
```

## Initial package responsibilities

### `packages/repository-intelligence`

Owns the repository knowledge model, scan orchestration, and graph assembly.

### `packages/parser-framework`

Defines language parser contracts, adapter interfaces, and normalization pipelines.

### `packages/semantic-index`

Supports meaning-based search and retrieval over repository entities and evidence.

### `packages/dependency-intelligence`

Computes dependency impact chains across code, config, docs, and deployment.

### `packages/repair-planner`

Converts fractures plus evidence into coordinated repair plans with risk and rollback metadata.

### `packages/policy-engine`

Evaluates standards profiles and emits violations with remediation guidance.

### `packages/architecture-memory`

Stores intended architecture boundaries and detects drift against current implementation.

### `packages/evidence-engine`

Normalizes and ranks evidence from static analysis, tests, docs, runtime output, and config.

### `packages/plugin-sdk`

Provides the public extension model for analyzers, adapters, standards rules, and repair generators.

### `packages/learning-engine`

Owns bounded learning policies, telemetry interpretation, strategy optimization, and simulation-based validation.

## Required technical qualities

- evidence-backed reasoning
- deterministic scan outputs where possible
- incremental indexing
- language-agnostic core abstractions
- reviewable automated changes
- scalable operation on very large repositories

## Testing strategy

Phase 2 needs more than unit tests.

Required test layers:

- parser fixtures by language
- adapter contract tests
- graph assembly regression tests
- semantic query tests
- repair planning integration tests
- policy engine rule tests
- learning policy simulation tests
- adaptive behavior regression tests
- large repository performance benchmarks

## Success criteria

Phase 2 is successful when STACKMEND can answer:

- what is genuinely implemented
- what is only documented
- what is broken across boundaries
- what change would safely repair it
- what else that repair would affect
