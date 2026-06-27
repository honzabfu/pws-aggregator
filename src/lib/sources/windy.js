// src/lib/sources/windy.js
// Windy Point Forecast API v2 — single GFS model point, requires API key.
// POST https://api.windy.com/api/point-forecast/v2
// Units from API: temp in K, pressure in Pa, wind as u/v components in m/s.
// Returns time-series arrays; we pick the step closest to Date.now().

const BASE = 'https://api.windy.com/api/point-forecast/v2'

const PARAMS = [
  'temp', 'humidity', 'pressure',
  'wind_u', 'wind_v',
  'clouds_low', 'clouds_middle', 'clouds_high',
  'rain', 'uvindex',
]

/**
 * @param {number} lat
 * @param {number} lon
 * @param {string} apiKey
 * @returns {Promise<{ readings: StationReading[], errors: string[] }>}
 */
export async function fetchWindy(lat, lon, apiKey) {
  if (!apiKey) return { readings: [], errors: ['No Windy API key'] }

  let data
  try {
    const res = await fetch(BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lat:        Number(lat),
        lon:        Number(lon),
        model:      'gfs',
        parameters: PARAMS,
        levels:     ['surface'],
        key:        apiKey,
      }),
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`HTTP ${res.status}${text ? ': ' + text.slice(0, 120) : ''}`)
    }
    data = await res.json()
  } catch (e) {
    return { readings: [], errors: [`Windy: ${e.message}`] }
  }

  const ts = data?.ts
  if (!Array.isArray(ts) || ts.length === 0) {
    return { readings: [], errors: ['Windy: missing time series'] }
  }

  // Pick the step whose timestamp is closest to now
  const now = Date.now()
  const idx = ts.reduce(
    (best, t, i) => Math.abs(t - now) < Math.abs(ts[best] - now) ? i : best,
    0,
  )

  const get = (param) => {
    const arr = data[`${param}-surface`]
    if (!Array.isArray(arr)) return null
    const v = arr[idx]
    return v != null && isFinite(v) ? v : null
  }

  // Temperature: K → °C
  const tempK = get('temp')

  // Pressure: Pa → hPa
  const pressurePa = get('pressure')

  // Wind: u/v components → speed + meteorological direction
  const u = get('wind_u')
  const v = get('wind_v')
  const windSpeed = (u != null && v != null) ? Math.hypot(u, v) : null
  const windDeg   = (u != null && v != null)
    ? (Math.atan2(-u, -v) * 180 / Math.PI + 360) % 360
    : null

  // Total cloud cover from three layers (probability-union formula)
  const cl = get('clouds_low')
  const cm = get('clouds_middle')
  const ch = get('clouds_high')
  const clouds = (cl != null || cm != null || ch != null)
    ? Math.round(100 * (1 - (1 - (cl ?? 0) / 100) * (1 - (cm ?? 0) / 100) * (1 - (ch ?? 0) / 100)))
    : null

  return {
    readings: [{
      stationId:   'windy-gfs',
      stationName: 'Windy (GFS)',
      source:      'windy',
      fetchedAt:   new Date().toISOString(),
      lat:         Number(lat),
      lon:         Number(lon),
      metrics: {
        temp:      tempK      != null ? tempK - 273.15 : null,
        humidity:  get('humidity'),
        pressure:  pressurePa != null ? pressurePa / 100 : null,
        windSpeed,
        windDeg,
        clouds,
        precip:    get('rain'),
        uvIndex:   get('uvindex'),
      },
    }],
    errors: [],
  }
}

export const WINDY_META = {
  key:         'windy',
  label:       'Windy',
  requiresKey: true,
  keyUrl:      'https://api.windy.com/point-forecast',
  keyHint:     'Free tier available — Point Forecast API',
  keyPattern:  /^[A-Za-z0-9]{32,}$/,
}
