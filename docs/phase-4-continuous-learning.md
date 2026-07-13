# STACKMEND Phase 4 Continuous Learning

## Core objective

Transform STACKMEND into a system that becomes better at diagnosing, repairing, and validating software every time it reads code or completes a repair.

Phase 4 should make this explicit:

- STACKMEND is a software-learning bot
- continuous learning is the product center
- repairs should be driven by evidence, fingerprints, patterns, and verification
- the system should not rely on a single language model improvising fixes from scratch

The platform should learn from:

- every repository it analyzes
- every bug it diagnoses
- every repair it proposes
- every accepted or rejected repair
- every failed repair
- every test result
- every code review correction
- every deployment failure
- recurring architectural mistakes
- repeated successful implementation patterns

The critical product rule is:

> STACKMEND never merely remembers code. It learns which engineering decisions worked, why they worked, when they apply, and how confidently they can be reused.

## Central concept: Engineering Memory

Phase 4 introduces a persistent, structured software knowledge layer rather than a transcript of source files.

Examples of learned engineering memory:

- Next.js repositories in this organization prefer server actions for mutations.
- Auth cookies require `credentials: "include"` in the shared API client.
- Environment validation lives in `src/config/env.ts`.
- Direct database access is forbidden outside the repository layer.
- Prisma migration repairs require `generate` before test.

This becomes STACKMEND's proprietary engineering memory model.

## Memory scopes

### Repository Memory

Knowledge specific to one repository:

- preferred HTTP client
- auth strategy
- database access rules
- test framework choices
- deployment targets
- local architecture conventions

### Workspace Memory

Knowledge shared across related repositories:

- org-wide package manager
- shared validation approach
- required route testing
- environment validation rules
- UI integrity rules

### Personal Developer Memory

Knowledge about one developer's preferences:

- preferred file structure
- anti-patterns they reject
- documentation expectations
- UI completion standards

### Global Pattern Memory

Anonymized, generalized patterns learned across many repositories:

- common fracture classes
- common repair strategies
- common regressions
- common false positives

Global memory must never retain proprietary source code.

## Learning pipeline

Every learning event should move through:

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

### Observe

Capture events such as:

- code read
- fracture detected
- repair proposed
- repair accepted
- repair rejected
- tests passed or failed
- deployment succeeded or failed
- review requested changes
- repair reverted

### Extract

Convert events into structured knowledge records.

### Generalize

Remove repository-specific identifiers and retain reusable engineering patterns.

### Validate

Patterns become trusted only after repeated evidence and verified outcomes.

### Store

Persist the pattern in the correct memory scope.

### Reuse

Apply the pattern when a similar fracture or change appears.

### Measure outcome

Track whether reused knowledge actually improved diagnosis or repair.

### Update confidence

Successful reuse strengthens a pattern; failed reuse weakens or specializes it.

## Deterministic repair principle

The preferred runtime behavior is:

```text
Evidence
-> pattern match
-> deterministic transformation
-> verification
-> measured outcome
-> learning update
```

This is intentionally different from:

```text
Prompt
-> model guess
-> code appears
```

Phase 4 should prefer:

- AST-based transforms
- repair templates
- structural comparisons
- fingerprint matching
- statistical scoring
- verification-backed reinforcement

## Repair outcome learning

Every repair should move through an outcome lifecycle:

```text
Proposed
-> Accepted
-> Modified
-> Applied
-> Built
-> Tested
-> Deployed
-> Observed
-> Confirmed
-> Reverted
```

The system must not treat a repair as successful only because a file changed.

## Developer correction learning

When a developer edits a proposed repair, STACKMEND should compare:

- proposed implementation
- final implementation

Then extract:

- repository conventions
- architecture preferences
- preferred module boundaries
- acceptable naming and placement rules

## Rejection learning

Rejected repairs should be stored as structured feedback such as:

- incorrect diagnosis
- wrong architecture
- unsafe change
- incomplete repair
- false positive
- intentional behavior

Repeated rejection should reduce pattern confidence automatically.

## Pattern types

Phase 4 should learn:

- diagnostic patterns
- repair patterns
- architecture patterns
- style patterns
- failure patterns
- verification patterns

## Main learning modules

The learning engine should be decomposed into:

- repository learner
- defect learner
- repair learner
- regression learner
- convention learner

## Code pattern fingerprinting

STACKMEND should create semantic fingerprints of implementations without depending on exact identifiers.

Example:

- HTTP POST handler
- user lookup
- credential comparison
- session cookie issuance

This enables cross-language and cross-framework learning.

## Confidence, decay, and contradiction

Every learned fact needs:

- confidence
- scope
- provenance
- applicability conditions
- contradiction handling
- decay behavior

Old patterns should decay when:

- frameworks change
- dependencies are replaced
- developer overrides repeat
- tests contradict the pattern
- the subsystem disappears

When patterns conflict, the system should specialize rules rather than blindly deleting one.

## Test, Git, and CI learning

Tests should teach:

- invariants
- edge cases
- error handling
- required behavior

Git history should teach:

- files that change together
- unstable areas
- reverted repair classes
- repeated regression zones

CI and deployment should teach:

- build failure patterns
- migration issues
- runtime startup issues
- platform-specific constraints

## Local-first privacy

The default architecture must remain local-first:

- source code stays local
- repository memory stays local
- organization memory stays private
- global learning uses sanitized patterns only
- users can inspect and delete learned knowledge

## Optional federated learning

Federated learning may share:

- abstracted fracture categories
- sanitized repair strategies
- framework versions
- success and failure statistics
- semantic fingerprints

It must never share:

- source code
- repo names
- company names
- secrets
- customer data
- full logs

## Evaluation harness

Phase 4 must continuously measure whether learning improves outcomes using:

- detection precision
- recall
- repair success rate
- false-positive rate
- regression rate
- developer acceptance rate
- confidence calibration

No pattern should be promoted without measurable benefit.
