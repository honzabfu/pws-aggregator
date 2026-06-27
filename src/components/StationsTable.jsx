// src/components/StationsTable.jsx
import { displayTemp, displayPressure, displayWind, windDirLabel } from '../lib/units.js'
import { t } from '../lib/i18n.js'

export function StationsTable({ readings, prefs, langStrings }) {
  const lang = prefs.language

  if (!readings || readings.length === 0) {
    return (
      <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '32px 0', fontSize: '0.8125rem' }}>
        No station data
      </div>
    )
  }

  const sourceColors = {
    'open-meteo': 'var(--accent)',
    'owm':        'var(--success)',
    'windy':      'var(--metric-wind)',
    'tomorrow':   'var(--metric-uv)',
  }

  return (
    <div style={{ overflowX: 'auto', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
            {['', t(lang, 'stationSource'), t(lang, 'stationName'),
              'T', 'RH%', 'P hPa', 'WS', 'Dir', '☁%'].map((h, i) => (
              <th key={i} style={{
                padding: '8px 10px',
                color: 'var(--text-muted)',
                textAlign: i === 2 ? 'left' : 'center',
                whiteSpace: 'nowrap',
                fontWeight: 600,
                fontSize: '0.6875rem',
                letterSpacing: '0.05em',
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {readings.map((r, i) => {
            const tempD   = displayTemp(r.metrics.temp, prefs.units)
            const windD   = displayWind(r.metrics.windSpeed, prefs.windDisplay, lang, langStrings)
            const pressD  = displayPressure(r.metrics.pressure, prefs.units)
            const srcColor = sourceColors[r.source] ?? 'var(--text-muted)'
            const isOutlier        = r.isOutlier
            const isApprox         = r.approximate
            const isModelExcluded  = r.excludedBySourceType
            const isDimmed         = isOutlier || isApprox || isModelExcluded

            return (
              <tr key={r.stationId + i} style={{
                borderBottom: '1px solid var(--border)',
                opacity: isDimmed ? 0.45 : 1,
                background: isDimmed ? 'var(--bg-base)' : undefined,
              }}>
                {/* Status indicator */}
                <td style={{ padding: '7px 6px 7px 10px', width: 16 }}>
                  {isApprox
                    ? <span title={t(lang, 'stationApprox')} style={{ fontSize: '0.75rem', color: 'var(--warning)' }}>≈</span>
                    : isOutlier
                      ? <span title={t(lang, 'stationExcl')} style={{ fontSize: '0.75rem' }}>○</span>
                      : isModelExcluded
                        ? <span title={t(lang, 'stationModelExcl')} style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>◇</span>
                        : <span title={t(lang, 'stationActive')} style={{ fontSize: '0.75rem', color: 'var(--success)' }}>●</span>
                  }
                </td>

                {/* Source badge */}
                <td style={{ padding: '7px 10px', whiteSpace: 'nowrap' }}>
                  <span style={{
                    fontSize: '0.625rem',
                    fontWeight: 700,
                    color: srcColor,
                    fontFamily: 'monospace',
                    letterSpacing: '0.04em',
                  }}>{r.source.toUpperCase()}</span>
                  {r.sourceType && (
                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: 1 }}>
                      {t(lang, r.sourceType === 'station' ? 'sourceTypeStation' : 'sourceTypeModel')}
                    </div>
                  )}
                </td>

                {/* Station name */}
                <td style={{
                  padding: '7px 10px',
                  color: 'var(--text-secondary)',
                  maxWidth: 180,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>{r.stationName}</td>

                {/* Metrics */}
                <td style={{ padding: '7px 10px', textAlign: 'center', fontFamily: 'monospace', fontWeight: 600 }}>
                  {tempD.value !== null ? `${tempD.value}${tempD.unit}` : '—'}
                </td>
                <td style={{ padding: '7px 10px', textAlign: 'center', fontFamily: 'monospace' }}>
                  {r.metrics.humidity !== null ? `${r.metrics.humidity}` : '—'}
                </td>
                <td style={{ padding: '7px 10px', textAlign: 'center', fontFamily: 'monospace' }}>
                  {pressD.value !== null ? `${pressD.value}` : '—'}
                </td>
                <td style={{ padding: '7px 10px', textAlign: 'center', fontFamily: 'monospace' }}>
                  {windD.value !== null ? `${windD.value} ${windD.unit}` : '—'}
                </td>
                <td style={{ padding: '7px 10px', textAlign: 'center', fontFamily: 'monospace' }}>
                  {r.metrics.windDeg !== null ? windDirLabel(r.metrics.windDeg, lang) : '—'}
                </td>
                <td style={{ padding: '7px 10px', textAlign: 'center', fontFamily: 'monospace' }}>
                  {r.metrics.clouds !== null ? `${r.metrics.clouds}` : '—'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
