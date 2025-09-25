const { chromium, firefox, webkit } = require('playwright');

let stealthChromium;

const TRUE_VALUES = new Set(['1', 'true', 'yes', 'on']);

function parseBoolean(value, fallback = false) {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return value !== 0;
  }

  if (typeof value === 'string') {
    return TRUE_VALUES.has(value.trim().toLowerCase());
  }

  return fallback;
}

function getDefaultStealthMode() {
  const envValue = process.env.DEFAULT_STEALTH_MODE ?? process.env.STEALTH_MODE;
  return parseBoolean(envValue, false);
}

function getStealthChromium() {
  if (!stealthChromium) {
    const { chromium: extraChromium } = require('playwright-extra');
    const StealthPlugin = require('puppeteer-extra-plugin-stealth');

    extraChromium.use(StealthPlugin());
    stealthChromium = extraChromium;

    console.log('🕵️  Stealth mode enabled for Chromium sessions');
  }

  return stealthChromium;
}

function getBrowserEngine(browserName = 'chromium', { useStealth } = {}) {
  const normalizedName = String(browserName).toLowerCase();
  const stealthRequested = parseBoolean(useStealth, false);

  if (normalizedName === 'firefox') {
    if (stealthRequested) {
      console.warn('⚠️  Stealth mode requested for Firefox, but it is only supported for Chromium. Falling back to standard Firefox.');
    }

    return {
      name: 'firefox',
      engine: firefox,
      stealth: false
    };
  }

  if (normalizedName === 'webkit') {
    if (stealthRequested) {
      console.warn('⚠️  Stealth mode requested for WebKit, but it is only supported for Chromium. Falling back to standard WebKit.');
    }

    return {
      name: 'webkit',
      engine: webkit,
      stealth: false
    };
  }

  const stealthEnabled = stealthRequested;

  return {
    name: 'chromium',
    engine: stealthEnabled ? getStealthChromium() : chromium,
    stealth: stealthEnabled
  };
}

module.exports = {
  getBrowserEngine,
  getDefaultStealthMode,
  parseBoolean
};
