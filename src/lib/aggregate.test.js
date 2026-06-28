// src/lib/aggregate.test.js
import { describe, it, expect } from 'vitest'
import { aggregate } from './aggregate.js'

const EMPTY_METRICS = {
  temp: null, humidity: null, pressure: null, windSpeed: null,
  windDeg: null, clouds: null, precip: null, uvIndex: null,
}

/** Build a StationReading with only the metrics you care about. */
function reading(source, sourceType, metrics, extra = {}) {
  return {
    stationId: `${source}-${Math.random()}`,
    stationName: source,
    source,
    sourceType,
    fetchedAt: new Date().toISOString(),
    metrics: { ...EMPTY_METRICS, ...metrics },
    ...extra,
  }
}

const station = (metrics, extra) => reading('owm', 'station', metrics, extra)
const model = (metrics, extra) => reading('open-meteo', 'model', metrics, extra)

describe('IQR outlier filter', () => {
  it('removes a clear outlier and reports counts', () => {
    const readings = [10, 11, 12, 13, 100].map(t => station({ temp: t }))
    const { perMetric } = aggregate(readings)
    expect(perMetric.temp.total).toBe(5)
    expect(perMetric.temp.removed).toBe(1)
    expect(perMetric.temp.contributors).toBe(4)
    expect(perMetric.temp.value).toBe(11.5) // mean of the 4 survivors
  })

  it('reports min/max from the raw pool, before filtering', () => {
    const readings = [10, 11, 12, 13, 100].map(t => station({ temp: t }))
    const { perMetric } = aggregate(readings)
    expect(perMetric.temp.min).toBe(10)
    expect(perMetric.temp.max).toBe(100) // outlier still counts toward range
  })

  it('does not filter with fewer than 3 values', () => {
    const readings = [10, 50].map(t => station({ temp: t }))
    const { perMetric } = aggregate(readings)
    expect(perMetric.temp.removed).toBe(0)
    expect(perMetric.temp.value).toBe(30)
  })

  it('does not filter when all values are identical (IQR = 0)', () => {
    const readings = [20, 20, 20].map(t => station({ temp: t }))
    const { perMetric } = aggregate(readings)
    expect(perMetric.temp.removed).toBe(0)
    expect(perMetric.temp.value).toBe(20)
  })
})

describe('source-type preference', () => {
  it('prefers physical stations and excludes model readings from the pool', () => {
    const readings = [
      station({ temp: 15 }),
      model({ temp: 20 }),
      model({ temp: 21 }),
    ]
    const result = aggregate(readings)
    expect(result.usingStations).toBe(true)
    expect(result.stationCount).toBe(1)
    expect(result.perMetric.temp.total).toBe(1)
    expect(result.perMetric.temp.value).toBe(15) // models did not dilute it

    const excluded = result.rawReadings.filter(r => r.excludedBySourceType)
    expect(excluded).toHaveLength(2)
  })

  it('falls back to model readings when no station is available', () => {
    const readings = [20, 21, 22].map(t => model({ temp: t }))
    const result = aggregate(readings)
    expect(result.usingStations).toBe(false)
    expect(result.stationCount).toBe(3)
    expect(result.perMetric.temp.value).toBe(21)
  })

  it('falls back to models per-metric for data stations do not report (e.g. precip)', () => {
    // Station reports temperature but no precipitation; models report precip.
    const readings = [
      station({ temp: 15 }),
      model({ temp: 20, precip: 2 }),
      model({ temp: 21, precip: 4 }),
    ]
    const result = aggregate(readings)
    // Temperature still comes from the station only…
    expect(result.perMetric.temp.value).toBe(15)
    expect(result.perMetric.temp.usedFallback).toBe(false)
    // …but precip falls back to the model readings instead of vanishing.
    expect(result.perMetric.precip.total).toBe(2)
    expect(result.perMetric.precip.value).toBe(3)
    expect(result.perMetric.precip.usedFallback).toBe(true)
  })

  it('does not flag a fallback when stations themselves report the metric', () => {
    const readings = [
      station({ temp: 15, precip: 1 }),
      model({ temp: 20, precip: 9 }),
    ]
    const result = aggregate(readings)
    expect(result.perMetric.precip.value).toBe(1) // station value, models excluded
    expect(result.perMetric.precip.usedFallback).toBe(false)
  })
})

describe('approximate readings', () => {
  it('keeps approximate readings out of the pool but visible in rawReadings', () => {
    const readings = [
      station({ temp: 15 }),
      reading('windy', 'model', { temp: 99 }, { approximate: true }),
    ]
    const result = aggregate(readings)
    expect(result.perMetric.temp.value).toBe(15) // 99 never entered the mean
    expect(result.stationCount).toBe(1)

    const approx = result.rawReadings.find(r => r.approximate)
    expect(approx).toBeDefined()
    expect(approx.isOutlier).toBe(true)
  })
})

describe('wind direction (circular mean)', () => {
  it('averages 350 and 10 to 0, not 180', () => {
    const readings = [
      model({ windDeg: 350 }),
      model({ windDeg: 10 }),
    ]
    expect(aggregate(readings).windDirMean).toBe(0)
  })

  it('is null when no direction data is present', () => {
    expect(aggregate([model({ temp: 5 })]).windDirMean).toBeNull()
  })
})

describe('edge cases', () => {
  it('handles empty input', () => {
    const result = aggregate([])
    expect(result.stationCount).toBe(0)
    expect(result.usingStations).toBe(false)
    expect(result.windDirMean).toBeNull()
    expect(result.rawReadings).toEqual([])
    expect(result.perMetric.temp.total).toBe(0)
    expect(result.perMetric.temp.value).toBeNull()
  })

  it('treats all-null metrics as no data', () => {
    const result = aggregate([model({ temp: null }), model({ humidity: 80 })])
    expect(result.perMetric.temp.total).toBe(0)
    expect(result.perMetric.temp.value).toBeNull()
    expect(result.perMetric.humidity.total).toBe(1)
    expect(result.perMetric.humidity.value).toBe(80)
  })
})
