// src/lib/aggregate.js

const METRICS = ['temp', 'humidity', 'pressure', 'windSpeed', 'clouds', 'precip', 'uvIndex']

// ── IQR filter ────────────────────────────────────────────────────────────────
function iqrFilter(values, factor = 1.5) {
  if (values.length < 3) return values
  const sorted = [...values].sort((a, b) => a - b)
  const q1 = sorted[Math.floor(sorted.length * 0.25)]
  const q3 = sorted[Math.floor(sorted.length * 0.75)]
  const iqr = q3 - q1
  // If IQR is 0 (all same value), skip filtering
  if (iqr === 0) return values
  return values.filter(v => v >= q1 - factor * iqr && v <= q3 + factor * iqr)
}

function avg(arr) {
  return arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : null
}

function round(v, d = 1) {
  return (v === null || v === undefined || isNaN(v)) ? null : +v.toFixed(d)
}

// ── Circular mean for wind direction ─────────────────────────────────────────
function circularMean(degrees) {
  if (!degrees.length) return null
  const sinSum = degrees.reduce((s, d) => s + Math.sin(d * Math.PI / 180), 0)
  const cosSum = degrees.reduce((s, d) => s + Math.cos(d * Math.PI / 180), 0)
  const mean = Math.atan2(sinSum / degrees.length, cosSum / degrees.length) * 180 / Math.PI
  return +((mean + 360) % 360).toFixed(0)
}

// ── Main aggregation ──────────────────────────────────────────────────────────
/**
 * @param {StationReading[]} readings
 * @param {number} iqrFactor
 * @returns {AggregatedResult}
 */
export function aggregate(readings, iqrFactor = 1.5) {
  // Approximate readings (e.g. Windy free tier) are shown in Stations
  // but excluded from the aggregate calculation.
  const measured    = readings.filter(r => !r.approximate)
  const approximate = readings.filter(r =>  r.approximate)

  const perMetric = {}

  for (const metric of METRICS) {
    const raw = measured
      .map(r => r.metrics[metric])
      .filter(v => v !== null && v !== undefined && !isNaN(Number(v)))
      .map(Number)

    const filtered = iqrFilter(raw, iqrFactor)
    const value = avg(filtered)

    perMetric[metric] = {
      value:        round(value, metric === 'pressure' ? 1 : metric === 'uvIndex' ? 1 : 1),
      contributors: filtered.length,
      total:        raw.length,
      removed:      raw.length - filtered.length,
      min:          raw.length ? round(Math.min(...raw)) : null,
      max:          raw.length ? round(Math.max(...raw)) : null,
    }
  }

  // Wind direction — circular mean, no IQR (directional data)
  const wdirs = measured
    .map(r => r.metrics.windDeg)
    .filter(v => v !== null && v !== undefined && !isNaN(Number(v)))
    .map(Number)

  const windDirMean = circularMean(wdirs)

  // Tag each measured reading: is it an outlier for temp? (primary indicator)
  const tempRaw = measured
    .map(r => r.metrics.temp)
    .filter(v => v !== null && !isNaN(Number(v)))
    .map(Number)
  const tempFiltered = new Set(iqrFilter(tempRaw, iqrFactor))

  const taggedReadings = [
    ...measured.map(r => ({
      ...r,
      isOutlier: r.metrics.temp !== null && !tempFiltered.has(Number(r.metrics.temp)),
    })),
    ...approximate.map(r => ({ ...r, isOutlier: true, approximate: true })),
  ]

  return {
    computedAt:   new Date().toISOString(),
    stationCount: measured.length,
    perMetric,
    windDirMean,
    rawReadings:  taggedReadings,
  }
}
