# Requirements Document

## Introduction

This spec creates a permanent Hebrew glyph QA workflow for the Retro Mode theme fonts. The goal is to stop accepting source-only or stale proof images and instead verify that the Hebrew glyphs shipped inside the actual retro theme bundle remain recognizably Hebrew in real runtime-style rendering.

The feature covers reference intake, bundle-rendered proof images, deterministic glyph comparison, optional OCR as a secondary signal, and regression tests. It also includes the correction loop required to bring the shipped Hebrew glyphs up to the accepted reference quality.

## Resolved Questions

1. The approved Hebrew reference sheet should live under `references/hebrew/` with adjacent metadata, so it is repo-owned but clearly not a runtime theme asset.
2. OCR is optional and secondary. The primary gate is deterministic rendered-mask comparison against an approved reference because stylized isolated Hebrew letters are weak OCR targets.
3. The first similarity thresholds should be configurable. The initial recommended defaults are strict enough to catch broken pseudo-glyphs but adjustable during the first calibration pass.
4. The implementation should prove one letter end-to-end before correcting and gating the full alphabet.
5. Proof images must be rendered from the built installable retro bundle, not from unrelated source glyph previews.

## Requirements

### Requirement 1

**User Story:** As a maintainer, I want an approved Hebrew glyph reference owned by the retro repo, so future font changes have a concrete readability target.

#### Acceptance Criteria

1. WHEN the QA workflow is implemented THEN the repo SHALL include a Hebrew reference asset location under `references/hebrew/`.
2. WHEN the reference is stored THEN it SHALL include enough metadata to map each Hebrew letter to its expected reference region or template.
3. WHEN the reference file is missing THEN the QA command SHALL fail with an actionable message rather than silently passing.
4. WHEN the reference is updated intentionally THEN the update SHALL be visible in version control as a normal repo asset change.

### Requirement 2

**User Story:** As a reviewer, I want proof images rendered from the actual shipped retro bundle, so I can trust that the proof matches installed artifact behavior.

#### Acceptance Criteria

1. WHEN Hebrew proof is generated THEN it SHALL read fonts and CSS from the built `retro-mode-bundle.zip`.
2. WHEN proof images are emitted THEN they SHALL include one before/current rendered alphabet sheet and one after/candidate rendered alphabet sheet where both are available.
3. WHEN proof images are emitted THEN they SHALL include full-alphabet and real-word/sample-line views for every retro theme.
4. WHEN proof images are generated THEN their output paths SHALL be predictable under repo-local artifacts or proof output folders.
5. WHEN source glyph previews disagree with bundle-rendered output THEN bundle-rendered output SHALL be treated as authoritative.

### Requirement 3

**User Story:** As a user reading Hebrew lyrics, I want the retro fonts to look recognizably Hebrew, so the themes remain usable and not merely decorative.

#### Acceptance Criteria

1. WHEN every supported Hebrew letter is rendered THEN each glyph SHALL pass the configured reference similarity threshold for its theme or shared glyph source.
2. WHEN Hebrew sample words are rendered THEN the result SHALL preserve word-level readability even if strict retro styling must soften.
3. WHEN a glyph cannot satisfy both visual style and readability THEN readability SHALL win.
4. WHEN a Hebrew glyph fails QA THEN the failure SHALL name the theme, glyph, measured score, threshold, and proof image path.

### Requirement 4

**User Story:** As an implementor, I want a one-letter proof of concept before changing the full alphabet, so the correction loop is validated before large-scale glyph work.

#### Acceptance Criteria

1. WHEN implementation starts THEN it SHALL add a one-letter QA proof path before enforcing the full alphabet.
2. WHEN the one-letter POC passes THEN the same mechanism SHALL scale to the full alphabet without switching to a different proof method.
3. WHEN the full alphabet is enabled THEN all retro themes that share generated Hebrew glyph data SHALL be checked.

### Requirement 5

**User Story:** As a maintainer, I want OCR to help when available but not own the result, so QA remains useful without becoming flaky or environment-dependent.

#### Acceptance Criteria

1. WHEN a supported OCR engine is available locally THEN the QA command MAY run it as an additional diagnostic.
2. WHEN OCR is unavailable THEN the primary mask/template comparison SHALL still run.
3. WHEN OCR disagrees with the deterministic similarity gate THEN OCR SHALL be reported as advisory unless design explicitly promotes a specific OCR rule later.
4. WHEN OCR diagnostics are emitted THEN they SHALL not be required to pass in CI unless a stable local engine has been explicitly configured.

### Requirement 6

**User Story:** As a regression owner, I want Hebrew glyph QA wired into repo verification, so broken Hebrew font output cannot silently ship again.

#### Acceptance Criteria

1. WHEN `npm test` or the repo verification flow runs THEN it SHALL include the Hebrew glyph QA gate or call a clearly named Hebrew QA command.
2. WHEN the retro bundle changes fonts or glyph maps THEN the QA gate SHALL rerun against the built bundle.
3. WHEN the QA command passes THEN it SHALL print a concise summary of checked themes, checked glyphs, and proof image locations.
4. WHEN the QA command fails THEN it SHALL exit non-zero.

## Self-Review Notes

- The requirements intentionally do not make OCR the source of truth.
- The requirements force proof through the shipped bundle because earlier proof images were not faithful to runtime behavior.
- The requirements include glyph correction, not only harness creation, because a QA system that proves broken output but never fixes it is not enough.
