# Installation

## Current delivery state

StackMend now uses a local daemon architecture:

- `stackmend-daemon` runs as the persistent local service
- the VS Code extension acts as a daemon client
- the CLI acts as a daemon client

## Development installation

Requirements:

- Node.js 20 or newer
- npm 11 or newer

Steps:

```bash
npm install
npm run build
```

Start the daemon:

```bash
stackmend daemon start
```

Run a first analysis:

```bash
stackmend analyze .
```

## Planned product installation paths

- VS Code Marketplace extension with daemon bootstrap
- direct-download platform artifacts
- npm CLI bootstrapper
- GitHub Releases

Platform packaging and signed release delivery are not complete yet in this repository.
