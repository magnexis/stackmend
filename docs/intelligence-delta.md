# Intelligence Delta

## Purpose

An `Intelligence Delta` is the concise, auditable summary of what one interaction changed in StackMend's intelligence.

## Example

```text
STACKMEND INTELLIGENCE DELTA

Interaction:
User modified authentication repair

Learned:
- repository uses cookie-based sessions
- browser requests require credentials inclusion
- authorization-header repair does not apply here

Updated:
- 2 repository patterns
- 1 negative repair memory
- 1 authentication classifier
- 3 confidence values

New regression test:
auth-cookie-session-credentials-001

Interaction Gradient:
+0.041

Ready for next use:
Yes
```

## Properties

- inspectable
- scoped
- verified
- replayable
- connected to future behavior
