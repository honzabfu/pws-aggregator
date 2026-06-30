// Cross-platform / responsive display verification for JZ WeatherFusion.
// Drives the built app (vite preview) through a matrix of viewports, device
// profiles and themes, screenshots each tab and asserts there is no unexpected
// horizontal overflow or off-screen content. Chromium-only (the engine bundled
// in this environment); non-Chromium engines are emulated via device profiles.
import { chromium, devices } from 'playwright'
import { mkdirSync } from 'node:fs'
import { writeFileSync } from 'node:fs'

const BASE = process.env.BASE_URL || 'http://localhost:4173/jz-weatherfusion/'
const OUT = new URL('../docs/verification/', import.meta.url).pathname
mkdirSync(OUT, { recursive: true })

// A seeded location so we exercise the full data UI. A mock OWM key is seeded so
// the station-preference path and the populated stations table are exercised too;
// all network is intercepted (see route mocks below), so no real key is used.
const SEED_CONFIG = {
  version: 1,
  locations: [{ id: 'verify-prague', label: 'Praha', lat: 50.0755, lon: 14.4378, radiusKm: 30 }],
  activeLocationId: 'verify-prague',
  apiKeys: { owm: 'a'.repeat(32), windy: '', tomorrow: '' },
  preferences: {
    language: 'cs', theme: 'system', units: 'metric', iconSet: 'modern',
    windDisplay: 'combined', iqrFactor: 1.5, refreshIntervalMin: 30,
    fontSize: 'medium', windyKeyFree: true, apiKeyBannerDismissed: true,
    owmBannerDismissed: true,
  },
}

// Matrix of (name, width, height, deviceScaleFactor, isMobile, ua-profile).
// "profile" documents the real-world target each row stands in for.
const VIEWPORTS = [
  { name: 'mobile-320-small',     width: 320,  height: 568,  dsf: 2, mobile: true,  profile: 'iPhone SE (1st gen) — smallest common phone' },
  { name: 'mobile-375-iphonese',  width: 375,  height: 667,  dsf: 2, mobile: true,  profile: 'iPhone SE2 / iPhone 8' },
  { name: 'mobile-390-iphone13',  width: 390,  height: 844,  dsf: 3, mobile: true,  profile: 'iPhone 12/13/14' },
  { name: 'mobile-412-android',   width: 412,  height: 915,  dsf: 2.6, mobile: true, profile: 'Pixel 7 / typical Android' },
  { name: 'tablet-768-portrait',  width: 768,  height: 1024, dsf: 2, mobile: true,  profile: 'iPad portrait' },
  { name: 'tablet-1024-landscape',width: 1024, height: 768,  dsf: 2, mobile: true,  profile: 'iPad landscape' },
  { name: 'desktop-1280',         width: 1280, height: 800,  dsf: 1, mobile: false, profile: 'Laptop' },
  { name: 'desktop-1920',         width: 1920, height: 1080, dsf: 1, mobile: false, profile: 'Full-HD desktop' },
]

const THEMES = ['light', 'dark']
const TABS = ['aggregated', 'stations', 'sources']

// ── Network fixtures ──────────────────────────────────────────────────────────
// The in-browser fetch can't reach the live APIs in this sandbox, and we want a
// deterministic, data-rich UI to verify layout against. Intercept both sources.
const OM_CURRENT = {
  best_match:    { temperature_2m: 21.4, relative_humidity_2m: 58, pressure_msl: 1014.2, wind_speed_10m: 3.6, wind_direction_10m: 245, cloud_cover: 40, precipitation: 0.0, uv_index: 4.2 },
  icon_seamless: { temperature_2m: 20.9, relative_humidity_2m: 61, pressure_msl: 1013.8, wind_speed_10m: 4.1, wind_direction_10m: 250, cloud_cover: 55, precipitation: 0.1, uv_index: 4.2 },
  ecmwf_ifs025:  { temperature_2m: 22.0, relative_humidity_2m: 55, pressure_msl: 1014.6, wind_speed_10m: 3.2, wind_direction_10m: 238, cloud_cover: 30, precipitation: 0.0, uv_index: 4.2 },
}
function openMeteoBody(model) {
  return JSON.stringify({ latitude: 50.08, longitude: 14.44, current: OM_CURRENT[model] ?? OM_CURRENT.best_match })
}
const OWM_BODY = JSON.stringify({
  list: [
    { id: 101, name: 'Praha-Karlín',    coord: { lat: 50.092, lon: 14.452 }, main: { temp: 21.7, humidity: 57, pressure: 1014 }, wind: { speed: 3.4, deg: 242 }, clouds: { all: 38 } },
    { id: 102, name: 'Praha-Smíchov',   coord: { lat: 50.071, lon: 14.404 }, main: { temp: 21.1, humidity: 60, pressure: 1014 }, wind: { speed: 3.9, deg: 248 }, clouds: { all: 45 } },
    { id: 103, name: 'Praha-Vinohrady', coord: { lat: 50.078, lon: 14.448 }, main: { temp: 22.3, humidity: 54, pressure: 1013 }, wind: { speed: 3.1, deg: 235 }, clouds: { all: 33 } },
  ],
})

async function installMocks(context) {
  await context.route('**/api.open-meteo.com/**', (route) => {
    const m = new URL(route.request().url()).searchParams.get('models') || 'best_match'
    route.fulfill({ status: 200, contentType: 'application/json', body: openMeteoBody(m) })
  })
  await context.route('**/api.openweathermap.org/**', (route) => {
    route.fulfill({ status: 200, contentType: 'application/json', body: OWM_BODY })
  })
}

const results = []

async function setThemeAndTab(page, theme, tab) {
  // Force theme deterministically via the persisted config + matchMedia override.
  await page.emulateMedia({ colorScheme: theme })
  await page.evaluate(({ theme, tab }) => {
    const cfg = JSON.parse(localStorage.getItem('pws:config'))
    cfg.preferences.theme = theme
    localStorage.setItem('pws:config', JSON.stringify(cfg))
  }, { theme, tab })
}

async function clickTab(page, tab) {
  // Tab buttons are labelled by i18n; click by position in the tab bar instead.
  const idx = TABS.indexOf(tab)
  const buttons = page.locator('main > div').first()
  // Fall back to text-agnostic: the tab bar is the row of 3 buttons.
  await page.evaluate((idx) => {
    const bars = [...document.querySelectorAll('main button')]
    // The tab bar buttons are the three siblings inside the flex row with 3 children.
    const rows = [...document.querySelectorAll('main > div')]
    for (const row of rows) {
      const btns = row.querySelectorAll(':scope > button')
      if (btns.length === 3) { btns[idx].click(); return }
    }
  }, idx)
}

// The bundled Playwright build expects a browser revision that isn't present;
// point at the Chromium pre-installed in this environment instead.
const EXEC = process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
const browser = await chromium.launch({ executablePath: EXEC })

try {
  // First load once to establish origin so we can seed localStorage.
  for (const vp of VIEWPORTS) {
    for (const theme of THEMES) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: vp.dsf,
        isMobile: vp.mobile,
        hasTouch: vp.mobile,
        colorScheme: theme,
      })
      await installMocks(context)
      const page = await context.newPage()
      // Seed config before the app boots.
      await page.addInitScript((cfg) => {
        localStorage.setItem('pws:config', JSON.stringify(cfg))
      }, { ...SEED_CONFIG, preferences: { ...SEED_CONFIG.preferences, theme } })

      await page.goto(BASE, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {})
      // Give React + the weather fetch a moment to settle.
      await page.waitForTimeout(2500)

      for (const tab of TABS) {
        await clickTab(page, tab)
        await page.waitForTimeout(600)

        // Overflow check: does the document scroll horizontally beyond the viewport?
        const metrics = await page.evaluate(() => {
          const de = document.documentElement
          const scrollW = Math.max(de.scrollWidth, document.body.scrollWidth)
          const clientW = de.clientWidth
          // Find elements whose right edge exceeds the viewport (real overflow culprits).
          const offenders = []
          const vw = window.innerWidth
          for (const el of document.querySelectorAll('body *')) {
            const r = el.getBoundingClientRect()
            if (r.width > 0 && r.right > vw + 1) {
              offenders.push({
                tag: el.tagName.toLowerCase(),
                cls: (el.className || '').toString().slice(0, 40),
                right: Math.round(r.right),
              })
            }
          }
          return { scrollW, clientW, vw, overflowX: scrollW - clientW, offenders: offenders.slice(0, 5) }
        })

        const file = `${vp.name}__${theme}__${tab}.png`
        await page.screenshot({ path: OUT + file, fullPage: true })

        const horizOverflow = metrics.overflowX > 1
        results.push({
          viewport: vp.name, profile: vp.profile, size: `${vp.width}x${vp.height}`,
          theme, tab, file,
          overflowX: metrics.overflowX,
          horizOverflow,
          offenders: metrics.offenders,
        })
        const flag = horizOverflow ? `⚠️  H-OVERFLOW ${metrics.overflowX}px` : 'ok'
        console.log(`${vp.name.padEnd(24)} ${theme.padEnd(5)} ${tab.padEnd(11)} ${flag}`)
      }
      await context.close()
    }
  }
} finally {
  await browser.close()
}

writeFileSync(OUT + 'results.json', JSON.stringify(results, null, 2))

const overflows = results.filter(r => r.horizOverflow)
console.log('\n=== SUMMARY ===')
console.log(`Total checks: ${results.length}`)
console.log(`Horizontal-overflow failures: ${overflows.length}`)
for (const o of overflows) {
  console.log(`  ${o.viewport} / ${o.theme} / ${o.tab}: +${o.overflowX}px`, JSON.stringify(o.offenders))
}
