# CLAUDE.md — PWS Aggregator

Personal Weather Station aggregator. Client-only React + Vite PWA, deployed to GitHub Pages. No backend — all config (API keys, locations) lives in browser LocalStorage and is sent only to the respective weather APIs.

## Commands
- `npm run dev` — dev server at http://localhost:5173/pws-aggregator/
- `npm run build` — output to `dist/`
- `npm run preview` — preview built output
- `npm run deploy` — build + push `dist/` to `gh-pages` branch (README method; see Deploy caveat below)

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
- **Aggregation:** [src/lib/aggregate.js](src/lib/aggregate.js) — IQR outlier filter per metric (factor default 1.5), arithmetic mean; wind direction uses circular mean (no IQR). Readings tagged `isOutlier` based on temp.
- **Geocoding:** [src/lib/geocode.js](src/lib/geocode.js) — `searchPlaces(query, lang, count, signal)` against Open-Meteo's free geocoding API (no key). Used by [LocationModal](src/components/LocationModal.jsx) so users can search by place name instead of entering coordinates; manual lat/lon entry remains available.
- **Units:** [src/lib/units.js](src/lib/units.js) — **internal values are always SI (°C, hPa, m/s, mm/h); convert only at display time.** Includes Beaufort scale and localized wind-direction labels.
- **i18n:** [src/lib/i18n.js](src/lib/i18n.js) — `en` / `cs` / `es`, default export `strings`, named `t(lang, key)`.

## Data shape
A `StationReading` is `{ stationId, stationName, source, fetchedAt, [lat, lon], metrics }` where `metrics` = `{ temp, humidity, pressure, windSpeed, windDeg, clouds, precip, uvIndex }` (SI, `null` if unavailable). Adding a source = produce this shape and wire it into `useWeather`.

## Conventions
- React 18, function components + hooks. No TypeScript (JSDoc typedefs only).
- Styling is inline `style={}` objects + CSS custom properties from [src/styles/tokens.css](src/styles/tokens.css). No CSS framework.
- `base: '/pws-aggregator/'` in [vite.config.js](vite.config.js) — keep asset paths relative.

## Deploy
Single source of truth: [.github/workflows/deploy.yml](.github/workflows/deploy.yml) — GitHub Actions builds with `npm run build` and publishes `dist/` to Pages on push to `main`. (The old `static.yml`, which deployed the un-built repo root, was removed.)

## TODO / not yet implemented
- **Windy source** — the last advertised source still missing. `windy` apiKeys slot, Settings UI, and i18n labels already exist; only `src/lib/sources/windy.js` + the `useWeather` wiring remain. Step-by-step incl. Windy specifics (Point Forecast POST, time-series, K/Pa/u-v unit conversions, CORS caveat): [docs/adding-a-data-source.md](docs/adding-a-data-source.md). Implement like the now-done Tomorrow.io source.

## Done sources
- `open-meteo` (3 models, UV, sea-level pressure), `owm` (live-tested), `tomorrow` (Tomorrow.io realtime).

## Known gaps / caveats
- `uvIndex` is populated only by Open-Meteo (`uv_index` in the current endpoint); OWM `/find` cannot supply it. Open-Meteo returns one UV value per model, so all 3 models report the same figure.
