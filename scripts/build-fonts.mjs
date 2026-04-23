import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { RETRO_THEMES } from './retroThemeConfig.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

for (const theme of RETRO_THEMES) {
  const outputDir = path.join(ROOT, 'artifacts', 'output', 'fonts', theme.id);
  fs.mkdirSync(outputDir, { recursive: true });
  const placeholderPath = path.join(outputDir, 'README.txt');
  if (!fs.existsSync(placeholderPath)) {
    fs.writeFileSync(
      placeholderPath,
      `Font generation placeholder for ${theme.id}. Task 2 replaces this with real generated font assets.\n`,
      'utf8',
    );
  }
}
