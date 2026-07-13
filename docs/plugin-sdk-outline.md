# STACKMEND Plugin SDK Outline

## SDK goals

The plugin system should let third parties extend STACKMEND without modifying the core repository intelligence engine.

Plugins should be able to contribute:

- language parsers
- framework adapters
- domain analyzers
- standards rules
- repair generators
- report sections

## Plugin contract categories

### `LanguageAdapter`

Converts parser output into normalized repository entities.

### `DomainAnalyzer`

Consumes repository entities and emits evidence, fractures, or derived relationships.

### `PolicyRule`

Checks repository state against organization or product standards.

### `RepairStrategy`

Generates candidate repair actions for a fracture class.

### `ReportProvider`

Adds structured sections to markdown, JSON, or CI reports.

## Design constraints

- plugins must declare capabilities explicitly
- plugins must emit evidence for conclusions
- plugins must not bypass the shared repository knowledge model
- repair strategies must declare risk and touched systems
