// Regenerate the README documentation screenshots (docs/screenshots/*.png).
// Same format as the originals: 390px logical width @2x, full-page, English,
// location "Prague". Weather APIs are mocked for a deterministic, data-rich UI.
// Run with the preview server up:  node scripts/gen-doc-screenshots.mjs
import { chromium } from 'playwright'

const EXEC = process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
const BASE = process.env.BASE_URL || 'http://localhost:4173/jz-weatherfusion/'
const OUT = new URL('../docs/screenshots/', import.meta.url).pathname

const SEED = {
  version: 1,
  locations: [{ id: 'prague', label: 'Prague', lat: 50.0755, lon: 14.4378, radiusKm: 10 }],
  activeLocationId: 'prague',
  apiKeys: { owm: 'a'.repeat(32), windy: '', tomorrow: '' },
  preferences: {
    language: 'en', theme: 'light', units: 'metric', iconSet: 'modern',
    windDisplay: 'combined', iqrFactor: 1.5, refreshIntervalMin: 30,
    fontSize: 'medium', windyKeyFree: true, apiKeyBannerDismissed: true,
    owmBannerDismissed: true,
  },
}

// Four physical stations within 10 km; one pressure is an outlier so the
// "outlier removed" annotation is exercised in the docs shot.
const OWM_BODY = JSON.stringify({
  list: [
    { id: 1, name: 'Prague-Karlín',    coord: { lat: 50.092, lon: 14.452 }, main: { temp: 18.2, humidity: 61, pressure: 1013 }, wind: { speed: 3.1, deg: 248 }, clouds: { all: 35 } },
    { id: 2, name: 'Prague-Smíchov',   coord: { lat: 50.071, lon: 14.404 }, main: { temp: 18.6, humidity: 59, pressure: 1014 }, wind: { speed: 3.4, deg: 252 }, clouds: { all: 42 } },
    { id: 3, name: 'Prague-Vinohrady', coord: { lat: 50.078, lon: 14.448 }, main: { temp: 18.9, humidity: 58, pressure: 1013 }, wind: { speed: 2.9, deg: 244 }, clouds: { all: 30 } },
    { id: 4, name: 'Prague-Žižkov',    coord: { lat: 50.087, lon: 14.450 }, main: { temp: 17.9, humidity: 63, pressure: 1006 }, wind: { speed: 3.6, deg: 255 }, clouds: { all: 45 } },
  ],
})
const OM_CURRENT = {
  best_match:    { temperature_2m: 18.4, relative_humidity_2m: 60, pressure_msl: 1013.4, wind_speed_10m: 3.2, wind_direction_10m: 250, cloud_cover: 38, precipitation: 0.1, uv_index: 4.1 },
  icon_seamless: { temperature_2m: 18.1, relative_humidity_2m: 62, pressure_msl: 1013.0, wind_speed_10m: 3.5, wind_direction_10m: 253, cloud_cover: 44, precipitation: 0.2, uv_index: 4.1 },
  ecmwf_ifs025:  { temperature_2m: 18.8, relative_humidity_2m: 58, pressure_msl: 1013.8, wind_speed_10m: 2.9, wind_direction_10m: 246, cloud_cover: 32, precipitation: 0.0, uv_index: 4.1 },
}
function omBody(model) {
  return JSON.stringify({ latitude: 50.08, longitude: 14.44, current: OM_CURRENT[model] ?? OM_CURRENT.best_match })
}

const TABS = ['aggregated', 'stations', 'sources']

async function clickTab(page, idx) {
  await page.evaluate((idx) => {
    for (const row of document.querySelectorAll('main > div')) {
      const btns = row.querySelectorAll(':scope > button')
      if (btns.length === 3) { btns[idx].click(); return }
    }
  }, idx)
}

const browser = await chromium.launch({ executablePath: EXEC })
try {
  for (const theme of ['light', 'dark']) {
    const ctx = await browser.newContext({
      viewport: { width: 390, height: 844 }, deviceScaleFactor: 2,
      isMobile: true, hasTouch: true, colorScheme: theme,
    })
    await ctx.route('**/api.open-meteo.com/**', (route) => {
      const m = new URL(route.request().url()).searchParams.get('models') || 'best_match'
      route.fulfill({ status: 200, contentType: 'application/json', body: omBody(m) })
    })
    await ctx.route('**/api.openweathermap.org/**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: OWM_BODY }))

    const page = await ctx.newPage()
    await page.addInitScript((cfg) => localStorage.setItem('pws:config', JSON.stringify(cfg)),
      { ...SEED, preferences: { ...SEED.preferences, theme } })
    await page.goto(BASE, { waitUntil: 'networkidle' }).catch(() => {})
    await page.waitForTimeout(2500)

    for (let i = 0; i < TABS.length; i++) {
      await clickTab(page, i)
      await page.waitForTimeout(500)
      const file = `${theme}-${TABS[i]}.png`
      await page.screenshot({ path: OUT + file, fullPage: true })
      console.log('wrote', file)
    }
    await ctx.close()
  }
} finally {
  await browser.close()
}
