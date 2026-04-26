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
const FONT_EPOCH_SECONDS = 2082844800; // 1970-01-01 in TrueType's 1904 epoch.

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

function cellMetrics(style, gridWidth = CELL_GRID_WIDTH, gridHeight = CELL_GRID_HEIGHT) {
  const usableWidth = GLYPH_ADVANCE - MARGIN_X * 2;
  const usableHeight = ASCENDER + Math.abs(DESCENDER) - MARGIN_Y * 2;
  const cellWidth = Math.floor((usableWidth - (gridWidth - 1) * style.gap) / gridWidth);
  const cellHeight = Math.floor((usableHeight - (gridHeight - 1) * style.gap) / gridHeight);
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
  const gridWidth = Math.max(CELL_GRID_WIDTH, ...rows.map((row) => row.length));
  const gridHeight = Math.max(CELL_GRID_HEIGHT, rows.length);
  const { cellWidth, cellHeight } = cellMetrics(style, gridWidth, gridHeight);
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex];
    for (let colIndex = 0; colIndex < row.length; colIndex += 1) {
      if (row[colIndex] !== '1') continue;
      const x = MARGIN_X + colIndex * (cellWidth + style.gap);
      const y = ASCENDER - MARGIN_Y - cellHeight - rowIndex * (cellHeight + style.gap);
      const skewOffset = style.skew ? (gridHeight - rowIndex - 1) * style.skew : 0;
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
    createdTimestamp: 1,
    glyphs,
  });
}

function readUInt32(buffer, offset) {
  return buffer.readUInt32BE(offset) >>> 0;
}

function writeLongDateTime(buffer, offset, seconds) {
  buffer.writeBigUInt64BE(BigInt(seconds), offset);
}

function computeTrueTypeChecksum(buffer) {
  let checksum = 0;
  for (let offset = 0; offset < buffer.length; offset += 4) {
    const value = offset + 4 <= buffer.length
      ? buffer.readUInt32BE(offset)
      : Buffer.concat([buffer.subarray(offset), Buffer.alloc(offset + 4 - buffer.length)]).readUInt32BE(0);
    checksum = (checksum + value) >>> 0;
  }
  return checksum >>> 0;
}

function computeTrueTypeTableChecksum(buffer, offset, length) {
  return computeTrueTypeChecksum(buffer.subarray(offset, offset + length));
}

function normalizeTrueTypeFont(buffer) {
  const normalized = Buffer.from(buffer);
  const numTables = normalized.readUInt16BE(4);
  let headRecordOffset = -1;
  let headTableOffset = -1;
  let headTableLength = -1;
  for (let index = 0; index < numTables; index += 1) {
    const recordOffset = 12 + index * 16;
    const tag = normalized.toString('ascii', recordOffset, recordOffset + 4);
    if (tag === 'head') {
      headRecordOffset = recordOffset;
      headTableOffset = readUInt32(normalized, recordOffset + 8);
      headTableLength = readUInt32(normalized, recordOffset + 12);
      break;
    }
  }
  if (headTableOffset < 0) {
    throw new Error('Generated retro font is missing a head table.');
  }

  normalized.writeUInt32BE(0, headTableOffset + 8);
  writeLongDateTime(normalized, headTableOffset + 20, FONT_EPOCH_SECONDS);
  writeLongDateTime(normalized, headTableOffset + 28, FONT_EPOCH_SECONDS);
  normalized.writeUInt32BE(
    computeTrueTypeTableChecksum(normalized, headTableOffset, headTableLength),
    headRecordOffset + 4,
  );
  const checksum = computeTrueTypeChecksum(normalized);
  normalized.writeUInt32BE((0xB1B0AFBA - checksum) >>> 0, headTableOffset + 8);
  return normalized;
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

  const ttfBuffer = normalizeTrueTypeFont(Buffer.from(font.toArrayBuffer()));
  const ttfName = `${theme.id}.ttf`;
  fs.writeFileSync(path.join(shippedDir, ttfName), ttfBuffer);
  fs.writeFileSync(path.join(artifactDir, ttfName), ttfBuffer);
}
