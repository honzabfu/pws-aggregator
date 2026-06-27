// src/hooks/useWeather.js
import { useState, useEffect, useCallback, useRef } from 'react'
import { fetchOpenMeteo } from '../lib/sources/openmeteo.js'
import { fetchOWM } from '../lib/sources/owm.js'
import { fetchTomorrow } from '../lib/sources/tomorrow.js'
import { fetchWindy } from '../lib/sources/windy.js'
import { aggregate } from '../lib/aggregate.js'

const STATUS = { idle: 'idle', loading: 'loading', ok: 'ok', error: 'error' }

export function useWeather(location, apiKeys, iqrFactor, refreshIntervalMin, windyKeyFree = true) {
  const [result, setResult]       = useState(null)   // AggregatedResult
  const [sourceStatus, setStatus] = useState({})     // { [key]: { status, count, error, fetchedAt } }
  const [loading, setLoading]     = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [log, setLog]             = useState([])

  const timerRef = useRef(null)
  const abortRef = useRef(null)

  const addLog = useCallback((msg) => {
    setLog(l => [...l.slice(-49), `${new Date().toLocaleTimeString()} ${msg}`])
  }, [])

  const fetch = useCallback(async () => {
    if (!location) return
    if (abortRef.current) abortRef.current.abort()
    abortRef.current = new AbortController()

    setLoading(true)
    setLog([])
    setStatus({
      'open-meteo': { status: STATUS.loading },
      'owm':        { status: apiKeys.owm     ? STATUS.loading : 'no-key' },
      'tomorrow':   { status: apiKeys.tomorrow ? STATUS.loading : 'no-key' },
      'windy':      { status: apiKeys.windy   ? STATUS.loading : 'no-key' },
    })

    addLog(`▶ Fetching for ${location.label} (${location.lat}, ${location.lon})`)

    const allReadings = []

    // ── Open-Meteo (no key, always runs) ──────────────────────────────────
    try {
      addLog('open-meteo: fetching 3 models…')
      const { readings, errors } = await fetchOpenMeteo(location.lat, location.lon)
      allReadings.push(...readings)
      if (errors.length) errors.forEach(e => addLog(`  ✗ ${e}`))
      addLog(`  ✓ open-meteo: ${readings.length} readings`)
      setStatus(p => ({
        ...p,
        'open-meteo': { status: STATUS.ok, count: readings.length, fetchedAt: new Date().toISOString() }
      }))
    } catch (e) {
      addLog(`  ✗ open-meteo: ${e.message}`)
      setStatus(p => ({ ...p, 'open-meteo': { status: STATUS.error, error: e.message } }))
    }

    // ── OpenWeatherMap (requires key) ──────────────────────────────────────
    if (apiKeys.owm) {
      try {
        addLog('owm: fetching…')
        const { readings, errors } = await fetchOWM(location.lat, location.lon, apiKeys.owm, location.radiusKm)
        allReadings.push(...readings)
        if (errors.length) errors.forEach(e => addLog(`  ✗ ${e}`))
        addLog(`  ✓ owm: ${readings.length} readings`)
        setStatus(p => ({
          ...p,
          'owm': { status: STATUS.ok, count: readings.length, fetchedAt: new Date().toISOString() }
        }))
      } catch (e) {
        addLog(`  ✗ owm: ${e.message}`)
        setStatus(p => ({ ...p, 'owm': { status: STATUS.error, error: e.message } }))
      }
    }

    // ── Tomorrow.io (requires key) ─────────────────────────────────────────
    if (apiKeys.tomorrow) {
      try {
        addLog('tomorrow: fetching…')
        const { readings, errors } = await fetchTomorrow(location.lat, location.lon, apiKeys.tomorrow)
        allReadings.push(...readings)
        if (errors.length) errors.forEach(e => addLog(`  ✗ ${e}`))
        addLog(`  ✓ tomorrow: ${readings.length} readings`)
        setStatus(p => ({
          ...p,
          'tomorrow': { status: STATUS.ok, count: readings.length, fetchedAt: new Date().toISOString() }
        }))
      } catch (e) {
        addLog(`  ✗ tomorrow: ${e.message}`)
        setStatus(p => ({ ...p, 'tomorrow': { status: STATUS.error, error: e.message } }))
      }
    }

    // ── Windy (requires key) ──────────────────────────────────────────────
    if (apiKeys.windy) {
      try {
        addLog('windy: fetching…')
        const { readings, errors } = await fetchWindy(location.lat, location.lon, apiKeys.windy)
        const taggedWindy = windyKeyFree
          ? readings.map(r => ({ ...r, approximate: true }))
          : readings
        allReadings.push(...taggedWindy)
        if (errors.length) errors.forEach(e => addLog(`  ✗ ${e}`))
        addLog(`  ✓ windy: ${readings.length} readings`)
        setStatus(p => ({
          ...p,
          'windy': { status: STATUS.ok, count: readings.length, fetchedAt: new Date().toISOString() }
        }))
      } catch (e) {
        addLog(`  ✗ windy: ${e.message}`)
        setStatus(p => ({ ...p, 'windy': { status: STATUS.error, error: e.message } }))
      }
    }

    // ── Aggregate ──────────────────────────────────────────────────────────
    if (allReadings.length > 0) {
      const agg = aggregate(allReadings, iqrFactor)
      setResult(agg)
      setLastUpdated(new Date())
      addLog(`✓ Aggregated ${allReadings.length} readings → ${agg.stationCount} stations`)
    } else {
      addLog('✗ No readings from any source')
    }

    setLoading(false)
  }, [location, apiKeys, iqrFactor, addLog])

  // Auto-refresh
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (refreshIntervalMin > 0) {
      timerRef.current = setInterval(fetch, refreshIntervalMin * 60 * 1000)
    }
    return () => clearInterval(timerRef.current)
  }, [fetch, refreshIntervalMin])

  // Fetch on location/key change
  useEffect(() => {
    if (location) fetch()
  }, [location?.id, apiKeys.owm, apiKeys.tomorrow, apiKeys.windy])  // eslint-disable-line

  return { result, sourceStatus, loading, lastUpdated, log, refetch: fetch }
}
