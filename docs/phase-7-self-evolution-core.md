# Phase 7 - Self-Evolution Core

## Mission

Phase 7 introduces the mechanisms that let StackMend improve its own analyzers, repair strategies, training curriculum, source verification rules, and internal performance without allowing uncontrolled self-rewriting.

The governing rule is:

> StackMend may evolve only through verified competition against its current implementation.

## Core pipeline

```text
Stable Core
-> Evolution Laboratory
-> Candidate Variants
-> Benchmark Tournament
-> Safety and Regression Review
-> Promotion or Rejection
```

The Stable Core remains the trusted production system. The Evolution Laboratory is where experimental mutations are created, tested, and compared. No candidate is promoted because it sounds promising. It has to outperform the current system under controlled conditions.

## Required deliverables

- Mend Genome specification
- Stable Core and Evolution Laboratory separation
- Forge mutation engine
- MendSpec declarative rule layer
- candidate registry and build flow
- MendTrials benchmark tournament
- Mend Constitution and constitutional tests
- capability gap registry
- canary deployment and rollback flow
- evolution memory and audit trail

## Safety constraints

Phase 7 must preserve:

- deterministic execution
- auditable changes
- reversible promotions
- sandbox isolation
- non-LLM-based operation
- evidence-backed promotion
- regression resistance
- explicit approval boundaries
