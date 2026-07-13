# Privacy

## Local-first behavior

Current StackMend behavior is local-first:

- repository scans stay on the local machine
- interaction learning records stay local
- intelligence deltas stay local
- daemon runtime state stays local
- repair evidence stays local

## Current local storage areas

- repository `.stackmend/` data
- user runtime files under `~/.stackmend/`

## Current external communication

The daemon client communicates only with the local daemon over authenticated localhost HTTP in the current implementation.

Beacon and broader source-discovery networking remain governed by the roadmap and are not opened by the daemon delivery layer itself.
