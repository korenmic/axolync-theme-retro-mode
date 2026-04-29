import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BITMAP_GLYPHS } from './fontGlyphData.mjs';
import {
  DEFAULT_HEBREW_QA_CONFIG_PATH,
  REPO_ROOT,
  validateHebrewGlyphQaScaffold,
} from './hebrewGlyphQaConfig.mjs';
import { scoreMaskIou } from './hebrewGlyphQa.mjs';

function rowsToSvg(rows, { cell = 22, gap = 4, fill = '#65fff5' } = {}) {
  const width = Math.max(...rows.map((row) => row.length));
  const height = rows.length;
  const svgWidth = width * cell + (width - 1) * gap;
  const svgHeight = height * cell + (height - 1) * gap;
  const rects = [];
  rows.forEach((row, y) => {
    [...row].forEach((value, x) => {
      if (value !== '1') return;
      rects.push(`<rect x="${x * (cell + gap)}" y="${y * (cell + gap)}" width="${cell}" height="${cell}" rx="4" fill="${fill}" />`);
    });
  });
  return { svgWidth, svgHeight, rects: rects.join('\n') };
}

function panel(title, rows, x, y, fill) {
  const rendered = rowsToSvg(rows, { fill });
  return `
    <g transform="translate(${x} ${y})">
      <text x="0" y="-18" fill="#dffefe" font-family="monospace" font-size="18">${title}</text>
      <rect x="-14" y="-44" width="${rendered.svgWidth + 28}" height="${rendered.svgHeight + 60}" rx="16" fill="#061116" stroke="#245d66" />
      ${rendered.rects}
    </g>
  `;
}

const { config, metadata } = validateHebrewGlyphQaScaffold({ configPath: DEFAULT_HEBREW_QA_CONFIG_PATH });
const glyphId = config.one_letter_poc;
const reference = metadata.letters[glyphId];
if (!reference) {
  throw new Error(`Missing one-letter POC glyph reference: ${glyphId}`);
}

const beforePath = path.join(REPO_ROOT, 'references', 'hebrew', 'one-letter-poc', `${glyphId}-before.json`);
if (!fs.existsSync(beforePath)) {
  throw new Error(`Missing one-letter POC before reference: ${beforePath}`);
}

const before = JSON.parse(fs.readFileSync(beforePath, 'utf8'));
const afterRows = BITMAP_GLYPHS[reference.char];
const score = scoreMaskIou(reference.template, afterRows);
const outputDir = path.join(REPO_ROOT, config.proof_output_dir, 'one-letter-poc');
fs.mkdirSync(outputDir, { recursive: true });

const svgPath = path.join(outputDir, `${glyphId}-before-after.svg`);
const reportPath = path.join(outputDir, `${glyphId}-poc.json`);
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="520" height="260" viewBox="0 0 520 260">
  <rect width="520" height="260" fill="#02090d" />
  <text x="24" y="34" fill="#ffffff" font-family="monospace" font-size="20">Retro Hebrew one-letter POC: ${glyphId} (${reference.char})</text>
  ${panel('before', before.template, 56, 86, '#ff6f6f')}
  ${panel('after', afterRows, 304, 86, '#65fff5')}
  <text x="24" y="238" fill="#9eb7c9" font-family="monospace" font-size="14">score ${score.toFixed(3)} / threshold ${Number(config.glyph_threshold).toFixed(3)}</text>
</svg>
`;

fs.writeFileSync(svgPath, svg);
fs.writeFileSync(reportPath, `${JSON.stringify({
  glyphId,
  char: reference.char,
  beforeReference: path.relative(REPO_ROOT, beforePath).replace(/\\/g, '/'),
  proofSvg: path.relative(REPO_ROOT, svgPath).replace(/\\/g, '/'),
  score,
  threshold: config.glyph_threshold,
  passed: score >= config.glyph_threshold,
}, null, 2)}\n`);

if (score < config.glyph_threshold) {
  throw new Error(`One-letter POC failed for ${glyphId}: score ${score.toFixed(3)} below ${Number(config.glyph_threshold).toFixed(3)}`);
}

console.log(`Hebrew one-letter POC passed for ${glyphId}; proof ${svgPath}`);
