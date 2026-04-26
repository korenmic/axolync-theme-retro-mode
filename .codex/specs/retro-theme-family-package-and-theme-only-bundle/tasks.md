# Implementation Plan

- [x] 1. Scaffold the retro theme repo as the source of truth for the four retro themes.
  - Define the four theme ids, package metadata, and family membership clearly.
  - Organize the repo so theme assets and editable/generated source artifacts do not get mixed together.

- [x] 2. Create four distinct generated font families, one per retro theme.
  - Generate Latin + Hebrew minimum glyph coverage for:
    - red LED
    - cyan VFD
    - arcade CRT
    - cockpit HUD
  - Keep the editable/generated source artifacts in-repo alongside the shipped assets.
  - Make Hebrew readability a hard requirement, even when a strict segmented look has to soften into a hybrid treatment.

- [x] 3. Build the four retro themes so they match the approved visual directions as closely as practical.
  - Implement theme-owned CSS/assets for each retro theme.
  - Keep the four themes visually distinct rather than reducing them to palette swaps.

- [x] 4. Define and generate one theme-only retro bundle containing exactly the four themes together.
  - Keep the bundle free of adapters and addon runtime behavior.
  - Keep the same logical bundle suitable for both preinstalled and later install-on-demand flows.

- [x] 5. Add repo-owned proof artifacts that support later browser screenshot acceptance.
  - Keep stable theme ids, asset names, and any visual references needed for screenshot comparisons.
  - Make later Playwright/browser proof practical instead of fragile.

- [x] 6. Add TOML-toggleable detailed mock-inspired background images for all four retro themes.
  - Add retro-repo bundler TOML authority that controls whether enhanced detailed background assets are emitted/enabled for the four retro themes.
  - Default the enhanced backgrounds to enabled, while preserving an explicit off path that returns the themes to their current lighter CSS/SVG backdrop behavior.
  - Create one detailed background image/asset per theme that moves the final look closer to the original mock directions:
    - red LED segmented display board
    - cyan VFD segmented display panel
    - arcade CRT/pixel cabinet/starfield
    - cockpit HUD instrument-panel scene
  - Keep the assets theme-only and decorative: no adapters, no runtime behavior, and no clickable UI meaning.
  - Package the background assets through the existing retro theme bundle so both preinstalled and install-on-demand zip flows receive the same selected visual mode.
  - Add proof that the generated bundle includes enhanced backgrounds when the TOML flag is on, excludes or disables them when off, and preserves existing theme compatibility for classic, aurora, and Passover consumers.

- [x] 7. Align the retro addon-manager close button glyph inside its square button.
  - Fix the retro theme CSS/layout for the Addon Manager close affordance so the `X` is centered in its visible square at desktop and mobile sizes.
  - Keep the hit target and accessible close semantics unchanged.
  - Add a screenshot/assertion proof for at least one retro theme that catches the glyph drifting outside the button bounds.

- [x] 8. Make retro adapter action buttons fit lane cards at runtime.
  - Add theme-owned responsive sizing/wrapping rules for lane action buttons such as `Disable lane`, `Settings`, and `Remove` so long labels never overflow their card bounds.
  - Prefer runtime fit behavior: shrink label font only when needed, otherwise wrap buttons across rows while preserving click targets.
  - Keep non-retro themes, classic, aurora, and Passover unaffected.
  - Add screenshot proof for the adapter lane action row that previously overflowed.

- [x] 9. Fix Retro Mode Hebrew glyph readability using shipped runtime-bundle proof.
  - Treat the 2026-04-26 Android and Windows runtime screenshots as the repro: Hebrew lyrics render as segmented pseudo-Latin fragments instead of recognizable Hebrew text.
  - Stop accepting proof images rendered only from repo-local/generated font files when those images do not match the installed artifact behavior.
  - Render proof images from the same `retro-mode-bundle.zip` font and CSS assets that Android and desktop artifacts actually consume, then compare those outputs against runtime screenshots.
  - Rework the generated Hebrew glyph maps and TTF outputs for all four retro themes until the full Hebrew alphabet and representative Hebrew lyric words are readable, while preserving as much retro styling as readability allows.
  - Store before/after bundle-rendered proof images in the repo artifacts so future reviews can see exactly which shipped fonts were tested.
