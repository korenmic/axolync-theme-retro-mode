import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { strFromU8, unzipSync } from 'fflate';
import opentype from 'opentype.js';
import { BITMAP_GLYPHS } from './fontGlyphData.mjs';
import {
  DEFAULT_HEBREW_QA_CONFIG_PATH,
  REPO_ROOT,
  validateHebrewGlyphQaScaffold,
} from './hebrewGlyphQaConfig.mjs';

function readArgValue(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function normalizeRows(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error('Glyph mask rows must be a non-empty array');
  }
  const width = Math.max(...rows.map((row) => row.length));
  const padded = rows.map((row) => {
    if (!/^[01]+$/.test(row)) {
      throw new Error(`Malformed glyph mask row: ${row}`);
    }
    return row.padEnd(width, '0');
  });

  const activePoints = [];
  for (let y = 0; y < padded.length; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (padded[y][x] === '1') activePoints.push([x, y]);
    }
  }

  if (!activePoints.length) {
    return ['0'];
  }

  const minX = Math.min(...activePoints.map(([x]) => x));
  const maxX = Math.max(...activePoints.map(([x]) => x));
  const minY = Math.min(...activePoints.map(([, y]) => y));
  const maxY = Math.max(...activePoints.map(([, y]) => y));
  const trimmed = [];
  for (let y = minY; y <= maxY; y += 1) {
    trimmed.push(padded[y].slice(minX, maxX + 1));
  }
  return trimmed;
}

function rowsToMask(rows) {
  const normalized = normalizeRows(rows);
  const cells = new Set();
  normalized.forEach((row, y) => {
    [...row].forEach((cell, x) => {
      if (cell === '1') cells.add(`${x},${y}`);
    });
  });
  return { cells, width: Math.max(...normalized.map((row) => row.length)), height: normalized.length };
}

export function scoreMaskIou(referenceRows, candidateRows) {
  const reference = rowsToMask(referenceRows);
  const candidate = rowsToMask(candidateRows);
  const all = new Set([...reference.cells, ...candidate.cells]);
  if (!all.size) return 1;

  let intersection = 0;
  for (const cell of all) {
    if (reference.cells.has(cell) && candidate.cells.has(cell)) intersection += 1;
  }
  return intersection / all.size;
}

export function formatGlyphFailure({ themeId, glyphId, char, score, threshold, proofPath }) {
  return `${themeId} ${glyphId} (${char}) scored ${score.toFixed(3)} below ${threshold.toFixed(3)}; proof: ${proofPath ?? 'unavailable'}`;
}

function parseFont(bytes) {
  const buffer = Buffer.from(bytes);
  const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
  return opentype.parse(arrayBuffer);
}

function readBundleFonts(bundlePath) {
  const entries = unzipSync(fs.readFileSync(bundlePath));
  const manifest = JSON.parse(strFromU8(entries['manifest.json']));
  const themes = manifest.theme_bundle?.themes ?? [];
  if (!themes.length) {
    throw new Error(`No themes found in ${bundlePath}`);
  }

  return themes.map((theme) => {
    const fontPath = theme.font_paths?.[0];
    if (!fontPath || !entries[fontPath]) {
      throw new Error(`Missing font payload for theme ${theme.id ?? theme.name}`);
    }
    return {
      id: theme.id ?? theme.name,
      name: theme.name,
      fontFamily: theme.font_family,
      font: parseFont(entries[fontPath]),
    };
  });
}

function readProofManifest(outputDir) {
  const manifestPath = path.join(outputDir, 'hebrew-proof-manifest.json');
  if (!fs.existsSync(manifestPath)) return null;
  return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
}

function proofPathFor(proofManifest, themeId, glyphId) {
  const theme = proofManifest?.themes?.find((entry) => entry.id === themeId);
  return theme?.glyphs?.find((glyph) => glyph.id === glyphId)?.png ?? null;
}

export function scoreHebrewGlyphs({ config, metadata, bundlePath, outputDir }) {
  const themes = readBundleFonts(bundlePath);
  const proofManifest = readProofManifest(outputDir);
  const report = {
    generatedAt: new Date().toISOString(),
    bundlePath: path.relative(REPO_ROOT, bundlePath).replace(/\\/g, '/'),
    metric: config.primary_metric,
    threshold: config.glyph_threshold,
    themes: [],
    failures: [],
  };

  const letters = Object.entries(metadata.letters)
    .filter(([, letter]) => [...config.alphabet].includes(letter.char));

  for (const theme of themes) {
    const themeReport = { id: theme.id, name: theme.name, glyphs: [] };
    for (const [glyphId, reference] of letters) {
      const candidateRows = BITMAP_GLYPHS[reference.char];
      if (!candidateRows) {
        throw new Error(`Missing generated glyph rows for ${glyphId} (${reference.char})`);
      }
      if (theme.font.charToGlyphIndex(reference.char) === 0) {
        throw new Error(`Bundle font ${theme.id} is missing glyph ${glyphId} (${reference.char})`);
      }
      const score = scoreMaskIou(reference.template, candidateRows);
      const proofPath = proofPathFor(proofManifest, theme.id, glyphId);
      const glyphReport = {
        id: glyphId,
        char: reference.char,
        score,
        threshold: config.glyph_threshold,
        passed: score >= config.glyph_threshold,
        proofPath,
      };
      if (!glyphReport.passed) {
        report.failures.push({
          themeId: theme.id,
          glyphId,
          char: reference.char,
          score,
          threshold: config.glyph_threshold,
          proofPath,
          message: formatGlyphFailure({
            themeId: theme.id,
            glyphId,
            char: reference.char,
            score,
            threshold: config.glyph_threshold,
            proofPath,
          }),
        });
      }
      themeReport.glyphs.push(glyphReport);
    }
    report.themes.push(themeReport);
  }

  return report;
}

export function writeHebrewGlyphQaReport(report, outputDir) {
  fs.mkdirSync(outputDir, { recursive: true });
  const reportPath = path.join(outputDir, 'hebrew-glyph-qa-report.json');
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  return reportPath;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { config, metadata } = validateHebrewGlyphQaScaffold({
    configPath: path.resolve(readArgValue('--config') ?? DEFAULT_HEBREW_QA_CONFIG_PATH),
  });
  const outputDir = path.resolve(REPO_ROOT, readArgValue('--output-dir') ?? config.proof_output_dir);
  const bundlePath = path.resolve(REPO_ROOT, readArgValue('--bundle') ?? config.rendering?.bundle_path);
  const report = scoreHebrewGlyphs({ config, metadata, bundlePath, outputDir });
  const reportPath = writeHebrewGlyphQaReport(report, outputDir);

  if (report.failures.length) {
    for (const failure of report.failures) {
      console.error(failure.message);
    }
    console.error(`Hebrew glyph QA failed: ${report.failures.length} failures; report ${reportPath}`);
    process.exit(1);
  }

  const glyphCount = report.themes.reduce((total, theme) => total + theme.glyphs.length, 0);
  console.log(`Hebrew glyph QA passed: ${report.themes.length} themes, ${glyphCount} glyph checks; report ${reportPath}`);
}
