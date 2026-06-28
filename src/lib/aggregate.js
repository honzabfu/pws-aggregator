// src/lib/aggregate.js

const METRICS = ['temp', 'humidity', 'pressure', 'windSpeed', 'clouds', 'precip', 'uvIndex']

// ── IQR filter ────────────────────────────────────────────────────────────────
function quartile(sorted, p) {
  const pos = p * (sorted.length - 1)
  const lo = Math.floor(pos)
  const hi = Math.ceil(pos)
  return lo === hi ? sorted[lo] : sorted[lo] + (pos - lo) * (sorted[hi] - sorted[lo])
}

function iqrFilter(values, factor = 1.5) {
  if (values.length < 3) return values
  const sorted = [...values].sort((a, b) => a - b)
  const q1 = quartile(sorted, 0.25)
  const q3 = quartile(sorted, 0.75)
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
  const approximate  = readings.filter(r =>  r.approximate)
  const nonApprox    = readings.filter(r => !r.approximate)

  // Physical stations (sourceType === 'station') reflect actual local conditions.
  // Prefer them over NWP model readings when any are available.
  const stationReadings = nonApprox.filter(r => r.sourceType === 'station')
  const usingStations   = stationReadings.length > 0
  const measured        = usingStations ? stationReadings : nonApprox
  // Model readings excluded from the aggregate because stations are preferred
  const excludedModels  = usingStations
    ? nonApprox.filter(r => r.sourceType !== 'station')
    : []

  const perMetric = {}

  const valuesFor = (pool, metric) => pool
    .map(r => r.metrics[metric])
    .filter(v => v !== null && v !== undefined && !isNaN(Number(v)))
    .map(Number)

  for (const metric of METRICS) {
    // Per-metric fallback: physical stations rarely report some metrics
    // (e.g. OWM /find has no precipitation or UV index). When the preferred
    // pool has no data for this metric, fall back to all non-approximate
    // readings — i.e. let model sources fill that single metric — instead of
    // dropping it from the overview entirely.
    let raw = valuesFor(measured, metric)
    let usedFallback = false
    if (raw.length === 0 && usingStations) {
      const fallback = valuesFor(nonApprox, metric)
      if (fallback.length > 0) {
        raw = fallback
        usedFallback = true
      }
    }

    const filtered = iqrFilter(raw, iqrFactor)
    const value = avg(filtered)

    perMetric[metric] = {
      value:        round(value, metric === 'pressure' ? 1 : metric === 'uvIndex' ? 1 : 1),
      contributors: filtered.length,
      total:        raw.length,
      removed:      raw.length - filtered.length,
      min:          raw.length ? round(Math.min(...raw)) : null,
      max:          raw.length ? round(Math.max(...raw)) : null,
      usedFallback,
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
    // Model readings not used because physical stations are available
    ...excludedModels.map(r => ({ ...r, isOutlier: false, excludedBySourceType: true })),
    ...approximate.map(r => ({ ...r, isOutlier: true, approximate: true })),
  ]

  return {
    computedAt:   new Date().toISOString(),
    stationCount: measured.length,
    usingStations,
    perMetric,
    windDirMean,
    rawReadings:  taggedReadings,
  }
}
