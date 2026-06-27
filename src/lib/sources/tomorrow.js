// src/lib/sources/tomorrow.js
// Tomorrow.io Realtime Weather — single model point, requires API key.
// https://docs.tomorrow.io/reference/realtime-weather
// With units=metric the provider already returns SI: °C, hPa, m/s, mm/h.

const BASE = 'https://api.tomorrow.io/v4/weather/realtime'

/**
 * @param {number} lat
 * @param {number} lon
 * @param {string} apiKey
 * @returns {Promise<{ readings: StationReading[], errors: string[] }>}
 */
export async function fetchTomorrow(lat, lon, apiKey) {
  if (!apiKey) return { readings: [], errors: ['No Tomorrow.io API key'] }

  const url = `${BASE}?location=${lat},${lon}&units=metric&apikey=${apiKey}`

  let data
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    data = await res.json()
  } catch (e) {
    return { readings: [], errors: [`Tomorrow.io fetch: ${e.message}`] }
  }

  const v = data?.data?.values
  if (!v) return { readings: [], errors: ['Tomorrow.io: no current data'] }

  // Realtime exposes per-type intensities (mm/h); fall back across them.
  const precip = v.precipitationIntensity
    ?? v.rainIntensity
    ?? v.snowIntensity
    ?? null

  const reading = {
    stationId:   'tomorrow-io',
    stationName: 'Tomorrow.io',
    source:      'tomorrow',
    fetchedAt:   new Date().toISOString(),
    lat:         data?.location?.lat ?? Number(lat),
    lon:         data?.location?.lon ?? Number(lon),
    metrics: {
      temp:      v.temperature          ?? null,
      humidity:  v.humidity             ?? null,
      pressure:  v.pressureSurfaceLevel ?? null,
      windSpeed: v.windSpeed            ?? null,
      windDeg:   v.windDirection        ?? null,
      clouds:    v.cloudCover           ?? null,
      precip,
      uvIndex:   v.uvIndex              ?? null,
    },
  }

  return { readings: [reading], errors: [] }
}

export const TOMORROW_META = {
  key:         'tomorrow',
  label:       'Tomorrow.io',
  requiresKey: true,
  keyUrl:      'https://www.tomorrow.io',
  keyHint:     'Free tier: 500 req/day',
  keyPattern:  /^[A-Za-z0-9]{32,}$/,
}
