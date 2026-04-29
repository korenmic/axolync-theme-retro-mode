import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  formatGlyphFailure,
  scoreMaskIou,
} from './hebrewGlyphQa.mjs';
import { validateHebrewGlyphQaScaffold } from './hebrewGlyphQaConfig.mjs';

function withTempDir(fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'retro-hebrew-qa-'));
  try {
    return fn(dir);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

assert.equal(scoreMaskIou(['1'], ['1']), 1);
assert.equal(scoreMaskIou(['11'], ['10']), 0.5);
assert.ok(scoreMaskIou(['11', '10'], ['11', '00']) < 1);

const failureMessage = formatGlyphFailure({
  themeId: 'retro-red-led',
  glyphId: 'hebrew-alef',
  char: 'א',
  score: 0.4,
  threshold: 0.7,
  proofPath: 'artifacts/output/hebrew-glyph-qa/retro-red-led/letters/hebrew-alef.png',
});
assert.match(failureMessage, /retro-red-led/);
assert.match(failureMessage, /hebrew-alef/);
assert.match(failureMessage, /0\.400 below 0\.700/);
assert.match(failureMessage, /hebrew-alef\.png/);

withTempDir((dir) => {
  const configPath = path.join(dir, 'config', 'hebrew-glyph-qa.toml');
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  fs.writeFileSync(configPath, `
    [hebrew_glyph_qa]
    primary_metric = "mask_iou"
    glyph_threshold = 0.70
    word_line_threshold = 0.62
    one_letter_poc = "hebrew-alef"
    alphabet = "א"
    reference_metadata_path = "references/hebrew/missing.json"
    proof_output_dir = "artifacts/output/hebrew-glyph-qa"
    ocr_required = false
  `);
  assert.throws(
    () => validateHebrewGlyphQaScaffold({ configPath }),
    /Missing Hebrew glyph QA reference metadata/,
  );
});

withTempDir((dir) => {
  const configPath = path.join(dir, 'config', 'hebrew-glyph-qa.toml');
  const metadataPath = path.join(dir, 'references', 'hebrew', 'reference-hebrew-alphabet.json');
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  fs.mkdirSync(path.dirname(metadataPath), { recursive: true });
  fs.writeFileSync(configPath, `
    [hebrew_glyph_qa]
    primary_metric = "mask_iou"
    glyph_threshold = 0.70
    word_line_threshold = 0.62
    one_letter_poc = "hebrew-alef"
    alphabet = "אב"
    reference_metadata_path = "references/hebrew/reference-hebrew-alphabet.json"
    proof_output_dir = "artifacts/output/hebrew-glyph-qa"
    ocr_required = false
  `);
  fs.writeFileSync(metadataPath, JSON.stringify({
    letters: {
      'hebrew-alef': { char: 'א', template: ['1'] },
    },
  }));
  assert.throws(
    () => validateHebrewGlyphQaScaffold({ configPath }),
    /Missing Hebrew glyph QA reference id for glyph ב/,
  );
});

console.log('Hebrew glyph QA unit tests passed');
