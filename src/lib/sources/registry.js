// src/lib/sources/registry.js
// Single source of truth for the list of weather sources.
//
// Each entry describes how to fetch one source and how the rest of the app
// should refer to it. Adding a new source = add a `fetch<Source>()` module
// that returns `{ readings, errors }` and append one entry here — `useWeather`
// iterates this list, and UI labels resolve through `labelKey`.
import { fetchOpenMeteo } from './openmeteo.js'
import { fetchOWM } from './owm.js'
import { fetchTomorrow } from './tomorrow.js'
import { fetchWindy } from './windy.js'

/**
 * @typedef {Object} SourceDef
 * @property {string} key           Stable id used for status, config and i18n.
 * @property {string} labelKey      i18n key for the human-readable name.
 * @property {string|null} apiKeyName  Key in `config.apiKeys`, or null if none.
 * @property {(location: object, apiKeys: object) => Promise<{readings: object[], errors: string[]}>} fetch
 * @property {(readings: object[], opts: object) => object[]} [tagReadings]  Optional post-processing.
 */

/** @type {SourceDef[]} */
export const SOURCES = [
  {
    key: 'open-meteo',
    labelKey: 'sourceOpenMeteo',
    apiKeyName: null,
    fetch: (loc) => fetchOpenMeteo(loc.lat, loc.lon),
  },
  {
    key: 'owm',
    labelKey: 'sourceOWM',
    apiKeyName: 'owm',
    fetch: (loc, apiKeys) => fetchOWM(loc.lat, loc.lon, apiKeys.owm, loc.radiusKm),
  },
  {
    key: 'tomorrow',
    labelKey: 'sourceTomorrow',
    apiKeyName: 'tomorrow',
    fetch: (loc, apiKeys) => fetchTomorrow(loc.lat, loc.lon, apiKeys.tomorrow),
  },
  {
    key: 'windy',
    labelKey: 'sourceWindy',
    apiKeyName: 'windy',
    fetch: (loc, apiKeys) => fetchWindy(loc.lat, loc.lon, apiKeys.windy),
    // Free-tier Windy data is deliberately shuffled; tag it so the aggregate
    // excludes it while the Stations table still shows it (≈).
    tagReadings: (readings, { windyKeyFree }) =>
      windyKeyFree ? readings.map(r => ({ ...r, approximate: true })) : readings,
  },
]

/** A source is active for this fetch if it needs no key, or its key is set. */
export function isSourceActive(source, apiKeys) {
  return !source.apiKeyName || !!apiKeys[source.apiKeyName]
}
