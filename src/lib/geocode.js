// src/lib/geocode.js
// Open-Meteo geocoding — free, no API key required.
// https://open-meteo.com/en/docs/geocoding-api

const BASE = 'https://geocoding-api.open-meteo.com/v1/search'
const REVERSE_BASE = 'https://api.bigdatacloud.net/data/reverse-geocode-client'

// ISO 3166-1 alpha-2 → flag emoji (regional indicators)
function flagEmoji(cc) {
  if (!cc || cc.length !== 2) return ''
  return String.fromCodePoint(
    ...[...cc.toUpperCase()].map(c => 0x1f1e6 + c.charCodeAt(0) - 65)
  )
}

/**
 * Search for places by name.
 * @param {string} query
 * @param {string} lang     UI language ('en' | 'cs' | 'es')
 * @param {number} count    max results (1–100)
 * @param {AbortSignal} [signal]
 * @returns {Promise<Array<{ id, name, lat, lon, country, countryCode, admin1, label, detail, flag }>>}
 */
export async function searchPlaces(query, lang = 'en', count = 8, signal) {
  const q = (query ?? '').trim()
  if (q.length < 2) return []

  const url = `${BASE}?name=${encodeURIComponent(q)}&count=${count}&language=${lang}&format=json`
  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()

  return (data.results ?? []).map(r => ({
    id:          r.id,
    name:        r.name,
    lat:         r.latitude,
    lon:         r.longitude,
    country:     r.country ?? '',
    countryCode: r.country_code ?? '',
    admin1:      r.admin1 ?? '',
    label:       r.name,
    detail:      [r.admin1, r.country].filter(Boolean).join(', '),
    flag:        flagEmoji(r.country_code),
  }))
}

/**
 * Reverse-geocode coordinates to a place name (BigDataCloud, free, no key).
 * Returns '' if nothing usable is found — callers should treat the name as
 * optional and degrade gracefully.
 * @param {number} lat
 * @param {number} lon
 * @param {string} lang
 * @param {AbortSignal} [signal]
 * @returns {Promise<string>}
 */
export async function reverseGeocode(lat, lon, lang = 'en', signal) {
  const url = `${REVERSE_BASE}?latitude=${lat}&longitude=${lon}&localityLanguage=${lang}`
  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const d = await res.json()
  return d.city || d.locality || d.principalSubdivision || ''
}
