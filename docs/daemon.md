# Daemon

## Purpose

`stackmend-daemon` is the persistent local StackMend service.

It owns:

- repository analysis
- fracture detection
- repair feedback recording
- interaction learning persistence
- local protocol handling

The VS Code extension and CLI communicate with the daemon instead of embedding separate copies of the core workflow.

## Current lifecycle commands

```bash
stackmend daemon start
stackmend daemon stop
stackmend daemon restart
stackmend daemon status
stackmend daemon logs
stackmend daemon doctor
```

## Current transport

The daemon currently uses authenticated localhost HTTP with a runtime token stored in the local StackMend runtime directory.

## Runtime files

Conceptually stored under:

```text
~/.stackmend/runtime/
~/.stackmend/logs/
```
