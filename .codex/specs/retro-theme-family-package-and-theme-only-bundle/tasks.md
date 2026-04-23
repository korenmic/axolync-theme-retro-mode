# Implementation Plan

- [ ] 1. Scaffold the retro theme repo as the source of truth for the four retro themes.
  - Define the four theme ids, package metadata, and family membership clearly.
  - Organize the repo so theme assets and editable/generated source artifacts do not get mixed together.

- [ ] 2. Create four distinct generated font families, one per retro theme.
  - Generate Latin + Hebrew minimum glyph coverage for:
    - red LED
    - cyan VFD
    - arcade CRT
    - cockpit HUD
  - Keep the editable/generated source artifacts in-repo alongside the shipped assets.
  - Make Hebrew readability a hard requirement, even when a strict segmented look has to soften into a hybrid treatment.

- [ ] 3. Build the four retro themes so they match the approved visual directions as closely as practical.
  - Implement theme-owned CSS/assets for each retro theme.
  - Keep the four themes visually distinct rather than reducing them to palette swaps.

- [ ] 4. Define and generate one theme-only retro bundle containing exactly the four themes together.
  - Keep the bundle free of adapters and addon runtime behavior.
  - Keep the same logical bundle suitable for both preinstalled and later install-on-demand flows.

- [ ] 5. Add repo-owned proof artifacts that support later browser screenshot acceptance.
  - Keep stable theme ids, asset names, and any visual references needed for screenshot comparisons.
  - Make later Playwright/browser proof practical instead of fragile.
