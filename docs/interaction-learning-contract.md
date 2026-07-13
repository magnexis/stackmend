# Interaction Learning Contract

## Purpose

The `Interaction Learning Contract` defines the minimum data and verification required for StackMend to claim it learned from an interaction.

## Required structure

```yaml
interaction:
  id: IX-942184
  type: repair_modified_by_user

  context:
    repository_family: typescript-nextjs
    subsystem: authentication
    defect_family: missing-session-propagation

  stackmend_prediction:
    repair_strategy: add-authorization-header
    confidence: 0.78

  user_outcome:
    action: modified
    final_strategy: include-cookie-credentials

  verification:
    build: passed
    tests: passed
    runtime_probe: passed

  learned:
    repository_authentication_strategy: cookie-session
    rejected_strategy: bearer-token-injection
    preferred_repair: credentials-include
```

## Rules

- predict before measuring outcome
- compare prediction to observed behavior
- attribute which assumption was wrong or reinforced
- apply the update only at the correct scope
- verify the update before promoting it into active intelligence

## Zero-learning handling

If no new useful knowledge was produced, StackMend must explicitly record why instead of pretending the interaction was a major learning event.
