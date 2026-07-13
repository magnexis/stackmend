# CLI

## Purpose

The StackMend CLI is a first-class daemon client for automation, scripting, diagnostics, and non-IDE workflows.

## Current commands

```bash
stackmend status
stackmend analyze .
stackmend fractures . --severity high
stackmend doctor
stackmend daemon start
stackmend daemon stop
stackmend daemon restart
stackmend daemon status
stackmend daemon logs
stackmend daemon doctor
```

## Notes

The current CLI surface is functional but still narrower than the full product command set described in the roadmap. Future commands should continue to use the shared daemon protocol instead of re-embedding core logic.
