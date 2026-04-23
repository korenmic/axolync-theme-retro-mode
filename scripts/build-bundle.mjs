import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { strToU8, zipSync } from 'fflate';
import {
  RETRO_BUNDLE_CONTRACTS_VERSION,
  RETRO_BUNDLE_ID,
  RETRO_BUNDLE_NAME,
  RETRO_BUNDLE_VERSION,
  RETRO_SUPPORTED_PLATFORMS,
  RETRO_THEME_FAMILY_ID,
  RETRO_THEMES,
} from './retroThemeConfig.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const outputDir = path.join(ROOT, 'artifacts', 'output', 'installable');
const bundleZipPath = path.join(outputDir, `${RETRO_BUNDLE_ID}.zip`);
const bundleManifestPath = path.join(outputDir, `${RETRO_BUNDLE_ID}.manifest.json`);
const bundleContentsPath = path.join(outputDir, `${RETRO_BUNDLE_ID}.contents.json`);

fs.mkdirSync(outputDir, { recursive: true });

function readRequiredFile(relativePath) {
  const absolutePath = path.join(ROOT, relativePath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Retro bundle is missing required file: ${relativePath}`);
  }
  return fs.readFileSync(absolutePath);
}

function buildThemeMember(theme) {
  const assetPaths = Object.values(theme.assetSlotPaths);
  return {
    theme_id: theme.id,
    name: theme.name,
    version: theme.version,
    contracts_version: RETRO_BUNDLE_CONTRACTS_VERSION,
    description: theme.description,
    supported_platforms: RETRO_SUPPORTED_PLATFORMS,
    surface: 'browser-webview',
    base_theme: 'classic',
    family_id: theme.familyId,
    visual_direction: theme.visualDirection,
    stylesheet_path: theme.stylesheetPath,
    asset_paths: assetPaths,
    asset_slots: theme.assetSlotPaths,
    font_paths: [theme.fontPath],
    font_family: theme.fontFamily,
  };
}

const bundleManifest = {
  theme_bundle: {
    schema: 'axolync-theme-family-bundle/v1',
    bundle_id: RETRO_BUNDLE_ID,
    name: RETRO_BUNDLE_NAME,
    version: RETRO_BUNDLE_VERSION,
    contracts_version: RETRO_BUNDLE_CONTRACTS_VERSION,
    family_id: RETRO_THEME_FAMILY_ID,
    delivery_modes: ['preinstalled', 'installable-zip'],
    contains_addons: false,
    contains_adapters: false,
    themes: RETRO_THEMES.map(buildThemeMember),
  },
};

const zipEntries = {
  'manifest.json': strToU8(JSON.stringify(bundleManifest, null, 2)),
  'theme-bundle/retro-theme-family.json': readRequiredFile('src/themes/retro-theme-family.json'),
};

const zipContentIndex = [];

for (const theme of RETRO_THEMES) {
  const bundleMember = buildThemeMember(theme);
  const memberThemeCssPath = theme.stylesheetPath;
  const memberFontPath = theme.fontPath;
  const memberAssetPaths = Object.values(theme.assetSlotPaths);

  zipEntries[memberThemeCssPath] = readRequiredFile(path.join('src', memberThemeCssPath));
  zipEntries[memberFontPath] = readRequiredFile(path.join('src', 'fonts', theme.id, `${theme.id}.ttf`));

  for (const assetPath of memberAssetPaths) {
    const assetRelativePath = path.join('src', assetPath);
    zipEntries[assetPath] = readRequiredFile(assetRelativePath);
  }

  zipContentIndex.push({
    id: theme.id,
    stylesheetPath: memberThemeCssPath,
    fontPath: memberFontPath,
    assetPaths: memberAssetPaths,
    assetSlots: theme.assetSlotPaths,
    fontFamily: theme.fontFamily,
    visualDirection: theme.visualDirection,
    manifest: bundleMember,
  });
}

fs.writeFileSync(bundleManifestPath, JSON.stringify(bundleManifest, null, 2));
fs.writeFileSync(bundleContentsPath, JSON.stringify({
  bundleId: RETRO_BUNDLE_ID,
  generatedAt: new Date().toISOString(),
  entries: Object.keys(zipEntries).sort(),
  themes: zipContentIndex,
}, null, 2));

const zipBuffer = Buffer.from(zipSync(zipEntries, { level: 0 }));
fs.writeFileSync(bundleZipPath, zipBuffer);

console.log(`Wrote ${bundleZipPath}`);
