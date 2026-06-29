// src/lib/config.js
const STORAGE_KEY = 'pws:config'
const CONFIG_VERSION = 1

export const DEFAULT_CONFIG = {
  version: CONFIG_VERSION,
  locations: [],
  activeLocationId: null,
  apiKeys: {
    owm:      '',
    windy:    '',
    tomorrow: '',
  },
  preferences: {
    language:          'auto',
    theme:             'system',
    units:             'metric',
    iconSet:           'modern',
    windDisplay:       'combined',
    iqrFactor:         1.5,
    refreshIntervalMin: 30,
    fontSize:          'medium',
    windyKeyFree:      true,
    apiKeyBannerDismissed: false,
  },
}

// ── Read ──────────────────────────────────────────────────────────────────────
export function loadConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return structuredClone(DEFAULT_CONFIG)
    const parsed = JSON.parse(raw)
    // Merge with defaults to handle missing keys after updates
    return mergeDeep(structuredClone(DEFAULT_CONFIG), parsed)
  } catch {
    return structuredClone(DEFAULT_CONFIG)
  }
}

// ── Write ─────────────────────────────────────────────────────────────────────
export function saveConfig(config) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...config, version: CONFIG_VERSION }))
    return true
  } catch {
    return false
  }
}

// ── Clear ─────────────────────────────────────────────────────────────────────
export function clearConfig() {
  localStorage.removeItem(STORAGE_KEY)
}

// ── Export ────────────────────────────────────────────────────────────────────
export function exportConfig(config) {
  const blob = new Blob(
    [JSON.stringify(config, null, 2)],
    { type: 'application/json' }
  )
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `pws-config-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

// ── Import ────────────────────────────────────────────────────────────────────
export function importConfig(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result)
        const merged = mergeDeep(structuredClone(DEFAULT_CONFIG), parsed)
        resolve(merged)
      } catch {
        reject(new Error('Invalid config file'))
      }
    }
    reader.onerror = () => reject(new Error('File read error'))
    reader.readAsText(file)
  })
}

// ── Location helpers ──────────────────────────────────────────────────────────
export function newLocation(label, lat, lon, radiusKm = 10) {
  return {
    id:       crypto.randomUUID(),
    label,
    lat:      Number(lat),
    lon:      Number(lon),
    radiusKm: Number(radiusKm),
  }
}

// ── Deep merge ────────────────────────────────────────────────────────────────
function mergeDeep(target, source) {
  if (!source || typeof source !== 'object') return target
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      if (!target[key]) target[key] = {}
      mergeDeep(target[key], source[key])
    } else {
      target[key] = source[key]
    }
  }
  return target
}
