import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import opentype from 'opentype.js';
import { BITMAP_GLYPHS, CELL_GRID_HEIGHT, CELL_GRID_WIDTH } from './fontGlyphData.mjs';
import { RETRO_THEMES } from './retroThemeConfig.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const UNITS_PER_EM = 1000;
const ASCENDER = 860;
const DESCENDER = -140;
const GLYPH_ADVANCE = 780;
const MARGIN_X = 80;
const MARGIN_Y = 110;

const FAMILY_STYLES = {
  'retro-red-led': {
    familyName: 'Axolync Retro Red LED',
    shape: 'led',
    skew: 0,
    gap: 20,
    bevel: 20,
  },
  'retro-cyan-vfd': {
    familyName: 'Axolync Retro Cyan VFD',
    shape: 'vfd',
    skew: 18,
    gap: 26,
    bevel: 28,
  },
  'retro-arcade-crt': {
    familyName: 'Axolync Retro Arcade CRT',
    shape: 'pixel',
    skew: 0,
    gap: 14,
    bevel: 8,
  },
  'retro-cockpit-hud': {
    familyName: 'Axolync Retro Cockpit HUD',
    shape: 'hud',
    skew: 14,
    gap: 18,
    bevel: 22,
  },
};

function cellMetrics(style) {
  const usableWidth = GLYPH_ADVANCE - MARGIN_X * 2;
  const usableHeight = ASCENDER + Math.abs(DESCENDER) - MARGIN_Y * 2;
  const cellWidth = Math.floor((usableWidth - (CELL_GRID_WIDTH - 1) * style.gap) / CELL_GRID_WIDTH);
  const cellHeight = Math.floor((usableHeight - (CELL_GRID_HEIGHT - 1) * style.gap) / CELL_GRID_HEIGHT);
  return { cellWidth, cellHeight };
}

function addPolygon(pathBuilder, points) {
  if (!points.length) return;
  pathBuilder.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i += 1) {
    pathBuilder.lineTo(points[i][0], points[i][1]);
  }
  pathBuilder.close();
}

function buildCellPolygon(x, y, width, height, style) {
  const right = x + width;
  const bottom = y + height;
  const bevel = Math.min(style.bevel, Math.floor(Math.min(width, height) / 2) - 1);
  switch (style.shape) {
    case 'pixel':
      return [
        [x, y],
        [right, y],
        [right, bottom],
        [x, bottom],
      ];
    case 'hud':
      return [
        [x + bevel, y],
        [right, y],
        [right - bevel, bottom],
        [x, bottom],
      ];
    case 'vfd':
      return [
        [x + bevel, y],
        [right, y],
        [right - bevel, bottom],
        [x, bottom],
      ];
    case 'led':
    default:
      return [
        [x + bevel, y],
        [right - bevel, y],
        [right, y + bevel],
        [right - bevel, bottom],
        [x + bevel, bottom],
        [x, y + bevel],
      ];
  }
}

function buildGlyphPath(rows, style) {
  const pathBuilder = new opentype.Path();
  const { cellWidth, cellHeight } = cellMetrics(style);
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex];
    for (let colIndex = 0; colIndex < row.length; colIndex += 1) {
      if (row[colIndex] !== '1') continue;
      const x = MARGIN_X + colIndex * (cellWidth + style.gap);
      const y = ASCENDER - MARGIN_Y - cellHeight - rowIndex * (cellHeight + style.gap);
      const skewOffset = style.skew ? (CELL_GRID_HEIGHT - rowIndex - 1) * style.skew : 0;
      const polygon = buildCellPolygon(x + skewOffset, y, cellWidth, cellHeight, style);
      addPolygon(pathBuilder, polygon);
    }
  }
  return pathBuilder;
}

function buildFontForTheme(themeId) {
  const style = FAMILY_STYLES[themeId];
  const glyphs = [
    new opentype.Glyph({
      name: '.notdef',
      unicode: 0,
      advanceWidth: GLYPH_ADVANCE,
      path: new opentype.Path(),
    }),
  ];

  for (const [char, rows] of Object.entries(BITMAP_GLYPHS)) {
    glyphs.push(new opentype.Glyph({
      name: `glyph-${char.codePointAt(0)?.toString(16) ?? 'unknown'}`,
      unicode: char.codePointAt(0),
      advanceWidth: GLYPH_ADVANCE,
      path: buildGlyphPath(rows, style),
    }));
  }

  return new opentype.Font({
    familyName: style.familyName,
    styleName: 'Regular',
    unitsPerEm: UNITS_PER_EM,
    ascender: ASCENDER,
    descender: DESCENDER,
    glyphs,
  });
}

for (const theme of RETRO_THEMES) {
  const style = FAMILY_STYLES[theme.id];
  const font = buildFontForTheme(theme.id);
  const familyDir = path.join(ROOT, 'src', 'font-src', theme.id);
  const shippedDir = path.join(ROOT, 'src', 'fonts', theme.id);
  const artifactDir = path.join(ROOT, 'artifacts', 'output', 'fonts', theme.id);
  fs.mkdirSync(familyDir, { recursive: true });
  fs.mkdirSync(shippedDir, { recursive: true });
  fs.mkdirSync(artifactDir, { recursive: true });

  const previewPath = path.join(familyDir, 'glyph-map.json');
  fs.writeFileSync(previewPath, `${JSON.stringify({ familyName: style.familyName, glyphs: BITMAP_GLYPHS }, null, 2)}\n`, 'utf8');

  const ttfBuffer = Buffer.from(font.toArrayBuffer());
  const ttfName = `${theme.id}.ttf`;
  fs.writeFileSync(path.join(shippedDir, ttfName), ttfBuffer);
  fs.writeFileSync(path.join(artifactDir, ttfName), ttfBuffer);
}
