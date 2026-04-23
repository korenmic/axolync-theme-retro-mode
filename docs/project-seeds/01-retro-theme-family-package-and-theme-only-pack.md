# Retro Theme Family Package And Theme-Only Bundle

## Summary

Create a dedicated retro-mode theme repo that owns four related karaoke-display themes and can publish them together as one theme-only installable bundle, without bundling any adapters.

The four initial themes are:

- segmented red LED
- segmented cyan VFD
- arcade CRT / pixel
- cockpit hybrid

## Priority

- `P1`

## Product Context

Axolync now has a promising retro karaoke-display direction, but those visuals should not live as browser-local experiments forever.

This repo should become the source of truth for:

- the four retro theme package definitions
- their assets and typography choices
- their family-level art direction
- the eventual theme-only installable bundle artifact

The repo should not own adapters, timing logic, or controller behavior.

## Technical Constraints

- This repo must host only theme-owned material.
- The four themes should remain visually distinct but clearly part of one retro family.
- The resulting visuals should stay as close as practical to the approved mockup direction:
  - segmented glow displays
  - retro dashboard chrome
  - pixel/CRT treatment where appropriate
  - sci-fi cockpit instrumentation energy where appropriate
- The repo must not silently change or weaken existing non-retro themes.
- The installable output from this repo must remain theme-only:
  - no adapters
  - no addon runtime logic
- The first artifact direction is one multi-theme bundle zip containing exactly the four retro themes together.
- That same bundle should be valid in both normal install modes:
  - preinstalled with an artifact
  - installed later from a zip
  with no special-case split between those flows.
- Script coverage and glyph fallback reality must be addressed honestly inside the theme family:
  - Latin and Hebrew are the minimum supported scripts
  - Hebrew may use a hybrid retro treatment where that keeps the theme readable
  - other scripts must fall back cleanly rather than rendering broken fake segmented glyphs

## Scope

1. Define the four retro theme variants as real package candidates.
2. Define their shared family identity and their per-theme differences.
3. Define the one multi-theme bundle zip that carries the four retro themes together.
4. Keep the bundle output theme-only and free of adapters.
5. Add repo-local packaging and proof coverage once implementation starts.

## Non-Goals

- changing lyric timing/controller logic
- replacing existing classic/aurora/passover themes
- bundling adapters or addon actions
- inventing a generic theme marketplace by itself

## Acceptance Direction

- the retro family has its own repo
- the repo clearly owns the four retro themes
- the packaging direction is one theme-only bundle containing the four retro themes
- the resulting visuals aim to match the approved mockup direction closely

## Open Questions

1. What font architecture should the first pass use while still aiming to match the approved mockups and support Latin + Hebrew minimum coverage?
2. Should the first implementation target only shipped font assets, or also retain editable/generated source artifacts for later font iteration inside the retro repo?
3. What level of screenshot/visual proof should count as acceptance for the first implementation pass?
