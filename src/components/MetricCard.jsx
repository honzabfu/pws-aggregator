// src/components/MetricCard.jsx
import { displayTemp, displayPressure, displayWind, displayPrecip } from '../lib/units.js'

const METRIC_COLORS = {
  temp:      'var(--metric-temp)',
  humidity:  'var(--metric-humid)',
  pressure:  'var(--metric-press)',
  windSpeed: 'var(--metric-wind)',
  clouds:    'var(--metric-cloud)',
  precip:    'var(--metric-precip)',
  uvIndex:   'var(--metric-uv)',
}

const METRIC_ICONS = {
  temp:      '🌡',
  humidity:  '💧',
  pressure:  '◾',
  windSpeed: '💨',
  clouds:    '☁',
  precip:    '🌧',
  uvIndex:   '☀',
}

function getDisplay(metric, data, prefs, langStrings) {
  const val = data?.value ?? null
  switch (metric) {
    case 'temp':      return displayTemp(val, prefs.units)
    case 'humidity':  return { value: val, unit: '%' }
    case 'pressure':  return displayPressure(val, prefs.units)
    case 'windSpeed': return displayWind(val, prefs.windDisplay, prefs.language, langStrings)
    case 'clouds':    return { value: val, unit: '%' }
    case 'precip':    return displayPrecip(val, prefs.units)
    case 'uvIndex':   return { value: val, unit: '' }
    default:          return { value: val, unit: '' }
  }
}

export function MetricCard({ metric, label, data, prefs, langStrings, style }) {
  const display = getDisplay(metric, data, prefs, langStrings)
  const color   = METRIC_COLORS[metric]
  const icon    = METRIC_ICONS[metric]
  const hasData = display.value !== null

  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: `1px solid var(--border)`,
      borderRadius: 'var(--radius-lg)',
      padding: '16px 18px',
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
      borderTop: `3px solid ${color}`,
      ...style,
    }}>
      {/* Label row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: '0.875rem' }}>{icon}</span>
        <span className="label-xs">{label}</span>
      </div>

      {/* Value */}
      <div style={{
        fontSize: '2rem',
        fontWeight: 700,
        color: hasData ? 'var(--text-primary)' : 'var(--text-muted)',
        fontVariantNumeric: 'tabular-nums',
        lineHeight: 1.1,
        marginTop: 4,
      }}>
        {hasData ? display.value : '—'}
        {hasData && <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginLeft: 4 }}>{display.unit}</span>}
      </div>

      {/* Beaufort combined label */}
      {display.combined && display.beaufort !== null && display.label && (
        <div style={{ fontSize: '0.6875rem', color: color, fontWeight: 600 }}>
          Bft {display.beaufort} · {display.label}
        </div>
      )}

      {/* Stats row */}
      {data && (
        <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: 2 }}>
          {data.contributors}/{data.total}
          {data.removed > 0 && (
            <span style={{ color: 'var(--warning)', marginLeft: 6 }}>−{data.removed} outlier{data.removed !== 1 ? 's' : ''}</span>
          )}
          {data.min !== null && data.max !== null && (
            <span style={{ marginLeft: 6 }}>({data.min}–{data.max})</span>
          )}
        </div>
      )}
    </div>
  )
}
