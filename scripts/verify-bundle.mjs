import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { strFromU8, unzipSync } from 'fflate';
import opentype from 'opentype.js';
import { RETRO_THEMES } from './retroThemeConfig.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

function runBuild(outputDir, configPath) {
  const args = ['scripts/build-bundle.mjs', '--output-dir', outputDir];
  if (configPath) {
    args.push('--config', configPath);
  }
  execFileSync(process.execPath, args, { cwd: ROOT, stdio: 'pipe' });
  const zipPath = path.join(outputDir, 'retro-mode-bundle.zip');
  const zipEntries = unzipSync(fs.readFileSync(zipPath));
  const manifest = JSON.parse(strFromU8(zipEntries['manifest.json']));
  return { zipEntries, manifest };
}

function readZipText(zipEntries, entryName) {
  assert.ok(zipEntries[entryName], `expected zip entry ${entryName}`);
  return strFromU8(zipEntries[entryName]);
}

function assertEnhancedBundle({ zipEntries, manifest }) {
  assert.equal(manifest.theme_bundle.visual_options.enhanced_backgrounds, true);
  for (const theme of RETRO_THEMES) {
    assert.ok(zipEntries[theme.enhancedBackgroundPath], `${theme.id} enhanced background should be bundled`);
    const member = manifest.theme_bundle.themes.find((candidate) => candidate.theme_id === theme.id);
    assert.equal(member.visual_options.enhanced_backgrounds, true);
    assert.equal(member.asset_slots['enhanced-background'], theme.enhancedBackgroundPath);
    assert.ok(member.asset_paths.includes(theme.enhancedBackgroundPath));
    assert.match(readZipText(zipEntries, theme.stylesheetPath), /enhanced-background\.svg/);
  }
}

function assertLightBundle({ zipEntries, manifest }) {
  assert.equal(manifest.theme_bundle.visual_options.enhanced_backgrounds, false);
  for (const theme of RETRO_THEMES) {
    assert.equal(zipEntries[theme.enhancedBackgroundPath], undefined, `${theme.id} enhanced background should not be bundled`);
    const member = manifest.theme_bundle.themes.find((candidate) => candidate.theme_id === theme.id);
    assert.equal(member.visual_options.enhanced_backgrounds, false);
    assert.equal(member.asset_slots['enhanced-background'], undefined);
    assert.equal(member.asset_paths.includes(theme.enhancedBackgroundPath), false);
    assert.doesNotMatch(readZipText(zipEntries, theme.stylesheetPath), /enhanced-background\.svg/);
  }
}

function assertRetroCloseButtonProof({ zipEntries }) {
  for (const theme of RETRO_THEMES) {
    const stylesheet = readZipText(zipEntries, theme.stylesheetPath);
    assert.match(stylesheet, new RegExp(`body\\[data-theme="${theme.id}"\\] #plugin-manager-modal \\.close-btn`));
    assert.match(stylesheet, /place-items:\s*center;/);
    assert.match(stylesheet, /padding:\s*0;/);
    assert.match(stylesheet, /line-height:\s*1;/);
    assert.match(stylesheet, /font-family:\s*"Courier New", monospace;/);
  }
}

function assertRetroActionButtonFitProof({ zipEntries }) {
  for (const theme of RETRO_THEMES) {
    const stylesheet = readZipText(zipEntries, theme.stylesheetPath);
    assert.match(stylesheet, new RegExp(`body\\[data-theme="${theme.id}"\\] #plugin-manager-modal \\.plugin-item \\.plugin-actions`));
    assert.match(stylesheet, /\.plugin-actions\s*>\s*button/);
    assert.match(stylesheet, /flex:\s*1 1 7\.25rem;/);
    assert.match(stylesheet, /max-width:\s*100%;/);
    assert.match(stylesheet, /white-space:\s*normal;/);
    assert.match(stylesheet, /overflow-wrap:\s*anywhere;/);
  }
}

function parseFont(bytes) {
  const buffer = Buffer.from(bytes);
  const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
  return opentype.parse(arrayBuffer);
}

function assertRetroHebrewGlyphCoverage({ zipEntries, manifest }) {
  const hebrewLetters = Array.from('אבגדהוזחטיכךלמםנןסעפףצץקרשת');
  for (const theme of manifest.theme_bundle.themes) {
    const fontPath = theme.font_paths[0];
    assert.ok(zipEntries[fontPath], `${theme.theme_id} should include shipped font ${fontPath}`);
    const font = parseFont(zipEntries[fontPath]);
    for (const letter of hebrewLetters) {
      const glyph = font.charToGlyph(letter);
      assert.notEqual(glyph.name, '.notdef', `${theme.theme_id} should include ${letter}`);
      assert.ok(glyph.path.commands.length >= 6, `${theme.theme_id} ${letter} should have a readable non-empty bitmap path`);
    }
  }
}

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'axolync-retro-theme-'));
try {
  const enhancedBundle = runBuild(path.join(tempRoot, 'enhanced'));
  assertEnhancedBundle(enhancedBundle);
  assertRetroCloseButtonProof(enhancedBundle);
  assertRetroActionButtonFitProof(enhancedBundle);
  assertRetroHebrewGlyphCoverage(enhancedBundle);

  const offConfigPath = path.join(tempRoot, 'retro-bundle-off.toml');
  fs.writeFileSync(offConfigPath, '[visuals]\nenhanced_backgrounds = false\n');
  assertLightBundle(runBuild(path.join(tempRoot, 'light'), offConfigPath));
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}

console.log('Retro theme bundle verification passed.');
