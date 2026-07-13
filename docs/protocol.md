# Protocol

## Purpose

StackMend clients communicate with the daemon through a versioned local protocol defined in `@stackmend/protocol`.

## Current characteristics

- protocol version: `1.0`
- transport: authenticated localhost HTTP
- authentication: runtime token header
- scope: local machine only

## Implemented request types

- status query
- analyze project
- list fractures
- submit repair feedback
- submit diagnosis correction
- stop daemon

## Implemented typed message areas

- client hello model
- daemon status model
- analyze request/response
- fractures request/response
- feedback request/response
- structured success/error envelopes

Future revisions can add sockets or named pipes without changing the higher-level request model.
