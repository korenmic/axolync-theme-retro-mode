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
const args = process.argv.slice(2);

function readArgValue(name) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

const configPath = path.resolve(
  ROOT,
  readArgValue('--config') || process.env.RETRO_BUNDLE_CONFIG || path.join('config', 'retro-bundle.toml'),
);
const outputDir = path.resolve(
  ROOT,
  readArgValue('--output-dir') || process.env.RETRO_BUNDLE_OUTPUT_DIR || path.join('artifacts', 'output', 'installable'),
);
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

function readBundleOptions() {
  const fallback = { enhancedBackgrounds: true, configPath };
  if (!fs.existsSync(configPath)) {
    return fallback;
  }

  const text = fs.readFileSync(configPath, 'utf8');
  const match = text.match(/^\s*enhanced_backgrounds\s*=\s*(true|false)\s*$/im);
  return {
    enhancedBackgrounds: match ? match[1] === 'true' : true,
    configPath,
  };
}

function stripEnhancedBackgroundBlocks(cssText) {
  return cssText.replace(
    /\/\*\s*axolync-enhanced-background:start\s*\*\/[\s\S]*?\/\*\s*axolync-enhanced-background:end\s*\*\//g,
    '',
  );
}

function readThemeCss(theme, options) {
  const cssText = readRequiredFile(path.join('src', theme.stylesheetPath)).toString('utf8');
  return Buffer.from(options.enhancedBackgrounds ? cssText : stripEnhancedBackgroundBlocks(cssText));
}

function buildThemeAssetSlots(theme, options) {
  return {
    ...theme.assetSlotPaths,
    ...(options.enhancedBackgrounds ? { 'enhanced-background': theme.enhancedBackgroundPath } : {}),
  };
}

function buildThemeMember(theme, options) {
  const assetSlots = buildThemeAssetSlots(theme, options);
  const assetPaths = Object.values(assetSlots);
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
    asset_slots: assetSlots,
    visual_options: {
      enhanced_backgrounds: options.enhancedBackgrounds,
    },
    font_paths: [theme.fontPath],
    font_family: theme.fontFamily,
  };
}

const bundleOptions = readBundleOptions();

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
    visual_options: {
      enhanced_backgrounds: bundleOptions.enhancedBackgrounds,
    },
    themes: RETRO_THEMES.map((theme) => buildThemeMember(theme, bundleOptions)),
  },
};

const zipEntries = {
  'manifest.json': strToU8(JSON.stringify(bundleManifest, null, 2)),
  'theme-bundle/retro-theme-family.json': readRequiredFile('src/themes/retro-theme-family.json'),
};

const zipContentIndex = [];

for (const theme of RETRO_THEMES) {
  const bundleMember = buildThemeMember(theme, bundleOptions);
  const memberThemeCssPath = theme.stylesheetPath;
  const memberFontPath = theme.fontPath;
  const memberAssetPaths = Object.values(buildThemeAssetSlots(theme, bundleOptions));

  zipEntries[memberThemeCssPath] = readThemeCss(theme, bundleOptions);
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
  configPath: path.relative(ROOT, bundleOptions.configPath).replace(/\\/g, '/'),
  enhancedBackgrounds: bundleOptions.enhancedBackgrounds,
  entries: Object.keys(zipEntries).sort(),
  themes: zipContentIndex,
}, null, 2));

const zipBuffer = Buffer.from(zipSync(zipEntries, { level: 0 }));
fs.writeFileSync(bundleZipPath, zipBuffer);

console.log(`Wrote ${bundleZipPath}`);
