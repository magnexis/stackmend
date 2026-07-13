# MendMemory Model

## Purpose

`MendMemory` is the persistent engineering knowledge layer for STACKMEND.

It should store reusable engineering knowledge rather than raw repository transcripts.

## Core entities

### Repair Genome

A generalized record of:

- defect signature
- cause conditions
- repair strategy
- verification requirements
- failure boundaries
- confidence

### Outcome Loop

Tracks whether a repair truly worked across:

- apply
- build
- test
- deploy
- observe
- confirm
- revert

### Repository Dialect

Represents the architectural and stylistic language of one repository, including:

- module boundaries
- service placement
- route conventions
- testing norms
- naming and structure preferences

### Pattern Promotion

Patterns should move through:

```text
Observed
-> Candidate
-> Tested
-> Confirmed
-> Trusted
-> Deprecated
```

### Mend Reflex

A highly trusted repair pattern that may be auto-suggested or auto-applied only within proven safety boundaries.

## Memory scopes

- repository
- workspace
- developer
- organization
- global sanitized

## Required metadata

Every memory record should carry:

- scope
- confidence
- provenance
- observed count
- successful reuse count
- failed reuse count
- applicability conditions
- non-applicability conditions
- decay markers

## Storage design

Repository-local memory should live in `.stackmend/memory/`.

Global sanitized memory should live in `~/.stackmend/`.

Repository memory examples:

- conventions
- accepted patterns
- rejected patterns
- repair outcomes
- false positives
- architecture rules
- confidence indices

Global memory examples:

- sanitized framework patterns
- repair success statistics
- evaluation results
- model adapters
