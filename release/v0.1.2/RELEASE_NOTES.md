# STACKMEND v0.1.2

## Release Assets

- `stackmend-0.1.2.vsix`: VS Code extension package.
- `stackmend-cli-v0.1.2-windows-x64.zip`: portable CLI + daemon bundle for users who do not use VS Code.
- `stackmend-desktop-v0.1.2-windows-x64.zip`: desktop shell + daemon bundle for users who want a standalone GUI entry point.
- `stackmend-services-v0.1.2-windows-x64.zip`: service workspace bundle for Beacon, evolution, laboratory, language server, and platform API runtimes.

## Notes

- CLI, desktop, and services bundles currently target Windows and require Node.js 20+.
- The desktop bundle is a first shell focused on daemon health and future repository controls.
- The services bundle exposes the newly-realized app workspaces outside the source tree.
- All bundles include the MIT license.

## Checks

- VSIX rebuilt from current extension manifest
- CLI, desktop, and services bundles built from current repository sources
- GitHub release manifest generated
