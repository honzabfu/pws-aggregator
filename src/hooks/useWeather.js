// src/hooks/useWeather.js
import { useState, useEffect, useCallback, useRef } from 'react'
import { SOURCES, isSourceActive } from '../lib/sources/registry.js'
import { aggregate } from '../lib/aggregate.js'

const STATUS = { idle: 'idle', loading: 'loading', ok: 'ok', error: 'error', noKey: 'no-key' }

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

    // Initialize per-source status from the registry: a source whose required
    // key is missing starts as 'no-key', everything else as 'loading'.
    const status = {}
    for (const s of SOURCES) {
      status[s.key] = { status: isSourceActive(s, apiKeys) ? STATUS.loading : STATUS.noKey }
    }
    setStatus(status)

    addLog(`▶ Fetching for ${location.label} (${location.lat}, ${location.lon})`)

    // Run every active source in parallel.
    const active = SOURCES.filter(s => isSourceActive(s, apiKeys))
    active.forEach(s => addLog(`${s.key}: fetching…`))

    const settled = await Promise.allSettled(
      active.map(s => s.fetch(location, apiKeys))
    )

    const allReadings = []
    settled.forEach((res, i) => {
      const s = active[i]
      if (res.status === 'fulfilled') {
        let { readings, errors } = res.value
        if (s.tagReadings) readings = s.tagReadings(readings, { windyKeyFree })
        allReadings.push(...readings)
        if (errors.length) errors.forEach(e => addLog(`  ✗ ${e}`))
        if (errors.length && readings.length === 0) {
          status[s.key] = { status: STATUS.error, error: errors[0] }
        } else {
          addLog(`  ✓ ${s.key}: ${readings.length} readings`)
          status[s.key] = { status: STATUS.ok, count: readings.length, fetchedAt: new Date().toISOString() }
        }
      } else {
        const msg = res.reason?.message ?? 'unknown error'
        addLog(`  ✗ ${s.key}: ${msg}`)
        status[s.key] = { status: STATUS.error, error: msg }
      }
    })
    setStatus({ ...status })

    // ── Aggregate ──────────────────────────────────────────────────────────
    if (allReadings.length > 0) {
      const agg = aggregate(allReadings, iqrFactor)
      setResult(agg)
      setLastUpdated(new Date())
      addLog(`✓ Aggregated ${allReadings.length} readings → ${agg.stationCount} ${agg.usingStations ? 'physical stations' : 'model readings'}`)
    } else {
      addLog('✗ No readings from any source')
    }

    setLoading(false)
  }, [location, apiKeys, iqrFactor, windyKeyFree, addLog])

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
