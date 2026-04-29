# Retro Hebrew Glyph QA References

This folder owns the Hebrew glyph readability target for Retro Mode theme fonts.

The QA flow must compare bundle-rendered Hebrew output against explicit repo-owned reference metadata. The initial reference is encoded as deterministic bitmap templates in `reference-hebrew-alphabet.json`; a future reviewer-approved image sheet can be added as `reference-hebrew-alphabet.png` with crop boxes in the same metadata shape.

Rules:

- Runtime theme assets must not depend on this folder.
- QA must fail with a specific missing reference id when metadata is incomplete.
- If a reference image is introduced later, the metadata must map every supported Hebrew letter and final form to an explicit crop region.
- The supported alphabet is the regular Hebrew alphabet plus final forms: `אבגדהוזחטיכךלמםנןסעפףצץקרשת`.
- Full-alphabet review artifacts are generated with `npm run qa:hebrew:alphabet` under `artifacts/output/hebrew-glyph-qa/full-alphabet/`.
