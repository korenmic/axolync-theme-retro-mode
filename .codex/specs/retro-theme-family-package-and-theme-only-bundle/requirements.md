# Requirements Document

## Introduction

This feature turns `axolync-theme-retro-mode` into the source-of-truth repo for the Retro Mode family. The repo must own four retro themes, the generated font families they depend on, and one theme-only bundle containing all four themes together. It must not bundle adapters or sneak in addon runtime behavior.

## Requirements

### Requirement 1

**User Story:** As a maintainer, I want one dedicated repo to own Retro Mode, so the family has a clear source of truth instead of browser-local experiment files.

#### Acceptance Criteria

1. WHEN the retro theme family is implemented THEN this repo SHALL own the four retro themes as real package candidates.
2. WHEN the repo defines those themes THEN they SHALL correspond to:
   - segmented red LED
   - segmented cyan VFD
   - arcade CRT / pixel
   - cockpit hybrid
3. WHEN the themes are stored here THEN they SHALL remain clearly part of one family while keeping their own visual identity.

### Requirement 2

**User Story:** As an operator, I want the retro repo to publish one theme-only bundle, so installation truth stays simple.

#### Acceptance Criteria

1. WHEN the first retro artifact is produced THEN it SHALL be one theme-only bundle containing exactly the four retro themes together.
2. WHEN that bundle is inspected THEN it SHALL contain themes only and SHALL NOT contain adapters or addon runtime logic.
3. WHEN the same bundle is used in either preinstalled or install-on-demand flows THEN it SHALL remain the same logical payload rather than separate special-case package shapes.

### Requirement 3

**User Story:** As a designer, I want each retro theme to have its own strong type treatment, so the four themes do not collapse into palette swaps.

#### Acceptance Criteria

1. WHEN the first implementation pass creates font assets THEN it SHALL create four distinct generated font families, one per retro theme.
2. WHEN those font families are created THEN the repo SHALL retain shipped assets and editable/generated source artifacts for later iteration.
3. WHEN those fonts are used in the themes THEN they SHALL aim as close as practical to the approved mockups.

### Requirement 4

**User Story:** As a user, I want retro text to stay readable in real songs, so the themes remain usable rather than merely decorative.

#### Acceptance Criteria

1. WHEN the retro themes render lyrics and shell text THEN Latin and Hebrew SHALL be the minimum supported scripts.
2. WHEN Hebrew cannot remain both strictly segmented and readable THEN the repo SHALL provide a hybrid retro treatment that preserves readability.
3. WHEN unsupported scripts are encountered THEN the theme assets SHALL fall back cleanly rather than pretending unsupported retro glyph coverage exists.

### Requirement 5

**User Story:** As a maintainer, I want strong visual proof tied to repo-owned assets, so later font/theme iterations can be judged against something concrete.

#### Acceptance Criteria

1. WHEN the first implementation pass is reviewed THEN the repo SHALL provide theme-owned visual references or proof assets that align with automated screenshot acceptance later.
2. WHEN the generated fonts/themes are revised later THEN the retained source artifacts SHALL make that iteration practical instead of forcing blind restarts.

## Self-Review Notes

- This spec keeps the repo pure: themes and their font/assets only.
- It intentionally avoids drifting into runtime/browser/wrapper behavior that belongs elsewhere.
