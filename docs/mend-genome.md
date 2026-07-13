# Mend Genome

## Purpose

The `Mend Genome` is the machine-readable description of StackMend's own capabilities, performance envelope, weaknesses, and safety boundaries.

Every stable build and every candidate build should produce a genome snapshot so improvements can be measured rather than assumed.

## Example structure

```yaml
genome_version: 7.0.0

capabilities:
  route_analysis:
    precision: 0.972
    recall: 0.944
    supported_frameworks:
      - express
      - fastify
      - nextjs
      - flask

  schema_reconciliation:
    precision: 0.913
    recall: 0.887

learning:
  active_techniques: 18342
  trusted_reflexes: 486
  quarantined_patterns: 129
  stale_patterns: 74

performance:
  average_scan_time_ms: 4812
  peak_memory_mb: 742

known_weaknesses:
  - dynamic route registration
  - generated GraphQL clients
  - Rust macro-expanded APIs
```

## Promotion use

Promotion compares candidate genomes against stable genomes using multi-objective rules instead of one-dimensional benchmark wins.

## Storage expectations

Genome snapshots should be versioned, diffable, and stored under the repository's evolution memory layer so every promotion and rollback has a measurable baseline.
