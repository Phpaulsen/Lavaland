// Browserwahl für die Browser-Tests. Standard ist Chromium (wie Chrome und Brave).
// BROWSER=firefox startet Firefox: Darin spielt das Kind (installierte App aus Firefox auf Android).
// Optional für Chromium: CHROMIUM=/pfad/zu/chrome
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pw = require('playwright');

export const FIREFOX = process.env.BROWSER === 'firefox';
export const NAME = FIREFOX ? 'firefox' : 'chromium';

export function launch() {
  if (FIREFOX) return pw.firefox.launch();
  return pw.chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
}

// Handy-Format für newContext. Firefox kennt in Playwright keinen isMobile-Modus: gleiche Größe, Pixeldichte und Touch, dazu eine Firefox-Kennung für Android.
export function phone() {
  const d = { ...pw.devices['Pixel 7'] };
  if (!FIREFOX) return d;
  delete d.isMobile;
  d.userAgent = 'Mozilla/5.0 (Android 14; Mobile; rv:142.0) Gecko/142.0 Firefox/142.0';
  return d;
}
