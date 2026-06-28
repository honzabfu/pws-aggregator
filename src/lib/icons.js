// src/lib/icons.js
// Selectable icon sets for metric glyphs. One choice in Settings swaps every
// metric icon at once. Keys match the metric keys used across the app
// (temp, humidity, pressure, windSpeed, clouds, precip, uvIndex).
//
// Sets run from "standard" (neutral, widely-supported weather glyphs) through
// "modern" (curated, slightly stylised) to "playful" (expressive). Newer
// emoji may render as a missing glyph (tofu) on older platforms — kept to the
// "modern"/"playful" sets where that trade-off is opt-in.

export const ICON_SETS = {
  standard: {
    temp:      '🌡️',
    humidity:  '💧',
    pressure:  '📊',
    windSpeed: '🌬️',
    clouds:    '☁️',
    precip:    '🌧️',
    uvIndex:   '☀️',
  },
  modern: {
    temp:      '🌡️',
    humidity:  '💧',
    pressure:  '⬇️',
    windSpeed: '🪁',
    clouds:    '☁️',
    precip:    '☔',
    uvIndex:   '🔆',
  },
  playful: {
    temp:      '🥵',
    humidity:  '💦',
    pressure:  '🎈',
    windSpeed: '🍃',
    clouds:    '⛅',
    precip:    '🌈',
    uvIndex:   '😎',
  },
}

export const ICON_SET_KEYS = ['standard', 'modern', 'playful']
export const DEFAULT_ICON_SET = 'modern'

/** Resolve a full icon map for the given set name, falling back to the default. */
export function getIcons(setName) {
  return ICON_SETS[setName] ?? ICON_SETS[DEFAULT_ICON_SET]
}

/** Resolve a single metric's glyph for the given set name. */
export function metricIcon(setName, metric) {
  return getIcons(setName)[metric] ?? ''
}
