# STACKMEND MVP Roadmap

## MVP objective

Deliver a believable first experience inside VS Code:

1. Run `StackMend: Scan Project`
2. Detect real environment fractures
3. Show diagnostics and a markdown report
4. Offer structured repair suggestions

## Why environment analysis first

Environment drift is one of the highest-frequency integration failures and can be analyzed across:

- `.env`
- `.env.example`
- source code
- docs
- deployment files

It is also a strong base for the `Project Truth` model because it produces evidence across multiple project surfaces.

## Early fracture classes

### `SM-ENV-*`

- Variables referenced in code but missing from `.env.example`
- Variables declared under multiple names across files
- Variables documented differently from implementation
- Deployment variable names that do not match local setup

## Suggested near-term milestones

1. Add adapter-aware file discovery for Next.js, Vite, Express, Supabase, and Vercel
2. Add repair generation for variable normalization
3. Emit JSON reports for CI usage
4. Surface CodeLens and diagnostics in the extension
