import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { RETRO_BUNDLE_ID } from './retroThemeConfig.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const outputDir = path.join(ROOT, 'artifacts', 'output', 'installable');
fs.mkdirSync(outputDir, { recursive: true });

const placeholderPath = path.join(outputDir, `${RETRO_BUNDLE_ID}.placeholder.txt`);
fs.writeFileSync(
  placeholderPath,
  'Bundle generation placeholder. Task 4 replaces this with the real theme-only retro bundle ZIP.\n',
  'utf8',
);
