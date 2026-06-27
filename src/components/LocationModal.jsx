// src/components/LocationModal.jsx
import { useState } from 'react'
import { t } from '../lib/i18n.js'

export function LocationModal({ onAdd, onClose, lang }) {
  const [label,    setLabel]    = useState('')
  const [lat,      setLat]      = useState('')
  const [lon,      setLon]      = useState('')
  const [radius,   setRadius]   = useState('10')
  const [locating, setLocating] = useState(false)
  const [error,    setError]    = useState('')

  const useGeoLocation = () => {
    if (!navigator.geolocation) { setError('Geolocation not supported'); return }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(5))
        setLon(pos.coords.longitude.toFixed(5))
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
        padding: 24,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700 }}>{t(lang, 'locationAdd')}</h2>
          <button onClick={onClose} className="btn-icon" style={{ fontSize: 18 }}>×</button>
        </div>

        {field(t(lang, 'locationLabel'), label, setLabel, 'text', 'Ostrava-Poruba')}

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
          {locating ? '⟳ Locating…' : '📍 Use my location'}
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
