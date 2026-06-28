// src/lib/units.js
// All internal values are SI: °C, hPa, m/s, mm/h
// Conversion happens only at display time

// ── Beaufort ──────────────────────────────────────────────────────────────────
const BEAUFORT_THRESHOLDS = [0.3, 1.6, 3.4, 5.5, 8.0, 10.8, 13.9, 17.2, 20.8, 24.5, 28.5, 32.7]

export function msToBeaufort(ms) {
  if (ms === null || ms === undefined) return null
  for (let i = 0; i < BEAUFORT_THRESHOLDS.length; i++) {
    if (ms < BEAUFORT_THRESHOLDS[i]) return i
  }
  return 12
}

// ── Temperature ───────────────────────────────────────────────────────────────
export function displayTemp(celsius, units) {
  if (celsius === null || celsius === undefined) return { value: null, unit: units === 'imperial' ? '°F' : '°C' }
  if (units === 'imperial') {
    return { value: round(celsius * 9 / 5 + 32, 1), unit: '°F' }
  }
  return { value: round(celsius, 1), unit: '°C' }
}

// ── Pressure ──────────────────────────────────────────────────────────────────
export function displayPressure(hpa, units) {
  if (hpa === null || hpa === undefined) return { value: null, unit: units === 'imperial' ? 'inHg' : 'hPa' }
  if (units === 'imperial') {
    return { value: round(hpa * 0.02953, 2), unit: 'inHg' }
  }
  return { value: round(hpa, 1), unit: 'hPa' }
}

// ── Wind speed ────────────────────────────────────────────────────────────────
export function displayWind(ms, windMode, lang, i18nStrings) {
  if (ms === null || ms === undefined) {
    return { value: null, unit: '', beaufort: null, label: '' }
  }

  const bft = msToBeaufort(ms)
  const bftLabel = i18nStrings?.beaufort?.[bft] ?? ''

  switch (windMode) {
    case 'mph':
      return { value: round(ms * 2.23694, 1), unit: 'mph', beaufort: bft, label: bftLabel }
    case 'kmh':
      return { value: round(ms * 3.6, 1), unit: 'km/h', beaufort: bft, label: bftLabel }
    case 'beaufort':
      return { value: bft, unit: 'Bft', beaufort: bft, label: bftLabel }
    case 'combined':
      return { value: round(ms, 1), unit: 'm/s', beaufort: bft, label: bftLabel, combined: true }
    case 'ms':
    default:
      return { value: round(ms, 1), unit: 'm/s', beaufort: bft, label: bftLabel }
  }
}

// ── Precipitation ─────────────────────────────────────────────────────────────
export function displayPrecip(mmh, units) {
  if (mmh === null || mmh === undefined) return { value: null, unit: units === 'imperial' ? 'in/h' : 'mm/h' }
  if (units === 'imperial') {
    return { value: round(mmh / 25.4, 3), unit: 'in/h' }
  }
  return { value: round(mmh, 2), unit: 'mm/h' }
}

// ── Wind direction ────────────────────────────────────────────────────────────
const DIRS_EN = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW']
const DIRS_CS = ['S','SSV','SV','VSV','V','VJV','JV','JJV','J','JJZ','JZ','ZJZ','Z','ZSZ','SZ','SSZ']
const DIRS_ES = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSO','SO','OSO','O','ONO','NO','NNO']

export function windDirLabel(deg, lang = 'en') {
  if (deg === null || deg === undefined) return '—'
  const dirs = lang === 'cs' ? DIRS_CS : lang === 'es' ? DIRS_ES : DIRS_EN
  return dirs[Math.round(deg / 22.5) % 16]
}

// ── Distance ──────────────────────────────────────────────────────────────────
// Great-circle distance between two coordinates, in kilometres (SI internal).
export function haversineKm(lat1, lon1, lat2, lon2) {
  if ([lat1, lon1, lat2, lon2].some(v => v === null || v === undefined || isNaN(v))) return null
  const R = 6371
  const toRad = d => d * Math.PI / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function displayDistance(km, units) {
  if (km === null || km === undefined) return { value: null, unit: units === 'imperial' ? 'mi' : 'km' }
  if (units === 'imperial') {
    const mi = km * 0.621371
    return { value: round(mi, mi < 10 ? 1 : 0), unit: 'mi' }
  }
  return { value: round(km, km < 10 ? 1 : 0), unit: 'km' }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function round(v, d) {
  if (v === null || v === undefined || isNaN(v)) return null
  return +v.toFixed(d)
}
