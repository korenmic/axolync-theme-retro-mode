# Axolync Retro Mode Theme Repo

This repo is the source of truth for Axolync's `retro-mode` theme family.

The family currently contains exactly four themes:

- `retro-red-led`
- `retro-cyan-vfd`
- `retro-arcade-crt`
- `retro-cockpit-hud`

Repo scope:

- generated font assets and their editable source artifacts
- retro shell art and decorative assets
- per-theme metadata and stylesheets
- one theme-only bundle containing the four themes together

Out of scope:

- adapters
- addon runtime logic
- controller behavior
- browser runtime/theme-selection code
- builder publication/report logic

Directory layout:

- `src/themes/` - theme metadata and runtime-facing styles/assets
- `src/font-src/` - editable/generated glyph source artifacts
- `scripts/` - font and bundle generation
- `artifacts/output/` - generated bundle outputs and visual proof

The first implementation pass targets visuals that feel as close as practical to the approved mockups while keeping Latin + Hebrew readable.
