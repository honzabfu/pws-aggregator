# CLAUDE.md — JZ WeatherFusion

Personal Weather Station aggregator. Client-only React + Vite PWA, deployed to GitHub Pages. No backend — all config (API keys, locations) lives in browser LocalStorage and is sent only to the respective weather APIs.

**Live:** https://honzabfu.github.io/jz-weatherfusion/

## Commands
- `npm run dev` — dev server at http://localhost:5173/jz-weatherfusion/
- `npm run build` — output to `dist/`
- `npm run preview` — preview built output

No test runner or linter is configured.

## Architecture
- **Entry:** [src/main.jsx](src/main.jsx) → [src/App.jsx](src/App.jsx). App is a single component with 3 tabs (aggregated / stations / sources).
- **State via hooks:**
  - [src/hooks/useConfig.js](src/hooks/useConfig.js) — config persisted to LocalStorage (`pws:config`).
  - [src/hooks/useWeather.js](src/hooks/useWeather.js) — fetch orchestration, source status, debug log, auto-refresh timer.
  - [src/hooks/useTheme.js](src/hooks/useTheme.js) — light/dark/system.
- **Sources:** [src/lib/sources/](src/lib/sources/) — each exports `fetch<Source>()` returning `{ readings, errors }` and a `*_META` object.
  - `openmeteo.js` — no key, fetches 3 NWP models (best_match, ICON, ECMWF) in parallel.
  - `owm.js` — requires key, `/find` endpoint, filters stations by haversine-ish distance vs `radiusKm`.
  - `tomorrow.js` — requires key, Tomorrow.io realtime endpoint.
  - `windy.js` — requires key, Point Forecast POST (GFS model); converts K→°C, Pa→hPa, u/v→speed+dir; picks time-series step closest to now.
- **Aggregation:** [src/lib/aggregate.js](src/lib/aggregate.js) — IQR outlier filter per metric (factor default 1.5), arithmetic mean; wind direction uses circular mean (no IQR). Readings tagged `isOutlier` based on temp.
- **Geocoding:** [src/lib/geocode.js](src/lib/geocode.js) — `searchPlaces(query, lang, count, signal)` against Open-Meteo's free geocoding API (no key). Used by [LocationModal](src/components/LocationModal.jsx) so users can search by place name instead of entering coordinates; manual lat/lon entry remains available.
- **Units:** [src/lib/units.js](src/lib/units.js) — **internal values are always SI (°C, hPa, m/s, mm/h); convert only at display time.** Includes Beaufort scale and localized wind-direction labels.
- **i18n:** [src/lib/i18n.js](src/lib/i18n.js) — `en` / `cs` / `es`, default export `strings`, named `t(lang, key)`.

## Data shape
A `StationReading` is `{ stationId, stationName, source, fetchedAt, [lat, lon], metrics }` where `metrics` = `{ temp, humidity, pressure, windSpeed, windDeg, clouds, precip, uvIndex }` (SI, `null` if unavailable). Adding a source = produce this shape and wire it into `useWeather`.

## Conventions
- React 18, function components + hooks. No TypeScript (JSDoc typedefs only).
- Styling is inline `style={}` objects + CSS custom properties from [src/styles/tokens.css](src/styles/tokens.css). No CSS framework.
- `base: '/jz-weatherfusion/'` in [vite.config.js](vite.config.js) — keep asset paths relative.

## Deploy
Single source of truth: [.github/workflows/deploy.yml](.github/workflows/deploy.yml) — GitHub Actions builds with `npm run build` and publishes `dist/` to Pages on push to `main`.

## Implemented sources
- `open-meteo` — 3 NWP models (best_match, ICON, ECMWF), UV index, sea-level pressure. No key.
- `owm` — OpenWeatherMap physical stations in radius. Requires key.
- `tomorrow` — Tomorrow.io realtime point forecast. Requires key.
- `windy` — Windy Point Forecast API v2, GFS model. Requires key. Note: free-tier key triggers CORS on direct browser requests; app tags these readings as approximate (`isApprox`).

## Known gaps / caveats
- `uvIndex` outside Open-Meteo: OWM `/find` cannot supply it; Windy's `uvindex` surface field is present but may be null outside daylight hours.
- Open-Meteo returns one UV value shared across all 3 models (same source field).
- Windy free-tier CORS: the API does not send CORS headers for free keys, so the fetch may fail in-browser depending on the browser's handling of cross-origin errors.
- Windy GFS data (temp, wind) can differ significantly from physical station observations — expected for a coarse 0.25° NWP model. Data are marked approximate (≈) and excluded from aggregate.

## TODO / next session
- **Windy timestamp unit** — `windy.js` contains a temporary `console.log('[Windy] ...')` that prints `ts[0]` and `ts[idx]` interpreted as both milliseconds and seconds. Open DevTools Console, reload Windy data, read the log line and determine which `as-ms` / `as-s` value is the sensible date. Then: remove the log, and set `const now = Date.now()` (if ts is ms) or keep `/ 1000` (if ts is seconds). The fix landed in commit `8f05c6e` on branch `claude/data-consistency-check-ki9xwu`.
