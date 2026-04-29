import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const HEBREW_GLYPH_QA_ALPHABET = 'אבגדהוזחטיכךלמםנןסעפףצץקרשת';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(__dirname, '..');
export const DEFAULT_HEBREW_QA_CONFIG_PATH = path.join(REPO_ROOT, 'config', 'hebrew-glyph-qa.toml');

function parseTomlValue(raw) {
  const value = raw.trim();
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value);
  if (value.startsWith('[') && value.endsWith(']')) {
    const inner = value.slice(1, -1).trim();
    if (!inner) return [];
    return inner.split(',').map((part) => parseTomlValue(part));
  }
  const quoted = value.match(/^"(.*)"$/);
  return quoted ? quoted[1] : value;
}

export function parseSimpleToml(text) {
  const root = {};
  let section = root;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*/, '').trim();
    if (!line) continue;

    const sectionMatch = line.match(/^\[([^\]]+)\]$/);
    if (sectionMatch) {
      section = root;
      for (const part of sectionMatch[1].split('.')) {
        section[part] ??= {};
        section = section[part];
      }
      continue;
    }

    const equalsIndex = line.indexOf('=');
    if (equalsIndex === -1) {
      throw new Error(`Invalid TOML line: ${rawLine}`);
    }
    const key = line.slice(0, equalsIndex).trim();
    section[key] = parseTomlValue(line.slice(equalsIndex + 1));
  }

  return root;
}

export function readHebrewGlyphQaConfig(configPath = DEFAULT_HEBREW_QA_CONFIG_PATH) {
  const absoluteConfigPath = path.resolve(configPath);
  const parsed = parseSimpleToml(fs.readFileSync(absoluteConfigPath, 'utf8'));
  const config = parsed.hebrew_glyph_qa;
  if (!config) {
    throw new Error(`Missing [hebrew_glyph_qa] section in ${absoluteConfigPath}`);
  }
  return { config, configPath: absoluteConfigPath };
}

export function loadHebrewReferenceMetadata(config, configPath = DEFAULT_HEBREW_QA_CONFIG_PATH) {
  const metadataPath = path.resolve(path.dirname(configPath), '..', config.reference_metadata_path);
  if (!fs.existsSync(metadataPath)) {
    throw new Error(`Missing Hebrew glyph QA reference metadata: ${metadataPath}`);
  }
  return {
    metadata: JSON.parse(fs.readFileSync(metadataPath, 'utf8')),
    metadataPath,
  };
}

export function validateHebrewGlyphQaScaffold({ configPath = DEFAULT_HEBREW_QA_CONFIG_PATH } = {}) {
  const { config, configPath: absoluteConfigPath } = readHebrewGlyphQaConfig(configPath);
  const requiredConfigKeys = [
    'primary_metric',
    'glyph_threshold',
    'word_line_threshold',
    'one_letter_poc',
    'alphabet',
    'reference_metadata_path',
    'proof_output_dir',
    'ocr_required',
  ];
  for (const key of requiredConfigKeys) {
    if (config[key] === undefined || config[key] === null || config[key] === '') {
      throw new Error(`Missing Hebrew glyph QA config value: ${key}`);
    }
  }

  const { metadata, metadataPath } = loadHebrewReferenceMetadata(config, absoluteConfigPath);
  const letters = metadata.letters ?? {};
  const idsByChar = new Map(Object.entries(letters).map(([id, letter]) => [letter.char, id]));
  const expectedAlphabet = [...config.alphabet];

  for (const char of expectedAlphabet) {
    const id = idsByChar.get(char);
    if (!id) {
      throw new Error(`Missing Hebrew glyph QA reference id for glyph ${char}`);
    }
    const letter = letters[id];
    if (!Array.isArray(letter.template) && !letter.crop) {
      throw new Error(`Missing Hebrew glyph QA reference template/crop for ${id}`);
    }
  }

  if (!letters[config.one_letter_poc]) {
    throw new Error(`Missing Hebrew glyph QA one-letter POC reference id: ${config.one_letter_poc}`);
  }

  return {
    config,
    configPath: absoluteConfigPath,
    metadata,
    metadataPath,
    checkedGlyphs: expectedAlphabet.length,
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = validateHebrewGlyphQaScaffold({
    configPath: process.argv[2] ? path.resolve(process.argv[2]) : DEFAULT_HEBREW_QA_CONFIG_PATH,
  });
  console.log(`Hebrew glyph QA scaffold ok: ${result.checkedGlyphs} glyphs from ${path.relative(REPO_ROOT, result.metadataPath)}`);
}
