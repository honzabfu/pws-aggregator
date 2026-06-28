// src/components/MetricCard.jsx
import { displayTemp, displayPressure, displayWind, displayPrecip } from '../lib/units.js'
import { t, resolveLanguage } from '../lib/i18n.js'
import { getIcons } from '../lib/icons.js'

const METRIC_COLORS = {
  temp:      'var(--metric-temp)',
  humidity:  'var(--metric-humid)',
  pressure:  'var(--metric-press)',
  windSpeed: 'var(--metric-wind)',
  clouds:    'var(--metric-cloud)',
  precip:    'var(--metric-precip)',
  uvIndex:   'var(--metric-uv)',
}

function getDisplay(metric, data, prefs, langStrings, lang) {
  const val = data?.value ?? null
  switch (metric) {
    case 'temp':      return displayTemp(val, prefs.units)
    case 'humidity':  return { value: val, unit: '%' }
    case 'pressure':  return displayPressure(val, prefs.units)
    case 'windSpeed': return displayWind(val, prefs.windDisplay, lang, langStrings)
    case 'clouds':    return { value: val, unit: '%' }
    case 'precip':    return displayPrecip(val, prefs.units)
    case 'uvIndex':   return { value: val, unit: '' }
    default:          return { value: val, unit: '' }
  }
}

export function MetricCard({ metric, label, data, prefs, langStrings, style, hero = false, onClick }) {
  const lang    = resolveLanguage(prefs.language)
  const display = getDisplay(metric, data, prefs, langStrings, lang)
  const color   = METRIC_COLORS[metric]
  const icon    = getIcons(prefs.iconSet)[metric]
  const hasData = display.value !== null

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick() } : undefined}
      style={{
        background: 'var(--bg-surface)',
        border: `1px solid var(--border)`,
        borderRadius: 'var(--radius-lg)',
        padding: hero ? '20px 22px' : '16px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        borderTop: `3px solid ${color}`,
        cursor: onClick ? 'pointer' : undefined,
        ...style,
      }}
    >
      {/* Label row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>{icon}</span>
        <span className="label-xs">{label}</span>
      </div>

      {/* Value */}
      <div style={{
        fontSize: hero ? '3rem' : '2rem',
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
            <span style={{ color: 'var(--warning)', marginLeft: 6 }}>−{t(lang, 'outliersRemoved', data.removed)}</span>
          )}
          {data.min !== null && data.max !== null && (
            <span style={{ marginLeft: 6 }}>({data.min}–{data.max})</span>
          )}
          {data.usedFallback && (
            <span
              title={t(lang, 'fallbackHint')}
              style={{ color: 'var(--metric-uv)', marginLeft: 6 }}
            >🛰 {t(lang, 'sourceTypeModel')}</span>
          )}
        </div>
      )}
    </div>
  )
}
