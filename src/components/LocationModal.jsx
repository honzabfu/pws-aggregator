// src/components/LocationModal.jsx
import { useState, useEffect } from 'react'
import { t } from '../lib/i18n.js'
import { searchPlaces, reverseGeocode } from '../lib/geocode.js'

export function LocationModal({ onAdd, onClose, lang, initialValues }) {
  const [label,    setLabel]    = useState(initialValues?.label    ?? '')
  const [lat,      setLat]      = useState(initialValues ? String(initialValues.lat) : '')
  const [lon,      setLon]      = useState(initialValues ? String(initialValues.lon) : '')
  const [radius,   setRadius]   = useState(initialValues ? String(initialValues.radiusKm) : '10')
  const [locating, setLocating] = useState(false)
  const [error,    setError]    = useState('')

  const [query,     setQuery]     = useState('')
  const [results,   setResults]   = useState([])
  const [searching, setSearching] = useState(false)

  // Debounced geocoding search
  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) { setResults([]); setSearching(false); return }

    const ctrl = new AbortController()
    const id = setTimeout(async () => {
      setSearching(true)
      try {
        setResults(await searchPlaces(q, lang, 8, ctrl.signal))
      } catch (e) {
        if (e.name !== 'AbortError') { setResults([]); setError(t(lang, 'errorNetwork')) }
      } finally {
        setSearching(false)
      }
    }, 300)

    return () => { clearTimeout(id); ctrl.abort() }
  }, [query, lang])

  const selectPlace = (p) => {
    setLabel(p.label)
    setLat(p.lat.toFixed(5))
    setLon(p.lon.toFixed(5))
    setQuery('')
    setResults([])
    setError('')
  }

  const useGeoLocation = () => {
    if (!navigator.geolocation) { setError('Geolocation not supported'); return }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const la = pos.coords.latitude
        const lo = pos.coords.longitude
        setLat(la.toFixed(5))
        setLon(lo.toFixed(5))
        // Prefill the name from the coordinates, but never overwrite what the
        // user already typed; the name stays optional if lookup fails.
        try {
          const name = await reverseGeocode(la, lo, lang)
          if (name) setLabel(prev => (prev.trim() ? prev : name))
        } catch { /* ignore — reverse geocoding is best-effort */ }
        setLocating(false)
      },
      () => {
        setError('Geolocation failed')
        setLocating(false)
      }
    )
  }

  const handleSubmit = () => {
    const la = parseFloat(lat)
    const lo = parseFloat(lon)
    const r  = parseFloat(radius)
    if (!label.trim())          { setError('Name required'); return }
    if (isNaN(la) || la < -90 || la > 90)  { setError('Invalid latitude');  return }
    if (isNaN(lo) || lo < -180 || lo > 180) { setError('Invalid longitude'); return }
    if (isNaN(r) || r < 1 || r > 100)       { setError('Radius 1–100 km');   return }
    onAdd(label.trim(), la, lo, r)
    onClose()
  }

  const field = (label, value, setter, type = 'text', placeholder = '') => (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5 }}>
        {label}
      </label>
      <input className="input" type={type} value={value}
        onChange={e => setter(e.target.value)} placeholder={placeholder} />
    </div>
  )

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'var(--bg-overlay)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 100, padding: 16,
    }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xl)',
        width: '100%', maxWidth: 400,
        maxHeight: 'calc(100dvh - 32px)',
        overflowY: 'auto',
        overflowX: 'hidden',
        padding: 24,
        boxSizing: 'border-box',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700 }}>{t(lang, initialValues ? 'locationEdit' : 'locationAdd')}</h2>
          <button onClick={onClose} className="btn-icon" style={{ fontSize: 18 }}>×</button>
        </div>

        {/* ── Search ──────────────────────────────────────────────────────── */}
        <div style={{ marginBottom: 14, position: 'relative' }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5 }}>
            {t(lang, 'locationSearch')}
          </label>
          <input className="input" type="text" value={query} autoFocus
            onChange={e => setQuery(e.target.value)}
            placeholder={t(lang, 'locationSearchHint')} />

          {(searching || results.length > 0 || (query.trim().length >= 2 && !searching)) && (
            <div style={{
              marginTop: 6,
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-elevated)',
              maxHeight: 220,
              overflowY: 'auto',
            }}>
              {searching && (
                <div style={{ padding: '10px 12px', fontSize: 12, color: 'var(--text-muted)' }}>
                  ⟳ {t(lang, 'locationSearching')}
                </div>
              )}
              {!searching && results.length === 0 && (
                <div style={{ padding: '10px 12px', fontSize: 12, color: 'var(--text-muted)' }}>
                  {t(lang, 'locationSearchEmpty')}
                </div>
              )}
              {!searching && results.map(p => (
                <button key={p.id} onClick={() => selectPlace(p)} style={{
                  display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                  padding: '9px 12px', border: 'none', background: 'transparent',
                  color: 'var(--text-primary)', cursor: 'pointer', textAlign: 'left',
                  borderBottom: '1px solid var(--border)',
                }}>
                  <span style={{ fontSize: 18 }}>{p.flag}</span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: 13, fontWeight: 600 }}>{p.name}</span>
                    {p.detail && (
                      <span style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)' }}>{p.detail}</span>
                    )}
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                    {p.lat.toFixed(2)}, {p.lon.toFixed(2)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          margin: '4px 0 14px', fontSize: 11, color: 'var(--text-muted)',
        }}>
          <span style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          {t(lang, 'locationOrManual')}
          <span style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>

        {field(t(lang, 'locationLabel'), label, setLabel, 'text', t(lang, 'locationLabelHint'))}

        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1 }}>
            {field(t(lang, 'locationLat'), lat, setLat, 'number', '49.8298')}
          </div>
          <div style={{ flex: 1 }}>
            {field(t(lang, 'locationLon'), lon, setLon, 'number', '18.1721')}
          </div>
        </div>

        <button onClick={useGeoLocation} disabled={locating} className="btn btn-ghost"
          style={{ width: '100%', marginBottom: 14, justifyContent: 'center' }}>
          {locating ? `⟳ ${t(lang, 'locationLocating')}` : `📍 ${t(lang, 'locationUseMine')}`}
        </button>

        {field(t(lang, 'locationRadius'), radius, setRadius, 'number', '10')}

        {error && (
          <div style={{ color: 'var(--error)', fontSize: 12, marginBottom: 12 }}>{error}</div>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleSubmit} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
            {t(lang, 'actionSave')}
          </button>
          <button onClick={onClose} className="btn btn-ghost">
            {t(lang, 'actionCancel')}
          </button>
        </div>
      </div>
    </div>
  )
}
