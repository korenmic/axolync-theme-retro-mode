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
