import fs from 'node:fs';
import path from 'node:path';
import { BITMAP_GLYPHS } from './fontGlyphData.mjs';
import {
  DEFAULT_HEBREW_QA_CONFIG_PATH,
  REPO_ROOT,
  validateHebrewGlyphQaScaffold,
} from './hebrewGlyphQaConfig.mjs';
import { scoreHebrewGlyphs, writeHebrewGlyphQaReport } from './hebrewGlyphQa.mjs';

function rowsToSvg(rows, { cell = 10, gap = 2, fill = '#65fff5' } = {}) {
  const width = Math.max(...rows.map((row) => row.length));
  const height = rows.length;
  const svgWidth = width * cell + (width - 1) * gap;
  const svgHeight = height * cell + (height - 1) * gap;
  const rects = [];
  rows.forEach((row, y) => {
    [...row].forEach((value, x) => {
      if (value !== '1') return;
      rects.push(`<rect x="${x * (cell + gap)}" y="${y * (cell + gap)}" width="${cell}" height="${cell}" rx="2" fill="${fill}" />`);
    });
  });
  return { svgWidth, svgHeight, rects: rects.join('\n') };
}

function glyphTile({ glyphId, char, rows, x, y }) {
  const rendered = rowsToSvg(rows);
  return `
    <g transform="translate(${x} ${y})">
      <rect x="-8" y="-30" width="98" height="112" rx="12" fill="#061116" stroke="#245d66" />
      <text x="42" y="-10" text-anchor="middle" fill="#dffefe" font-family="monospace" font-size="14">${glyphId.replace('hebrew-', '')}</text>
      <g transform="translate(${Math.floor((82 - rendered.svgWidth) / 2)} 0)">${rendered.rects}</g>
      <text x="42" y="98" text-anchor="middle" fill="#ffffff" font-family="Arial" font-size="18">${char}</text>
    </g>
  `;
}

const { config, metadata } = validateHebrewGlyphQaScaffold({ configPath: DEFAULT_HEBREW_QA_CONFIG_PATH });
const outputDir = path.join(REPO_ROOT, config.proof_output_dir, 'full-alphabet');
fs.mkdirSync(outputDir, { recursive: true });

const glyphs = [...config.alphabet].map((char) => {
  const [glyphId, reference] = Object.entries(metadata.letters).find(([, letter]) => letter.char === char) ?? [];
  if (!glyphId) throw new Error(`Missing Hebrew glyph reference for ${char}`);
  const rows = BITMAP_GLYPHS[char];
  if (!rows) throw new Error(`Missing generated Hebrew glyph rows for ${glyphId}`);
  return { glyphId, char, rows };
});

const columns = 9;
const tileWidth = 106;
const tileHeight = 128;
const tiles = glyphs.map((glyph, index) => {
  const x = 28 + (index % columns) * tileWidth;
  const y = 88 + Math.floor(index / columns) * tileHeight;
  return glyphTile({ ...glyph, x, y });
}).join('\n');

const sampleLines = config.rendering?.sample_words ?? ['שלום', 'עברית', 'ירושלים', 'מוזיקה'];
const sampleText = sampleLines.map((line, index) => (
  `<text x="980" y="${126 + index * 34}" text-anchor="end" direction="rtl" unicode-bidi="bidi-override" fill="#dffefe" font-family="Arial" font-size="24">${line}</text>`
)).join('\n');

const svgPath = path.join(outputDir, 'hebrew-full-alphabet-after.svg');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1040" height="540" viewBox="0 0 1040 540">
  <rect width="1040" height="540" fill="#02090d" />
  <text x="28" y="38" fill="#ffffff" font-family="monospace" font-size="22">Retro Hebrew full alphabet gate</text>
  <text x="28" y="62" fill="#9eb7c9" font-family="monospace" font-size="13">Regular alphabet plus final forms, rendered from generated glyph templates used by all four fonts.</text>
  ${tiles}
  <text x="980" y="86" text-anchor="end" fill="#72ffff" font-family="monospace" font-size="18">RTL sample lines</text>
  ${sampleText}
</svg>
`;
fs.writeFileSync(svgPath, svg);

const bundlePath = path.join(REPO_ROOT, config.rendering?.bundle_path);
const report = scoreHebrewGlyphs({ config, metadata, bundlePath, outputDir: path.join(REPO_ROOT, config.proof_output_dir) });
const reportPath = writeHebrewGlyphQaReport(report, path.join(REPO_ROOT, config.proof_output_dir));

if (report.failures.length) {
  throw new Error(`Full Hebrew alphabet gate failed with ${report.failures.length} failures; report ${reportPath}`);
}

console.log(`Full Hebrew alphabet gate passed; proof ${svgPath}`);
