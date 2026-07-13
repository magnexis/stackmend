<p align="center">
  <img src="assets/stackmend-logo.svg" alt="STACKMEND logo" width="600">
</p>

<p align="center">
  <a href="#overview"><img src="https://img.shields.io/badge/status-active%20prototype-57E3B5?style=plastic&labelColor=0B1723&color=57E3B5" alt="Status: active prototype"></a>
  <a href="#local-first"><img src="https://img.shields.io/badge/privacy-local--first-A9F5DE?style=plastic&labelColor=0B1723&color=A9F5DE" alt="Privacy: local first"></a>
  <a href="#workspace-layout"><img src="https://img.shields.io/badge/monorepo-typescript-78DCC0?style=plastic&labelColor=0B1723&color=78DCC0" alt="Monorepo TypeScript"></a>
</p>

<p align="center">
  <strong>Make the pieces work together.</strong>
</p>

## Overview

STACKMEND is a software intelligence platform for understanding, repairing, validating, and learning from real software systems.

It is not intended to be another code generator, lint wrapper, or flashy dashboard. The product focus is repository integrity: the places where frontend, backend, schema, configuration, tests, deployment, and documentation stop agreeing with each other.

At its core, STACKMEND is a software-learning bot:

- it observes code structure
- it detects recurring defects
- it tracks accepted and rejected repairs
- it measures build, test, and deployment outcomes
- it strengthens or weakens repair patterns over time
- it reuses verified engineering decisions later

The long-term ambition is stronger than "AI repair tool."

STACKMEND is being shaped as:

- a repository intelligence layer
- a software maintenance operating system
- a continuous learning engine for engineering decisions
- a local-first software integrity platform

## Problem

Most developer tooling sees one slice of the project:

- lint rules
- types
- tests
- vulnerabilities
- dependencies
- generated code

Real failures usually happen between those slices:

- frontend calls the wrong backend route
- auth works in one layer and breaks in another
- schema names drift across DB, API, and UI
- environment variables are inconsistent across runtime, docs, and deployment
- features look complete but are placeholders
- documentation promises workflows the product does not actually support

STACKMEND exists to find, explain, and eventually repair those integration fractures.

## Product Thesis

The defining behavior of STACKMEND is not scanning files.

It is building durable engineering intelligence that improves over time through a closed feedback loop:

```text
Read code
-> extract structural features
-> detect recurring patterns
-> observe problem
-> record repair
-> run verification
-> measure outcome
-> strengthen or weaken pattern
-> reuse pattern later
```

That means the system should answer questions like:

- What is genuinely implemented?
- What is pretending to work?
- What broke across boundaries?
- What repair is safest here?
- Have we seen this problem before?
- Which repair worked last time?

## Core Concepts

- `Fracture`: a mismatch between systems that should work together
- `Circuit Test`: a coordinated repository verification run
- `Repair Pack`: a grouped, reviewable repair plan
- `Project Truth`: evidence-backed output describing what the repository actually supports
- `Repository Knowledge Engine`: persistent system for repository understanding
- `MendMemory`: persistent engineering knowledge layer
- `Repair Genome`: generalized record of a defect, cause, repair, and verified outcome
- `Outcome Loop`: lifecycle that determines whether a repair really worked
- `Repository Dialect`: the architectural and stylistic language of one repository
- `Mend Reflex`: highly trusted repair behavior with strict safety boundaries
- `Mend Academy`: the internal autonomous training institution
- `Source Scholar`: the approved-source study and ingestion subsystem
- `Evolution Arena`: the sandboxed examination runtime
- `Code Reflex`: a highly trusted coding or repair behavior promoted from repeated verified success
- `Beacon`: the autonomous source discovery and proof system
- `ProofChain`: the inspectable evidence chain behind a learned technique
- `Trust Scope`: the subject area in which a source is considered authoritative
- `Knowledge Quarantine`: isolation for uncertain, unsafe, stale, or legally ambiguous material
- `Mend Genome`: the machine-readable description of StackMend's own capabilities
- `Forge`: the controlled mutation and candidate-generation system
- `MendTrials`: the benchmark tournament for candidate-vs-stable competition
- `Mend Constitution`: the permanent rules candidate lineages may never violate
- `Evolution Memory`: the retained history of failed or rejected self-improvement attempts
- `Intelligence Delta`: the verified knowledge change produced by one interaction
- `Interaction Gradient`: the measured amount of useful intelligence change from an interaction
- `One-Mistake Rule`: a confirmed mistake should not recur under materially equivalent conditions
- `Search Exclusion`: a failed strategy that should be deprioritized in equivalent future cases
- `Competence Ledger`: the record proving whether StackMend is actually improving

## What Exists Today

Current implemented foundations include:

- environment fracture analysis
- route and route-contract analysis
- request and response expectation mismatch detection
- repository knowledge model entities and edges
- baseline learning-policy ranking
- initial repair-plan generation
- VS Code extension scaffolding
- CLI scan output
- repository-local `.stackmend/` operating layer

The current codebase is intentionally early-stage, but it already reflects the product direction instead of just describing it.

## Defining Feature

The defining feature is continuous learning, not repeated scanning.

STACKMEND should learn from:

- repositories it analyzes
- repairs it proposes
- repairs the developer accepts, edits, or rejects
- test and build outcomes
- deployment failures
- code review corrections
- recurring architectural mistakes
- successful implementation patterns

The system should never merely remember code. It should remember which engineering decisions worked, why they worked, when they apply, and how confidently they can be reused.

It should not depend on an LLM to improvise every repair from scratch. The preferred architecture is:

- evidence
- pattern match
- deterministic transformation
- verification
- measured outcome
- learning update

## Learning Architecture

The learning model is intentionally layered and scoped.

Core learning mechanisms:

- structural feature extraction
- semantic fingerprinting
- pattern matching
- deterministic repair templates
- statistical confidence scoring
- reinforcement from verified outcomes
- confidence decay after failures or drift

Memory scopes:

- repository memory
- workspace memory
- developer memory
- organization memory
- global sanitized pattern memory

Learning pipeline:

```text
Observe
-> Extract
-> Generalize
-> Validate
-> Store
-> Reuse
-> Measure outcome
-> Update confidence
```

Safety rules:

- learned data does not override repository evidence
- raw proprietary source is not promoted into global memory
- local-first storage is the default
- pattern promotion requires repeated evidence
- stale knowledge must decay
- contradictions must be specialized, not ignored
- repair generation should prefer deterministic templates and transformations over opaque free-form generation

## Phase Roadmap

### Phase 1

Believable MVP:

- shared fracture model
- environment analyzer
- CLI
- VS Code command surface

### Phase 2

Repository intelligence platform:

- unified repository model
- semantic index
- dependency intelligence
- repair planning
- standards and policy engine
- route contract analysis

Key docs:

- [Phase 2 Platform](C:/Users/matth/OneDrive/Desktop/company/STACKMEND/docs/phase-2-platform.md:1)
- [Phase 2 Delivery Plan](C:/Users/matth/OneDrive/Desktop/company/STACKMEND/docs/phase-2-delivery-plan.md:1)

### Phase 3

Persistent maintenance operating system:

- Repository Knowledge Engine
- change impact prediction
- broken feature discovery
- repository memory
- safe repair flow
- large-repository performance direction

Key docs:

- [Phase 3 Core Intelligence](C:/Users/matth/OneDrive/Desktop/company/STACKMEND/docs/phase-3-core-intelligence.md:1)
- [Phase 3 Delivery Plan](C:/Users/matth/OneDrive/Desktop/company/STACKMEND/docs/phase-3-delivery-plan.md:1)
- [Repository Knowledge Engine](C:/Users/matth/OneDrive/Desktop/company/STACKMEND/docs/repository-knowledge-engine.md:1)

### Phase 4 Direction

Continuous learning becomes the product center:

- MendMemory
- Repair Genome
- Outcome Loop
- repository dialect learning
- Git, test, CI, and deployment learning
- contradiction resolution
- pattern confidence and decay
- evaluation harness

Key docs:

- [Phase 4 Continuous Learning](C:/Users/matth/OneDrive/Desktop/company/STACKMEND/docs/phase-4-continuous-learning.md:1)
- [MendMemory Model](C:/Users/matth/OneDrive/Desktop/company/STACKMEND/docs/mendmemory-model.md:1)
- [Phase 4 Delivery Plan](C:/Users/matth/OneDrive/Desktop/company/STACKMEND/docs/phase-4-delivery-plan.md:1)
- [Autonomous Learning](C:/Users/matth/OneDrive/Desktop/company/STACKMEND/docs/autonomous-learning.md:1)
- [VS Code Learning Commands](C:/Users/matth/OneDrive/Desktop/company/STACKMEND/docs/vscode-learning-commands.md:1)

### Phase 5 Direction

Autonomous evolution becomes the capability engine:

- Mend Academy continuous training
- Source Scholar approved-source study
- Evolution Arena sandboxed examinations
- deterministic synthesis and repair search
- technique extraction and retesting
- weakness-driven curriculum
- transfer, mutation, and adversarial evaluation
- Code Reflex promotion from repeated verified success

Key docs:

- [Phase 5 Evolution Engine](C:/Users/matth/OneDrive/Desktop/company/STACKMEND/docs/phase-5-evolution-engine.md:1)
- [Mend Academy](C:/Users/matth/OneDrive/Desktop/company/STACKMEND/docs/mend-academy.md:1)
- [Source Scholar](C:/Users/matth/OneDrive/Desktop/company/STACKMEND/docs/source-scholar.md:1)

### Phase 6 Direction

Autonomous source discovery becomes evidence-gated:

- Beacon source discovery missions
- source identity and authority verification
- claim-level corroboration and executable trials
- licensing and automation-permission enforcement
- source drift detection and quarantine
- ProofChain lineage for every promoted technique

Key docs:

- [Phase 6 Autonomous Source Discovery](C:/Users/matth/OneDrive/Desktop/company/STACKMEND/docs/phase-6-autonomous-source-discovery.md:1)
- [StackMend Beacon](C:/Users/matth/OneDrive/Desktop/company/STACKMEND/docs/stackmend-beacon.md:1)
- [Source Trust Records](C:/Users/matth/OneDrive/Desktop/company/STACKMEND/docs/source-trust-records.md:1)

### Phase 7 Direction

Controlled self-evolution becomes the internal R&D system:

- Stable Core and Evolution Laboratory separation
- Mend Genome capability snapshots
- Forge mutation proposals and candidate building
- MendTrials benchmark tournaments
- Mend Constitution enforcement
- capability gap registry and evolution memory
- canary promotion and automatic rollback

Key docs:

- [Phase 7 Self-Evolution Core](C:/Users/matth/OneDrive/Desktop/company/STACKMEND/docs/phase-7-self-evolution-core.md:1)
- [Mend Genome](C:/Users/matth/OneDrive/Desktop/company/STACKMEND/docs/mend-genome.md:1)
- [Mend Constitution](C:/Users/matth/OneDrive/Desktop/company/STACKMEND/docs/mend-constitution.md:1)
- [MendTrials](C:/Users/matth/OneDrive/Desktop/company/STACKMEND/docs/mendtrials.md:1)

### Phase 8 Direction

Interaction-driven intelligence becomes mandatory:

- every meaningful interaction produces an intelligence update or a zero-learning explanation
- prediction, outcome, attribution, update, and verification are all recorded
- user corrections become high-weight learning signals
- interaction replay proves that learning generalizes
- competence tracking measures whether future equivalent tasks improve

Key docs:

- [Phase 8 Interaction-Driven Intelligence](C:/Users/matth/OneDrive/Desktop/company/STACKMEND/docs/phase-8-interaction-driven-intelligence.md:1)
- [Interaction Learning Contract](C:/Users/matth/OneDrive/Desktop/company/STACKMEND/docs/interaction-learning-contract.md:1)
- [Intelligence Delta](C:/Users/matth/OneDrive/Desktop/company/STACKMEND/docs/intelligence-delta.md:1)
- [Competence Ledger](C:/Users/matth/OneDrive/Desktop/company/STACKMEND/docs/competence-ledger.md:1)

## Workspace Layout

```text
apps/
  beacon-daemon/
  cli/
  evolution-daemon/
  laboratory-daemon/
  language-server/
  platform-api/
  vscode-extension/
assets/
  stackmend-logo.svg
packages/
  attribution-engine/
  analyzer-generator/
  beacon-mission-planner/
  calibration-monitor/
  candidate-registry/
  canonical-source-detector/
  canary-manager/
  claim-trial/
  competence-ledger/
  compliance-engine/
  correction-handler/
  constitution-kit/
  contradiction-checker/
  contamination-defense/
  diversity-manager/
  architecture-memory/
  change-impact-engine/
  delta-reporter/
  degradation-monitor/
  equivalence-checker/
  event-capture/
  evidence-comparator/
  genome-comparator/
  genome-engine/
  hidden-evaluations/
  internal-scanner/
  interaction-classifier/
  interaction-sanitizer/
  long-horizon-tests/
  mistake-tracker/
  mendspec/
  mutation-planner/
  optimization-engine/
  outcome-observer/
  performance-tests/
  promotion-engine/
  prediction-recorder/
  privacy-filter/
  quarantine-manager/
  regression-builder/
  replay-runner/
  rollback-engine/
  contradiction-resolver/
  curriculum-director/
  dependency-intelligence/
  environment-analyzer/
  evaluation-harness/
  evidence-engine/
  evolution-arena/
  feature-discovery/
  fixture-generator/
  fracture-engine/
  git-history-intelligence/
  learning-engine/
  memory-engine/
  outcome-learner/
  parser-framework/
  plugin-sdk/
  policy-engine/
  scope-guard/
  scope-resolver/
  search-exclusions/
  session-continuity/
  repair-planner/
  repository-memory/
  repository-intelligence/
  regression-investigator/
  route-analyzer/
  safe-repair/
  semantic-index/
  shared/
  smart-refactor/
  source-scholar/
  source-drift-detector/
  standards-normalizer/
  synthesis-engine/
  technique-extractor/
  technique-breeding/
  trust-scope-engine/
  update-planner/
  update-quarantine/
  update-verifier/
  user-preferences/
  verification-patterns/
  zero-learning-detector/
docs/
.stackmend/
```

## `.stackmend/` Layer

The repository-local `.stackmend/` directory is the maintenance layer for STACKMEND.

It is where repository-specific intelligence, policies, learning state, and memory scaffolding live.

Current structure includes:

- runtime configuration
- feature registry
- memory storage scaffolding
- learning storage scaffolding
- contracts
- policies
- snapshots
- reports
- repair-pack placeholders

This keeps the product identity explicit without polluting source folders.

## Current Commands

Planned and scaffolded command surfaces include:

- `StackMend: Scan Project`
- `StackMend: Generate Project Truth`
- `StackMend: Explain What You Learned`
- `StackMend: Show Repository Dialect`
- `StackMend: Review Learned Patterns`
- `StackMend: Approve Pattern`
- `StackMend: Reject Pattern`
- `StackMend: Forget Pattern`
- `StackMend: Run Learning Evaluation`
- `StackMend: Discover Learning Sources`
- `StackMend: Inspect Source ProofChain`
- `StackMend: Show Quarantined Sources`
- `StackMend: Run Claim Trial`
- `StackMend: Revalidate All Sources`
- `StackMend: Show Current Mend Genome`
- `StackMend: Show Capability Gaps`
- `StackMend: Start Evolution Laboratory`
- `StackMend: Run MendTrials`
- `StackMend: Compare Candidate to Stable Core`
- `StackMend: Approve Candidate`
- `StackMend: Reject Candidate`
- `StackMend: Roll Back Evolution`
- `StackMend: Show Evolution Memory`
- `StackMend: Set Evolution Approval Level`
- `StackMend: Show What You Learned`
- `StackMend: Show Last Intelligence Delta`
- `StackMend: Explain Changed Behavior`
- `StackMend: Show Interaction Gradient`
- `StackMend: Review Interaction Memory`
- `StackMend: Correct This Diagnosis`
- `StackMend: Mark Repair Successful`
- `StackMend: Mark Repair Incorrect`
- `StackMend: Replay Learned Interaction`
- `StackMend: Show Repeated Mistakes`
- `StackMend: Show Competence Improvement`
- `StackMend: Forget This Interaction`
- `StackMend: Restrict Learning Scope`
- `StackMend: Quarantine Learning Update`

## Local-First

Local-first behavior is a product requirement, not a preference.

By default:

- source code remains local
- repository memory remains local
- organizational conventions remain private
- secrets should be redacted before indexing
- learning must be inspectable and deletable
- any broader pattern sharing must be sanitized and opt-in

## Getting Started

Requirements:

- Node.js `>=20`
- npm `>=11`

Install and build:

```bash
npm install
npm run build
```

Current primary entry points:

- CLI scan flow in [apps/cli/src/index.ts](C:/Users/matth/OneDrive/Desktop/company/STACKMEND/apps/cli/src/index.ts:1)
- VS Code extension entry in [apps/vscode-extension/src/extension.ts](C:/Users/matth/OneDrive/Desktop/company/STACKMEND/apps/vscode-extension/src/extension.ts:1)
- fracture orchestration in [packages/fracture-engine/src/index.ts](C:/Users/matth/OneDrive/Desktop/company/STACKMEND/packages/fracture-engine/src/index.ts:1)

## Why It's Different

Many tools can generate code.

Very few tools are structured around:

- cross-system fracture detection
- evidence-backed repair planning
- repository-specific engineering memory
- verification-aware outcome learning
- local-first knowledge accumulation
- deterministic repair behavior grounded in structural analysis
- evolving into an operating layer for software maintenance

That combination is the real product moat.

## VS Code Extension

[Visit Marketplace](https://marketplace.visualstudio.com/items?itemName=magnificent-language.stackmend-vscode-extension)

## Near-Term Priorities

- persist repository intelligence into `.stackmend/`
- implement real `memory-engine` and `outcome-learner` code
- write learned patterns and repair outcomes during scans and verifications
- strengthen route contracts with validator and schema adapters
- expand feature discovery and repository dialect detection
- add evaluation harness fixtures and benchmark workflows
- implement autonomous training, sandboxed examinations, and technique promotion
- implement Beacon source discovery, claim trials, trust scoring, and quarantine workflows
- tighten route extraction so Beacon and learning metadata do not become false route fractures
- implement Mend Genome, Forge, MendTrials, and constitutional promotion controls
- implement interaction learning records, intelligence deltas, replay tests, and competence tracking

## License

License status is not yet defined in this repository.
