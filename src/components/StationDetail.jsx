// src/components/StationDetail.jsx
import { displayTemp, displayPressure, displayWind, displayPrecip, windDirLabel, haversineKm, displayDistance } from '../lib/units.js'
import { Compass } from './Compass.jsx'
import { t, resolveLanguage } from '../lib/i18n.js'

const SOURCE_COLORS = {
  'open-meteo': 'var(--accent)',
  'owm':        'var(--success)',
  'windy':      'var(--metric-wind)',
  'tomorrow':   'var(--metric-uv)',
}

export function StationDetail({ reading, prefs, langStrings, onBack, origin }) {
  const lang   = resolveLanguage(prefs.language)
  const { metrics } = reading

  const distKm = origin && reading.lat != null && reading.lon != null
    ? haversineKm(origin.lat, origin.lon, reading.lat, reading.lon)
    : null
  const distD  = displayDistance(distKm, prefs.units)

  const tempD  = displayTemp(metrics.temp, prefs.units)
  const pressD = displayPressure(metrics.pressure, prefs.units)
  const windD  = displayWind(metrics.windSpeed, prefs.windDisplay, lang, langStrings)
  const precipD = displayPrecip(metrics.precip, prefs.units)

  const srcColor = SOURCE_COLORS[reading.source] ?? 'var(--text-muted)'
  const isApprox        = reading.approximate
  const isOutlier       = reading.isOutlier
  const isModelExcluded = reading.excludedBySourceType

  const statusIcon  = isApprox ? '≈' : isOutlier ? '○' : isModelExcluded ? '◇' : '●'
  const statusColor = isApprox ? 'var(--warning)' : isOutlier ? 'var(--text-muted)' : isModelExcluded ? 'var(--text-muted)' : 'var(--success)'
  const statusLabel = isApprox
    ? t(lang, 'stationApprox')
    : isOutlier
      ? t(lang, 'stationExcl')
      : isModelExcluded
        ? t(lang, 'stationModelExcl')
        : t(lang, 'stationActive')

  const metricRows = [
    { label: t(lang, 'metricTemp'),     value: tempD.value  !== null ? `${tempD.value} ${tempD.unit}`   : null, color: 'var(--metric-temp)',   icon: '🌡' },
    { label: t(lang, 'metricHumidity'), value: metrics.humidity !== null ? `${metrics.humidity} %`       : null, color: 'var(--metric-humid)',  icon: '💧' },
    { label: t(lang, 'metricPressure'), value: pressD.value !== null ? `${pressD.value} ${pressD.unit}` : null, color: 'var(--metric-press)',  icon: '◾' },
    { label: t(lang, 'metricClouds'),   value: metrics.clouds  !== null ? `${metrics.clouds} %`          : null, color: 'var(--metric-cloud)',  icon: '☁' },
    { label: t(lang, 'metricPrecip'),   value: precipD.value !== null ? `${precipD.value} ${precipD.unit}` : null, color: 'var(--metric-precip)', icon: '🌧' },
    { label: t(lang, 'metricUV'),       value: metrics.uvIndex !== null ? `${metrics.uvIndex}`            : null, color: 'var(--metric-uv)',    icon: '☀' },
  ]

  const hasWind = metrics.windSpeed !== null || metrics.windDeg !== null

  return (
    <div>
      {/* Back button */}
      <button
        onClick={onBack}
        style={{
          background: 'transparent', border: 'none',
          color: 'var(--accent)', fontSize: '0.8125rem', fontWeight: 600,
          cursor: 'pointer', padding: '0 0 16px 0',
          display: 'flex', alignItems: 'center', gap: 6,
        }}
      >
        ← {t(lang, 'actionBack')}
      </button>

      {/* Header card */}
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderLeft: `4px solid ${srcColor}`,
        borderRadius: 'var(--radius-lg)',
        padding: '16px 18px',
        marginBottom: 16,
      }}>
        <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 6 }}>
          {reading.stationName}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{
            fontSize: '0.625rem', fontWeight: 700, fontFamily: 'monospace',
            letterSpacing: '0.04em', color: srcColor,
          }}>{reading.source.toUpperCase()}</span>
          {reading.sourceType && (
            <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
              {t(lang, reading.sourceType === 'station' ? 'sourceTypeStation' : 'sourceTypeModel')}
            </span>
          )}
          <span style={{ color: statusColor, fontSize: '0.75rem' }}>{statusIcon}</span>
          <span style={{ fontSize: '0.6875rem', color: statusColor }}>
            {statusLabel.split('—')[0].trim()}
          </span>
        </div>

        {(reading.lat != null || reading.fetchedAt) && (
          <div style={{
            fontSize: '0.6875rem', color: 'var(--text-muted)',
            fontFamily: 'monospace', marginTop: 10, lineHeight: 1.8,
          }}>
            {reading.lat != null && (
              <div>{reading.lat.toFixed(4)}° N, {reading.lon.toFixed(4)}° E</div>
            )}
            {distD.value !== null && (
              <div>{t(lang, 'stationDistance')}: {distD.value} {distD.unit}</div>
            )}
            {reading.fetchedAt && (
              <div>{t(lang, 'stationFetchedAt')}: {new Date(reading.fetchedAt).toLocaleTimeString()}</div>
            )}
          </div>
        )}
      </div>

      {/* Metric rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
        {metricRows.map(({ label, value, color, icon }) => (
          <div key={label} style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderLeft: `3px solid ${color}`,
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            opacity: value === null ? 0.4 : 1,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>{icon}</span>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{label}</span>
            </div>
            <span style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '1rem' }}>
              {value ?? '—'}
            </span>
          </div>
        ))}
      </div>

      {/* Wind card */}
      {hasWind && (
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderLeft: '3px solid var(--metric-wind)',
          borderRadius: 'var(--radius-md)',
          padding: '16px',
          display: 'flex', alignItems: 'center', gap: 16,
        }}>
          {metrics.windDeg !== null && (
            <Compass deg={metrics.windDeg} lang={lang} size={72} />
          )}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>💨</span>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{t(lang, 'metricWind')}</span>
            </div>
            {windD.value !== null && (
              <div style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '1rem' }}>
                {windD.value}
                <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginLeft: 4 }}>
                  {windD.unit}
                </span>
              </div>
            )}
            {windD.beaufort !== null && windD.label && (
              <div style={{ fontSize: '0.6875rem', color: 'var(--metric-wind)', fontWeight: 600, marginTop: 2 }}>
                Bft {windD.beaufort} · {windD.label}
              </div>
            )}
            {metrics.windDeg !== null && (
              <div style={{ fontSize: '0.875rem', fontWeight: 600, marginTop: 4 }}>
                {windDirLabel(metrics.windDeg, lang)}
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 6, fontFamily: 'monospace' }}>
                  {metrics.windDeg}°
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
