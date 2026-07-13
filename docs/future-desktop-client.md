# Future Desktop Client

StackMend should not build a standalone desktop application before the daemon, protocol, and client separation are mature.

## Intended future model

A future Tauri or native desktop client should:

- connect through the same daemon protocol
- reuse the same daemon-client logic or protocol package
- avoid duplicating fracture, learning, repair, or benchmark engines
- present all-project health, learning history, update state, and storage controls

## Architectural boundary

The daemon remains the product core.

The future desktop application should be another client of the daemon, alongside:

- VS Code
- CLI
- CI automation
- future IDE integrations
