# Mend Constitution

## Purpose

The `Mend Constitution` is the permanent rule set StackMend candidates may never violate.

It exists to make self-evolution bounded, inspectable, and non-destructive.

## Example rules

```yaml
constitution:
  - never execute untrusted code outside the sandbox
  - never upload private source code without explicit permission
  - never promote knowledge without provenance
  - never modify user code without the configured approval level
  - never classify a repair as successful without verification
  - never hide failed evaluations
  - never overwrite the Stable Core directly
  - never disable rollback
  - never remove audit records
  - never reduce security boundaries for performance
```

## Enforcement model

Every candidate must pass constitutional evaluation before it can enter canary promotion.

A critical constitutional failure should permanently reject the candidate lineage or require explicit manual intervention to fork it under stricter constraints.
