# Retro Hebrew Glyph Reference And QA

## Summary

Create a real Hebrew glyph correction and QA workflow for the retro theme fonts, so Hebrew text does not render as decorative pseudo-glyphs that look unlike Hebrew.

The current retro fonts improved the visual direction for Latin, but Hebrew needs a separate quality gate. The target is not only "looks retro"; the target is "still recognizably Hebrew when rendered through the actual shipped theme bundle."

Priority:
- `P0`

## Product Context

Retro themes are now part of real artifacts, so their typography is product surface, not mock-only art.

The Hebrew rendering failure is not a small cosmetic gap. If Hebrew letters are unrecognizable, then any Israeli/Hebrew lyric result becomes unreadable even when detection and lyric retrieval are otherwise correct.

The QA process must use the same font assets and runtime rendering path that artifacts use. Source-only previews are not trustworthy enough, because they can accidentally render a different file or stale generated asset.

The workflow should support iterative review:

- render the current/before Hebrew alphabet sheet
- apply glyph corrections
- render the after sheet
- compare against an approved Hebrew pixel-art reference
- produce review PNGs that make regressions obvious
- eventually fail CI/proof when Hebrew glyph quality drops below the accepted bar

OCR may help, but isolated stylized Hebrew letters can be weak OCR targets. OCR should therefore be treated as a secondary signal, not the only gate. A deterministic template or mask-similarity comparison against an approved reference sheet should be the primary QA path.

## Technical Constraints

- The source of truth for retro font assets remains this theme repo.
- The QA harness must render from the built theme/font assets that would ship, not from unrelated local fallback fonts.
- The QA output must include before/after PNG proof sheets for review.
- The first implementation should include a one-letter proof of concept before mass-editing the entire alphabet.
- Hebrew readability wins over maximal segmented-display purity.
- The approved Hebrew alphabet reference should be stored as repo-local QA input once available as a file.
- The generated QA sheets should include:
  - individual Hebrew letters
  - the full Hebrew alphabet in order
  - a few real Hebrew words/phrases, because word-level readability matters more than isolated glyph recognition
- OCR can be used as a secondary check when available locally, but the task must not depend exclusively on OCR.
- The primary check should compare rendered glyph masks against the approved reference, with configurable threshold values.
- The QA command should be portable enough for agents to run locally without touching user browser profiles.
- The final font correction must update all retro themes that share the affected Hebrew glyph source.
- Non-Hebrew scripts should keep falling back cleanly rather than being forced through bad generated glyphs.

## Open Questions

Resolved/recommended for spec-making:

1. This should be a seed, not a loose backlog task, because it creates a reusable font QA workflow plus corrected assets.
2. OCR should be helpful but not authoritative. Template/mask similarity against the approved reference should be the main gate.
3. The first implementation should prove one Hebrew letter end-to-end before applying the full alphabet.
4. Review artifacts should be PNG files in a predictable proof/output folder, not chat-only images.
5. Runtime proof must render the actual built theme bundle/font, because earlier preview rendering failed to represent the true broken state.

Still open for design:

1. Where should the approved Hebrew reference sheet be stored inside the retro repo once the user provides it as a local file?
2. Which OCR engine, if any, is available and reliable enough locally to use as a secondary signal?
3. What initial mask-similarity threshold should block regressions without rejecting valid retro stylization?

## Acceptance Direction

- the repo owns an approved Hebrew reference sheet or generated reference fixture
- a local proof command renders before/after Hebrew sheets from shipped font assets
- one-letter POC proves the correction loop before full alphabet work
- all Hebrew letters are corrected to look recognizably Hebrew
- word-level Hebrew samples render readably in the retro themes
- regression proof can detect when future font changes corrupt Hebrew glyphs again
