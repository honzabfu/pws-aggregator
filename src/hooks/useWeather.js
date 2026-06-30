// src/hooks/useWeather.js
import { useState, useEffect, useCallback, useRef } from 'react'
import { SOURCES, isSourceActive } from '../lib/sources/registry.js'
import { aggregate } from '../lib/aggregate.js'

const STATUS = { idle: 'idle', loading: 'loading', ok: 'ok', error: 'error', noKey: 'no-key' }

// Single geolocation request. Rejects with the native GeolocationPositionError
// so the caller can read its `.code` (1 denied / 2 unavailable / 3 timeout).
function geolocateOnce(options) {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      reject,
      options,
    )
  })
}

// Resolve the device position, with a retry tuned for Safari. Safari in a normal
// tab frequently fails the first fix (POSITION_UNAVAILABLE/timeout) even when the
// permission is granted — a standalone PWA does not — so on failure we retry once
// forcing a fresh high-accuracy fix with a longer timeout. The first attempt is
// fast and may reuse a recent cached fix for quick successive refreshes.
async function getCurrentPosition() {
  if (!navigator.geolocation) throw new Error('Geolocation not supported')
  try {
    return await geolocateOnce({ enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 })
  } catch {
    try {
      return await geolocateOnce({ enableHighAccuracy: true, timeout: 25000, maximumAge: 0 })
    } catch (err) {
      const label = err?.code === 1 ? 'permission denied'
        : err?.code === 2 ? 'position unavailable'
        : err?.code === 3 ? 'timeout'
        : 'error'
      throw new Error(`Geolocation ${label}${err?.message ? `: ${err.message}` : ''}`)
    }
  }
}

export function useWeather(location, apiKeys, iqrFactor, refreshIntervalMin, windyKeyFree = true, onResolveCoords) {
  const [result, setResult]       = useState(null)   // AggregatedResult
  const [sourceStatus, setStatus] = useState({})     // { [key]: { status, count, error, fetchedAt } }
  const [loading, setLoading]     = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [geoError, setGeoError]   = useState(null)   // dynamic-location geolocation failure
  const [log, setLog]             = useState([])

  const timerRef = useRef(null)
  const abortRef = useRef(null)
  const lastUpdatedRef = useRef(null)
  lastUpdatedRef.current = lastUpdated

  const addLog = useCallback((msg) => {
    setLog(l => [...l.slice(-49), `${new Date().toLocaleTimeString()} ${msg}`])
  }, [])

  const fetch = useCallback(async () => {
    if (!location) return
    if (abortRef.current) abortRef.current.abort()
    abortRef.current = new AbortController()

    setLoading(true)
    setLog([])

    // ── Resolve coordinates ──────────────────────────────────────────────────
    // A dynamic location re-checks the device's geolocation on every refresh and
    // fetches data for wherever the user currently is. The resolved coordinates
    // are cached back into config so the UI (info bar, station distances) shows
    // the real position instead of the 0/0 placeholder.
    let loc = location
    if (location.dynamic) {
      addLog('📍 Resolving current position…')
      try {
        const pos = await getCurrentPosition()
        loc = { ...location, lat: pos.lat, lon: pos.lon }
        setGeoError(null)
        onResolveCoords?.(location.id, { lat: pos.lat, lon: pos.lon })
      } catch (e) {
        addLog(`✗ Geolocation failed: ${e.message}`)
        setGeoError(e.message)
        setLoading(false)
        return
      }
    }

    // Initialize per-source status from the registry: a source whose required
    // key is missing starts as 'no-key', everything else as 'loading'.
    const status = {}
    for (const s of SOURCES) {
      status[s.key] = { status: isSourceActive(s, apiKeys) ? STATUS.loading : STATUS.noKey }
    }
    setStatus(status)

    addLog(`▶ Fetching for ${loc.label} (${loc.lat}, ${loc.lon})`)

    // Run every active source in parallel.
    const active = SOURCES.filter(s => isSourceActive(s, apiKeys))
    active.forEach(s => addLog(`${s.key}: fetching…`))

    const settled = await Promise.allSettled(
      active.map(s => s.fetch(loc, apiKeys))
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
  }, [location, apiKeys, iqrFactor, windyKeyFree, onResolveCoords, addLog])

  // Auto-refresh
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (refreshIntervalMin > 0) {
      timerRef.current = setInterval(fetch, refreshIntervalMin * 60 * 1000)
    }
    return () => clearInterval(timerRef.current)
  }, [fetch, refreshIntervalMin])

  // Refresh on resume. setInterval is suspended/throttled while the PWA is
  // backgrounded, and a warm resume (returning to a still-mounted app) fires no
  // mount fetch — so without this the user could see stale data on reopen. When
  // the tab becomes visible again we refetch if the data is older than the
  // refresh interval (or 5 min when auto-refresh is off), ignoring quick
  // tab-switches so we don't hammer the APIs.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return
      const staleAfterMs = (refreshIntervalMin > 0 ? refreshIntervalMin : 5) * 60 * 1000
      const last = lastUpdatedRef.current
      if (!last || Date.now() - last.getTime() >= staleAfterMs) fetch()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [fetch, refreshIntervalMin])

  // Fetch on location/key change
  useEffect(() => {
    setGeoError(null)
    if (location) fetch()
  }, [location?.id, apiKeys.owm, apiKeys.tomorrow, apiKeys.windy])  // eslint-disable-line

  return { result, sourceStatus, loading, lastUpdated, geoError, log, refetch: fetch }
}
