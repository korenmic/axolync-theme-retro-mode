# Implementation Plan

## Spark-Safe Execution Guardrails

- Work only in `axolync-theme-retro-mode` unless a task explicitly says otherwise.
- Do not use the browser/runtime screenshots as the QA source. Use the built retro installable theme bundle and render proof images from that bundle so the test matches shipped runtime assets.
- Keep Hebrew glyph QA deterministic first. OCR is advisory only and must never be the only pass/fail gate.
- Preserve all four retro themes. A glyph fix must not silently improve one theme while breaking the other three.
- Do not delete existing proof artifacts unless they are generated outputs in a documented proof folder; keep before/after images when the task asks for them.
- If the approved Hebrew reference sheet is not already committed in the repo, create a clearly documented placeholder/reference path and fail gracefully with a useful message instead of inventing an unreviewed reference.
- Every implementation task that changes glyph generation must produce or update a proof image path in the repo-local proof output, so the human reviewer can visually inspect the result.

- [x] 1. Add the Hebrew glyph QA reference scaffold and config.
  - Create `references/hebrew/` with a documented placeholder or committed reference asset path for the approved Hebrew alphabet sheet.
  - Add metadata shape for mapping rendered Hebrew letters to reference regions/templates.
  - Add `config/hebrew-glyph-qa.toml` with configurable metric, threshold, proof output, and optional OCR settings.
  - Include the full Hebrew alphabet plus final forms in the config/metadata surface; do not hardcode only the one-letter POC.
  - Add validation that fails with the exact missing glyph/reference id when metadata is incomplete.
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 3.4_

- [x] 2. Upgrade bundle-rendered Hebrew proof into stable QA input.
  - Extend the existing Hebrew proof renderer so it reads the built `retro-mode-bundle.zip` and emits per-theme alphabet, per-letter, and sample-word proof outputs with stable crop boundaries.
  - Ensure generated PNG and HTML proof outputs land under a predictable repo-local proof folder.
  - Keep proof execution headless and isolated from user browser profiles.
  - The renderer must prove which exact bundle file was used, including path and checksum/signature where the repo already exposes one.
  - Do not render from source font data directly unless the task also proves the same data was packaged into the bundle.
  - _Requirements: 2.1, 2.3, 2.4, 2.5_

- [x] 3. Implement deterministic Hebrew glyph mask comparison.
  - Add reference-mask loading, rendered-glyph mask extraction, normalization, and similarity scoring.
  - Fail with theme, glyph, score, threshold, and proof path when a glyph is below threshold.
  - Add focused tests for missing references, malformed metadata, score calculation, and failure messages.
  - Normalize scale/padding before scoring so failures reflect glyph shape, not accidental crop differences.
  - Keep scores per glyph and per theme in machine-readable output for later report ingestion.
  - _Requirements: 1.3, 3.1, 3.4, 6.4_

- [x] 4. Prove the one-letter correction loop before enforcing the full alphabet.
  - Select the initial configured Hebrew POC letter from the QA config.
  - Render the current broken/candidate bundle state for that letter.
  - Adjust the generated glyph data for that one letter until the bundle-rendered proof passes the deterministic QA threshold.
  - Record before/after proof images for the one-letter POC.
  - Commit the one-letter implementation and test proof separately enough that review can distinguish QA harness correctness from full alphabet cleanup.
  - If the one-letter correction cannot pass deterministically, stop and mark the queue item blocked rather than mass-editing all glyphs blindly.
  - _Requirements: 4.1, 4.2_

- [x] 5. Correct and gate the full Hebrew alphabet across all retro themes.
  - Expand the same correction loop from the one-letter POC to every supported Hebrew letter, including final forms.
  - Preserve word-level readability over strict segmented styling when the two conflict.
  - Generate before/after proof sheets for all themes and representative Hebrew sample lines.
  - Use the approved reference sheet as the target, but prefer readable Hebrew letter identity over pure seven-segment aesthetics when they conflict.
  - Ensure right-to-left sample words render in the same order the runtime uses; do not fake LTR-only proof.
  - _Requirements: 2.2, 2.3, 3.1, 3.2, 3.3, 4.3_

- [x] 6. Add optional OCR diagnostics without making OCR the required gate.
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
  - Keep the script fast enough for normal repo verification; if OCR is slow or unavailable, leave it outside the required gate.
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

## Self-Review Notes

- The plan starts with reference/config scaffolding before code, so the target is explicit.
- The one-letter POC prevents a full-alphabet rewrite from hiding a broken QA method.
- The tasks keep OCR advisory, not mandatory.
- The final gate uses the installable bundle path, matching the runtime proof requirement.
