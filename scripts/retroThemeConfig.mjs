export const RETRO_THEME_FAMILY_ID = 'retro-mode';
export const RETRO_BUNDLE_ID = 'retro-mode-bundle';
export const RETRO_BUNDLE_NAME = 'Retro Mode Theme Bundle';
export const RETRO_BUNDLE_VERSION = '0.1.0';
export const RETRO_THEME_VERSION = '0.1.0';
export const RETRO_BUNDLE_CONTRACTS_VERSION = '2.0.0';
export const RETRO_SUPPORTED_PLATFORMS = ['web', 'android', 'desktop', 'ios'];

export const RETRO_THEMES = [
  {
    id: 'retro-red-led',
    name: 'Retro Red LED',
    familyId: RETRO_THEME_FAMILY_ID,
    visualDirection: 'segmented-red-led',
    description: 'A deep red segmented-display theme with dashboard glow and scanline-rich karaoke contrast.',
    version: RETRO_THEME_VERSION,
    stylesheetPath: 'themes/retro-red-led/theme.css',
    assetRoot: 'themes/retro-red-led/assets',
    assetSlotPaths: {
      'app-shell-backdrop': 'themes/retro-red-led/assets/app-shell-backdrop.svg',
      'hero-brand-mark': 'themes/retro-red-led/assets/hero-brand-mark.svg',
    },
    fontPath: 'themes/retro-red-led/fonts/retro-red-led.ttf',
    fontFamily: 'Axolync Retro Red LED',
  },
  {
    id: 'retro-cyan-vfd',
    name: 'Retro Cyan VFD',
    familyId: RETRO_THEME_FAMILY_ID,
    visualDirection: 'segmented-cyan-vfd',
    description: 'A cool vacuum-fluorescent display theme with bright cyan glow and thin segmented chrome.',
    version: RETRO_THEME_VERSION,
    stylesheetPath: 'themes/retro-cyan-vfd/theme.css',
    assetRoot: 'themes/retro-cyan-vfd/assets',
    assetSlotPaths: {
      'app-shell-backdrop': 'themes/retro-cyan-vfd/assets/app-shell-backdrop.svg',
      'hero-brand-mark': 'themes/retro-cyan-vfd/assets/hero-brand-mark.svg',
    },
    fontPath: 'themes/retro-cyan-vfd/fonts/retro-cyan-vfd.ttf',
    fontFamily: 'Axolync Retro Cyan VFD',
  },
  {
    id: 'retro-arcade-crt',
    name: 'Retro Arcade CRT',
    familyId: RETRO_THEME_FAMILY_ID,
    visualDirection: 'arcade-crt',
    description: 'An arcade cabinet theme with pixel UI chrome, starfield backdrop, and CRT glow.',
    version: RETRO_THEME_VERSION,
    stylesheetPath: 'themes/retro-arcade-crt/theme.css',
    assetRoot: 'themes/retro-arcade-crt/assets',
    assetSlotPaths: {
      'app-shell-backdrop': 'themes/retro-arcade-crt/assets/app-shell-backdrop.svg',
      'hero-brand-mark': 'themes/retro-arcade-crt/assets/hero-brand-mark.svg',
    },
    fontPath: 'themes/retro-arcade-crt/fonts/retro-arcade-crt.ttf',
    fontFamily: 'Axolync Retro Arcade CRT',
  },
  {
    id: 'retro-cockpit-hud',
    name: 'Retro Cockpit HUD',
    familyId: RETRO_THEME_FAMILY_ID,
    visualDirection: 'cockpit-hud',
    description: 'A cockpit-inspired HUD theme with instrument-panel framing and luminous cyan emphasis.',
    version: RETRO_THEME_VERSION,
    stylesheetPath: 'themes/retro-cockpit-hud/theme.css',
    assetRoot: 'themes/retro-cockpit-hud/assets',
    assetSlotPaths: {
      'app-shell-backdrop': 'themes/retro-cockpit-hud/assets/app-shell-backdrop.svg',
      'hero-brand-mark': 'themes/retro-cockpit-hud/assets/hero-brand-mark.svg',
    },
    fontPath: 'themes/retro-cockpit-hud/fonts/retro-cockpit-hud.ttf',
    fontFamily: 'Axolync Retro Cockpit HUD',
  },
];
