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
- `config/retro-bundle.toml` - bundle-time visual knobs, including enhanced retro backgrounds
- `config/hebrew-glyph-qa.toml` - deterministic Hebrew glyph QA thresholds and proof paths
- `scripts/` - font and bundle generation
- `artifacts/output/` - generated bundle outputs and visual proof

The first implementation pass targets visuals that feel as close as practical to the approved mockups while keeping Latin + Hebrew readable.

Enhanced mock-inspired backgrounds are enabled by default. Set `enhanced_backgrounds = false` in `config/retro-bundle.toml` to package the lighter original backdrop mode instead.

Hebrew glyph QA commands:

- `npm run proof:hebrew` renders runtime-bundle Hebrew proof images from `retro-mode-bundle.zip`.
- `npm run qa:hebrew` scores every configured Hebrew glyph across every retro theme and writes `artifacts/output/hebrew-glyph-qa/hebrew-glyph-qa-report.json`.
- `npm run qa:hebrew:alphabet` emits a full Hebrew alphabet proof sheet for human review.
- `npm test` rebuilds the bundle, regenerates Hebrew proof artifacts, runs deterministic Hebrew glyph QA, runs focused QA unit tests, and verifies the installable bundle.
