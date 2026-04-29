# Hebrew Alef One-Letter POC

`hebrew-alef` is the configured one-letter POC for the first Retro Hebrew glyph QA correction loop.

This folder records the pre-correction bitmap so reviewers can compare the loop input against the corrected generated glyph in `scripts/fontGlyphData.mjs` and `references/hebrew/reference-hebrew-alphabet.json`.

The generated proof command is:

```powershell
npm run qa:hebrew:poc
```

It writes before/after proof artifacts under `artifacts/output/hebrew-glyph-qa/one-letter-poc/`.
