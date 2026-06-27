# PWS Aggregator

Personal Weather Station data aggregator — combines readings from multiple sources, applies IQR outlier filtering, and displays weighted averages.

**Live:** https://[your-username].github.io/pws-aggregator/

## Features

- **Multi-source aggregation** — Open-Meteo (3 NWP models, no key required) + OpenWeatherMap stations
- **IQR outlier filtering** — automatically removes readings from misplaced sensors
- **Beaufort scale** — wind display in m/s, km/h, mph, Beaufort, or combined
- **3 languages** — English, Czech, Spanish
- **Light / dark / system** theme
- **PWA** — installable, works offline (cached data)
- **LocalStorage** — API keys and locations persist locally, never sent to any server
- **Export / import** config as JSON

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:5173/pws-aggregator/

## Build & deploy

```bash
npm run build       # output in dist/
npm run deploy      # builds + pushes to gh-pages branch
```

First deploy setup:
```bash
# In your GitHub repo: Settings → Pages → Source: gh-pages branch
git remote add origin https://github.com/[user]/pws-aggregator.git
npm run deploy
```

## API keys (optional)

| Source | Free tier | Link |
|--------|-----------|------|
| Open-Meteo | ✅ No key needed | https://open-meteo.com |
| OpenWeatherMap | 60 req/min free | https://openweathermap.org/api |
| Windy | 500 req/day free | https://api.windy.com |
| Tomorrow.io | 500 req/day free | https://www.tomorrow.io |

Keys are stored in browser LocalStorage only — never transmitted to any server other than the respective weather API.

## Aggregation method

1. Collect readings from all enabled sources
2. Per metric: extract values, apply IQR filter (factor configurable 1.0–3.0)
3. Compute arithmetic mean of remaining values
4. Wind direction: circular mean (sin/cos averaging)
5. Tag outlier readings for display in Stations tab

## Tech stack

- React 18 + Vite
- CSS custom properties (no CSS framework)
- vite-plugin-pwa (Workbox)
- gh-pages for deployment
