# STACKMEND Software-Learning Bot

## Core concept

STACKMEND should operate as a software-learning bot.

It continuously observes:

- code structure
- repeated bugs
- accepted fixes
- rejected fixes
- files that usually change together
- build failures
- test failures
- deployment failures
- repository conventions
- framework-specific patterns
- developer corrections

It then improves through:

- pattern recognition
- statistical scoring
- rule generation
- similarity matching
- outcome tracking
- reinforcement from successful repairs
- confidence decay after failures

## Important distinction

STACKMEND is not:

```text
Prompt
-> AI guesses
-> code appears
```

STACKMEND should be:

```text
Evidence
-> pattern match
-> deterministic transformation
-> verification
-> measured outcome
-> learning update
```

The product may still use models in specialized places, but the primary identity should be:

- software-learning system
- deterministic repair engine
- evidence-backed maintenance bot

## Closed learning loop

The bot should improve through a closed loop:

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

Every successful fix becomes reusable positive knowledge.

Every failed fix becomes negative memory.

## Structural feature extraction

The system should normalize code into machine-readable features such as:

- file type
- AST node types
- function signatures
- import relationships
- route declarations
- HTTP methods
- schema fields
- environment variables
- event handlers
- test assertions
- build commands
- package versions
- framework conventions

Variable names and incidental syntax should be ignored when they are not structurally important.

## Pattern fingerprints

Every relevant structure should receive a normalized fingerprint.

Example request fingerprint:

- frontend HTTP request
- method `POST`
- route shape `/api/{resource}/{action}`
- payload type `object`
- auth mode `cookie`

Example backend fingerprint:

- backend route handler
- method `POST`
- route shape `/{resource}/{action}`
- auth mode `cookie`

This allows mismatch detection without relying on natural-language interpretation.

## Repair templates

Repairs should be generated from deterministic templates where possible.

Example template behavior:

- detect route prefix mismatch
- confirm no shared API client exists
- create shared client abstraction
- replace direct calls
- add env config
- update tests

Preferred implementation style:

- AST transforms
- structured file edits
- deterministic refactors

Preferred avoidance:

- fragile raw text rewrites
- opaque one-shot generation

## Outcome reinforcement

Patterns should gain or lose confidence from observed results.

Confidence should rise when:

- repair applied
- build passed
- tests passed
- runtime verification passed
- developer kept the change

Confidence should fall when:

- tests failed
- repair was reverted
- developer rejected the fix
- deployment broke

## Learning modules

STACKMEND should evolve distinct learning modules:

### Repository Learner

Learns one repository's habits, such as:

- preferred API client
- validation placement
- repository boundaries
- testing framework choices

### Defect Learner

Learns recurring failure signatures, such as:

- missing env vars
- route mismatch
- schema mismatch
- stale generated client
- circular dependency

### Repair Learner

Learns which repair strategies actually succeed in context.

### Regression Learner

Learns what tends to break after specific kinds of changes.

### Convention Learner

Learns architecture and style rules that are specific to the repository or organization.

## Internal architecture direction

Suggested high-level structure:

```text
engine/
  parser/
  normalizer/
  fingerprinting/
  pattern-matcher/
  rule-engine/
  repair-engine/
  verifier/
  learner/

learning/
  repository-model/
  defect-model/
  repair-model/
  regression-model/
  confidence-model/
  decay-model/

storage/
  patterns.db
  repairs.db
  outcomes.db
  conventions.db
  fingerprints.db
```

## Background daemon

STACKMEND should eventually run as a local daemon that watches:

- file changes
- commits
- tests
- builds
- dependency changes
- accepted repairs
- reverted repairs

This enables incremental learning without full rescans.

## Proprietary concepts

- `Code Reflex`
- `Mend Pattern`
- `Failure Signature`
- `Repository Behavior Model`
- `Repair Confidence`
- `Pattern Decay`
- `Negative Memory`

These ideas become much stronger when attached to verified outcomes rather than raw model output.
