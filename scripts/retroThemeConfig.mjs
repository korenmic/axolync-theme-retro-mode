export const RETRO_THEME_FAMILY_ID = 'retro-mode';
export const RETRO_BUNDLE_ID = 'retro-mode-bundle';
export const RETRO_BUNDLE_NAME = 'Retro Mode Theme Bundle';
export const RETRO_BUNDLE_VERSION = '0.1.0';

export const RETRO_THEMES = [
  {
    id: 'retro-red-led',
    name: 'Retro Red LED',
    familyId: RETRO_THEME_FAMILY_ID,
    visualDirection: 'segmented-red-led',
    stylesheetPath: 'themes/retro-red-led/theme.css',
    assetRoot: 'themes/retro-red-led/assets',
    fontFamily: 'Axolync Retro Red LED',
  },
  {
    id: 'retro-cyan-vfd',
    name: 'Retro Cyan VFD',
    familyId: RETRO_THEME_FAMILY_ID,
    visualDirection: 'segmented-cyan-vfd',
    stylesheetPath: 'themes/retro-cyan-vfd/theme.css',
    assetRoot: 'themes/retro-cyan-vfd/assets',
    fontFamily: 'Axolync Retro Cyan VFD',
  },
  {
    id: 'retro-arcade-crt',
    name: 'Retro Arcade CRT',
    familyId: RETRO_THEME_FAMILY_ID,
    visualDirection: 'arcade-crt',
    stylesheetPath: 'themes/retro-arcade-crt/theme.css',
    assetRoot: 'themes/retro-arcade-crt/assets',
    fontFamily: 'Axolync Retro Arcade CRT',
  },
  {
    id: 'retro-cockpit-hud',
    name: 'Retro Cockpit HUD',
    familyId: RETRO_THEME_FAMILY_ID,
    visualDirection: 'cockpit-hud',
    stylesheetPath: 'themes/retro-cockpit-hud/theme.css',
    assetRoot: 'themes/retro-cockpit-hud/assets',
    fontFamily: 'Axolync Retro Cockpit HUD',
  },
];
