# Source Trust Records

## Purpose

A `Source Trust Record` is the inspectable persistence format Beacon uses to explain why a source is approved, limited, suspended, or quarantined.

## Example

```yaml
source_id: beacon-src-009184

location:
  canonical_uri: https://example.org/docs/runtime
  discovered_from:
    - package_metadata
    - official_repository

identity:
  publisher: Example Runtime Team
  publisher_verified: true
  canonical_source: true
  identity_confidence: 0.98

authority:
  source_type: official_documentation
  subject_scope:
    - concurrency
    - runtime_api
  authority_score: 0.97

legal:
  license_detected: CC-BY-4.0
  automated_access_status: allowed
  training_use_status: allowed
  redistribution_status: attribution_required

technical:
  examples_found: 48
  examples_compiled: 46
  examples_passed: 45
  deprecated_examples: 2
  unsupported_examples: 1

freshness:
  last_updated: 2026-06-18
  latest_supported_version: "4.2"
  freshness_score: 0.94

corroboration:
  independent_sources: 4
  conflicting_sources: 0

final_trust:
  score: 0.96
  status: approved
```

## Claim-level trust

Beacon should store trust at the claim level, not only at the source level.

One source may be authoritative for one topic and weak for another. Source Trust Records therefore need associated claim records, version ranges, trial outcomes, and Trust Scope boundaries.

## Lifecycle states

- candidate
- approved
- metadata-only
- limited
- suspended
- quarantined
- rejected

## Why this matters

These records give StackMend an auditable answer to:

- what was learned
- from whom
- under what permissions
- under which versions
- with what technical evidence
