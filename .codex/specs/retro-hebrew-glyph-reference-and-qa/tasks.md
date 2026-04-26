# Implementation Plan

- [ ] 1. Add the Hebrew glyph QA reference scaffold and config.
  - Create `references/hebrew/` with a documented placeholder or committed reference asset path for the approved Hebrew alphabet sheet.
  - Add metadata shape for mapping rendered Hebrew letters to reference regions/templates.
  - Add `config/hebrew-glyph-qa.toml` with configurable metric, threshold, proof output, and optional OCR settings.
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 3.4_

- [ ] 2. Upgrade bundle-rendered Hebrew proof into stable QA input.
  - Extend the existing Hebrew proof renderer so it reads the built `retro-mode-bundle.zip` and emits per-theme alphabet, per-letter, and sample-word proof outputs with stable crop boundaries.
  - Ensure generated PNG and HTML proof outputs land under a predictable repo-local proof folder.
  - Keep proof execution headless and isolated from user browser profiles.
  - _Requirements: 2.1, 2.3, 2.4, 2.5_

- [ ] 3. Implement deterministic Hebrew glyph mask comparison.
  - Add reference-mask loading, rendered-glyph mask extraction, normalization, and similarity scoring.
  - Fail with theme, glyph, score, threshold, and proof path when a glyph is below threshold.
  - Add focused tests for missing references, malformed metadata, score calculation, and failure messages.
  - _Requirements: 1.3, 3.1, 3.4, 6.4_

- [ ] 4. Prove the one-letter correction loop before enforcing the full alphabet.
  - Select the initial configured Hebrew POC letter from the QA config.
  - Render the current broken/candidate bundle state for that letter.
  - Adjust the generated glyph data for that one letter until the bundle-rendered proof passes the deterministic QA threshold.
  - Record before/after proof images for the one-letter POC.
  - _Requirements: 4.1, 4.2_

- [ ] 5. Correct and gate the full Hebrew alphabet across all retro themes.
  - Expand the same correction loop from the one-letter POC to every supported Hebrew letter, including final forms.
  - Preserve word-level readability over strict segmented styling when the two conflict.
  - Generate before/after proof sheets for all themes and representative Hebrew sample lines.
  - _Requirements: 2.2, 2.3, 3.1, 3.2, 3.3, 4.3_

- [ ] 6. Add optional OCR diagnostics without making OCR the required gate.
  - Detect a configured or locally available OCR path when present.
  - Record OCR output as advisory diagnostics in the QA report.
  - Skip OCR cleanly when unavailable, while still running deterministic mask comparison.
  - Add tests for OCR skip behavior.
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 7. Wire Hebrew glyph QA into repo verification and proof reporting.
  - Add a clear npm script for Hebrew glyph QA and call it from the repo verification flow once calibrated.
  - Ensure the command builds or consumes the correct retro bundle before scoring glyphs.
  - Emit a concise pass summary with checked themes, checked glyphs, and proof image paths.
  - Ensure failures exit non-zero so broken Hebrew glyphs cannot silently ship again.
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

## Self-Review Notes

- The plan starts with reference/config scaffolding before code, so the target is explicit.
- The one-letter POC prevents a full-alphabet rewrite from hiding a broken QA method.
- The tasks keep OCR advisory, not mandatory.
- The final gate uses the installable bundle path, matching the runtime proof requirement.
