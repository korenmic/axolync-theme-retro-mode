import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { strFromU8, unzipSync } from 'fflate';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const HEBREW_ALPHABET = 'אבגדהוזחטיכךלמםנןסעפףצץקרשת';
const HEBREW_SAMPLES = [
  'שלום חנוך - נגד הרוח',
  'הלוואי - בעז שרעבי',
  'אני ואתה נשנה את העולם',
  'ירושלים של זהב',
];

function readArgValue(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
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
  return { entries, themes };
}

function buildProofHtml({ bundlePath, entries, themes, title }) {
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

  const panels = themes.map((theme) => `
    <section class="panel" style="font-family: '${theme.font_family}', monospace">
      <h2>${theme.name}</h2>
      <div class="alphabet" dir="rtl">${HEBREW_ALPHABET}</div>
      ${HEBREW_SAMPLES.map((sample) => `<div class="sample" dir="rtl">${sample}</div>`).join('\n')}
    </section>
  `).join('\n');

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
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
        }
        .panel {
          min-height: 300px;
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
        .alphabet {
          margin: 0 0 22px;
          padding-bottom: 16px;
          border-bottom: 1px solid rgba(106, 255, 246, 0.18);
          font-size: 35px;
          line-height: 1.35;
          letter-spacing: 0.02em;
          text-align: right;
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
      <p class="source">Rendered from bundle: ${bundlePath.replace(/\\/g, '/')}</p>
      <main class="grid">${panels}</main>
    </body>
  </html>`;
}

const bundlePath = path.resolve(ROOT, readArgValue('--bundle') ?? path.join('artifacts', 'output', 'installable', 'retro-mode-bundle.zip'));
const outputPath = path.resolve(ROOT, readArgValue('--output') ?? path.join('artifacts', 'output', 'hebrew-proof-runtime-bundle.png'));
const title = readArgValue('--title') ?? 'Retro Hebrew Runtime Bundle Proof';
const htmlOutputPath = outputPath.replace(/\.png$/i, '.html');

const { entries, themes } = readBundle(bundlePath);
const html = buildProofHtml({ bundlePath, entries, themes, title });
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(htmlOutputPath, html, 'utf8');

const { chromium } = await importPlaywright();
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 980 }, deviceScaleFactor: 1 });
  await page.setContent(html, { waitUntil: 'networkidle' });
  await page.screenshot({ path: outputPath, fullPage: true });
} finally {
  await browser.close();
}

console.log(`Wrote ${outputPath}`);
