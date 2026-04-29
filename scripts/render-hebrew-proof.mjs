import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { strFromU8, unzipSync } from 'fflate';
import {
  DEFAULT_HEBREW_QA_CONFIG_PATH,
  REPO_ROOT,
  validateHebrewGlyphQaScaffold,
} from './hebrewGlyphQaConfig.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

function readArgValue(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'item';
}

function fileSha256(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

async function importPlaywright() {
  try {
    return await import('playwright');
  } catch {
    const siblingPlaywright = path.join(ROOT, '..', 'axolync-browser', 'node_modules', 'playwright', 'index.mjs');
    return import(pathToFileURL(siblingPlaywright).href);
  }
}

function readBundle(bundlePath) {
  const entries = unzipSync(fs.readFileSync(bundlePath));
  const manifest = JSON.parse(strFromU8(entries['manifest.json']));
  const themes = manifest.theme_bundle?.themes ?? [];
  if (!themes.length) {
    throw new Error(`No themes found in ${bundlePath}`);
  }
  return { entries, manifest, themes };
}

function orderedGlyphs(config, metadata) {
  return [...config.alphabet].map((char) => {
    const entry = Object.entries(metadata.letters).find(([, letter]) => letter.char === char);
    if (!entry) {
      throw new Error(`Missing Hebrew glyph QA reference id for glyph ${char}`);
    }
    const [id, letter] = entry;
    return { id, char: letter.char };
  });
}

function buildProofHtml({ bundlePath, bundleSha256, entries, glyphs, sampleWords, themes, title }) {
  const fontFaces = themes.map((theme) => {
    const fontBytes = entries[theme.font_paths[0]];
    if (!fontBytes) {
      throw new Error(`Missing font ${theme.font_paths[0]} in ${bundlePath}`);
    }
    return `
      @font-face {
        font-family: "${theme.font_family}";
        src: url("data:font/truetype;base64,${Buffer.from(fontBytes).toString('base64')}") format("truetype");
      }
    `;
  }).join('\n');

  const panels = themes.map((theme) => {
    const themeId = slugify(theme.id ?? theme.name);
    return `
      <section class="panel" data-theme-id="${themeId}" style="font-family: '${theme.font_family}', monospace">
        <h2>${theme.name}</h2>
        <div class="letter-grid" dir="rtl">
          ${glyphs.map((glyph) => `<span class="glyph-cell" data-glyph-id="${glyph.id}" data-char="${glyph.char}">${glyph.char}</span>`).join('\n')}
        </div>
        <div class="samples" dir="rtl">
          ${sampleWords.map((sample) => `<div class="sample" dir="rtl">${sample}</div>`).join('\n')}
        </div>
      </section>
    `;
  }).join('\n');

  return `<!doctype html>
  <html lang="he">
    <head>
      <meta charset="utf-8" />
      <style>
        ${fontFaces}
        body {
          margin: 0;
          padding: 28px;
          color: #dffefe;
          background: #02090d;
          font-family: "Courier New", monospace;
        }
        h1 {
          margin: 0 0 8px;
          font: 700 22px "Courier New", monospace;
          color: #ffffff;
        }
        .source {
          margin: 0 0 22px;
          color: #9eb7c9;
          font-size: 12px;
          overflow-wrap: anywhere;
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
        }
        .panel {
          min-height: 420px;
          padding: 22px;
          border: 1px solid rgba(106, 255, 246, 0.32);
          border-radius: 18px;
          background: linear-gradient(180deg, rgba(4, 32, 35, 0.92), rgba(2, 13, 18, 0.98));
          box-shadow: inset 0 0 32px rgba(70, 255, 246, 0.08), 0 18px 48px rgba(0, 0, 0, 0.38);
          overflow: hidden;
        }
        h2 {
          margin: 0 0 20px;
          color: #72ffff;
          font-size: 22px;
          letter-spacing: 0.03em;
        }
        .letter-grid {
          display: grid;
          grid-template-columns: repeat(9, 1fr);
          gap: 10px;
          margin: 0 0 22px;
          padding-bottom: 16px;
          border-bottom: 1px solid rgba(106, 255, 246, 0.18);
          direction: rtl;
        }
        .glyph-cell {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 58px;
          height: 68px;
          border: 1px solid rgba(106, 255, 246, 0.16);
          border-radius: 10px;
          background: rgba(0, 0, 0, 0.18);
          color: #dffefe;
          font-size: 46px;
          line-height: 1;
          text-align: center;
          text-shadow: 0 0 12px rgba(105, 255, 246, 0.36);
        }
        .samples {
          direction: rtl;
        }
        .sample {
          margin: 12px 0;
          font-size: 31px;
          line-height: 1.28;
          text-align: right;
          direction: rtl;
          text-shadow: 0 0 12px rgba(105, 255, 246, 0.36);
        }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      <p class="source">Rendered from bundle: ${bundlePath.replace(/\\/g, '/')}<br />SHA-256: ${bundleSha256}</p>
      <main class="grid">${panels}</main>
    </body>
  </html>`;
}

async function screenshotRequired(locator, outputPath, label) {
  const count = await locator.count();
  if (count !== 1) {
    throw new Error(`Expected exactly one ${label}, found ${count}`);
  }
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  await locator.screenshot({ path: outputPath });
}

const { config, metadata } = validateHebrewGlyphQaScaffold({
  configPath: path.resolve(readArgValue('--config') ?? DEFAULT_HEBREW_QA_CONFIG_PATH),
});
const glyphs = orderedGlyphs(config, metadata);
const sampleWords = config.rendering?.sample_words?.length ? config.rendering.sample_words : [
  'שלום חנוך - נגד הרוח',
  'הלוואי - בעז שרעבי',
  'אני ואתה נשנה את העולם',
  'ירושלים של זהב',
];

const bundlePath = path.resolve(ROOT, readArgValue('--bundle') ?? config.rendering?.bundle_path ?? path.join('artifacts', 'output', 'installable', 'retro-mode-bundle.zip'));
const outputDir = path.resolve(ROOT, readArgValue('--output-dir') ?? config.proof_output_dir);
const overviewPath = path.resolve(ROOT, readArgValue('--output') ?? path.join(outputDir, 'current-overview.png'));
const title = readArgValue('--title') ?? 'Retro Hebrew Runtime Bundle Proof';
const htmlOutputPath = overviewPath.replace(/\.png$/i, '.html');
const manifestPath = path.join(outputDir, 'hebrew-proof-manifest.json');
const bundleSha256 = fileSha256(bundlePath);

const { entries, manifest, themes } = readBundle(bundlePath);
const html = buildProofHtml({ bundlePath, bundleSha256, entries, glyphs, sampleWords, themes, title });
fs.mkdirSync(path.dirname(overviewPath), { recursive: true });
fs.writeFileSync(htmlOutputPath, html, 'utf8');

const proofManifest = {
  generatedAt: new Date().toISOString(),
  bundlePath: path.relative(REPO_ROOT, bundlePath).replace(/\\/g, '/'),
  bundleSha256,
  themeBundleId: manifest.theme_bundle?.id ?? null,
  overviewPng: path.relative(REPO_ROOT, overviewPath).replace(/\\/g, '/'),
  overviewHtml: path.relative(REPO_ROOT, htmlOutputPath).replace(/\\/g, '/'),
  themes: [],
};

const { chromium } = await importPlaywright();
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1160 }, deviceScaleFactor: 1 });
  await page.setContent(html, { waitUntil: 'networkidle' });
  await page.screenshot({ path: overviewPath, fullPage: true });

  for (const theme of themes) {
    const themeId = slugify(theme.id ?? theme.name);
    const themeDir = path.join(outputDir, themeId);
    const panelPng = path.join(themeDir, 'alphabet-and-samples.png');
    const samplesPng = path.join(themeDir, 'sample-lines.png');
    await screenshotRequired(page.locator(`[data-theme-id="${themeId}"]`), panelPng, `${themeId} panel`);
    await screenshotRequired(page.locator(`[data-theme-id="${themeId}"] .samples`), samplesPng, `${themeId} samples`);

    const glyphOutputs = [];
    for (const glyph of glyphs) {
      const glyphPng = path.join(themeDir, 'letters', `${glyph.id}.png`);
      await screenshotRequired(
        page.locator(`[data-theme-id="${themeId}"] [data-glyph-id="${glyph.id}"]`),
        glyphPng,
        `${themeId} ${glyph.id} glyph cell`,
      );
      glyphOutputs.push({
        id: glyph.id,
        char: glyph.char,
        png: path.relative(REPO_ROOT, glyphPng).replace(/\\/g, '/'),
      });
    }

    proofManifest.themes.push({
      id: theme.id ?? themeId,
      name: theme.name,
      fontFamily: theme.font_family,
      panelPng: path.relative(REPO_ROOT, panelPng).replace(/\\/g, '/'),
      samplesPng: path.relative(REPO_ROOT, samplesPng).replace(/\\/g, '/'),
      glyphs: glyphOutputs,
    });
  }
} finally {
  await browser.close();
}

fs.writeFileSync(manifestPath, `${JSON.stringify(proofManifest, null, 2)}\n`);
console.log(`Wrote Hebrew proof overview: ${overviewPath}`);
console.log(`Wrote Hebrew proof manifest: ${manifestPath}`);
