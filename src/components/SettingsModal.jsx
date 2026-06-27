// src/components/SettingsModal.jsx
import { useRef } from 'react'
import { t, LANGUAGES, detectBrowserLanguage } from '../lib/i18n.js'
import { exportConfig, importConfig, clearConfig } from '../lib/config.js'

const THEME_OPTIONS = ['system', 'light', 'dark']
const UNITS_OPTIONS = ['metric', 'imperial']
const WIND_OPTIONS  = ['combined', 'ms', 'kmh', 'mph', 'beaufort']
const IQR_OPTIONS   = [1.0, 1.5, 2.0, 2.5, 3.0]
const REFRESH_OPTIONS = [
  { value: 0,  labelKey: 'refreshOff' },
  { value: 5,  labelKey: 'refresh5'   },
  { value: 15, labelKey: 'refresh15'  },
  { value: 30, labelKey: 'refresh30'  },
]

const API_KEY_META = [
  {
    service: 'owm',
    labelKey: 'keyOWM',
    hint: 'openweathermap.org/api',
    url: 'https://openweathermap.org/api',
    pattern: /^[a-f0-9]{32}$/i,
  },
  {
    service: 'windy',
    labelKey: 'keyWindy',
    hint: 'api.windy.com',
    url: 'https://api.windy.com',
    pattern: /^[A-Za-z0-9]{32,}$/,
  },
  {
    service: 'tomorrow',
    labelKey: 'keyTomorrow',
    hint: 'tomorrow.io',
    url: 'https://www.tomorrow.io',
    pattern: /^[A-Za-z0-9]{32,}$/,
  },
]

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: 'var(--text-muted)',
        marginBottom: 10,
        paddingBottom: 6,
        borderBottom: '1px solid var(--border)',
      }}>{title}</div>
      {children}
    </div>
  )
}

function SegmentedControl({ options, value, onChange, getLabel }) {
  return (
    <div style={{
      display: 'flex',
      gap: 2,
      background: 'var(--bg-elevated)',
      padding: 3,
      borderRadius: 'var(--radius-sm)',
      flexWrap: 'wrap',
    }}>
      {options.map(opt => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          style={{
            flex: 1,
            padding: '5px 10px',
            borderRadius: 4,
            border: 'none',
            fontSize: 12,
            fontWeight: 600,
            background: value === opt ? 'var(--bg-surface)' : 'transparent',
            color: value === opt ? 'var(--text-primary)' : 'var(--text-muted)',
            boxShadow: value === opt ? 'var(--shadow-sm)' : 'none',
            transition: 'all 0.15s',
            whiteSpace: 'nowrap',
          }}
        >{getLabel(opt)}</button>
      ))}
    </div>
  )
}

export function SettingsModal({ config, onSetPreference, onSetApiKey, onReplaceConfig, onClose, lang }) {
  const { preferences, apiKeys } = config
  const fileRef = useRef()

  const handleImport = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const imported = await importConfig(file)
      onReplaceConfig(imported)
    } catch (err) {
      alert('Import failed: ' + err.message)
    }
  }

  const handleClear = () => {
    if (confirm('Clear all data including API keys and locations?')) {
      clearConfig()
      window.location.reload()
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'var(--bg-overlay)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      zIndex: 100,
      padding: 0,
    }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0',
        width: '100%',
        maxWidth: 520,
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '24px 20px 32px',
      }}>
        {/* Handle */}
        <div style={{ width: 36, height: 4, background: 'var(--border)', borderRadius: 2, margin: '0 auto 20px' }} />

        {/* Title */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>{t(lang, 'settingsTitle')}</h2>
          <button onClick={onClose} className="btn-icon" style={{ fontSize: 18, lineHeight: 1 }}>×</button>
        </div>

        {/* Language */}
        <Section title={t(lang, 'settingsLanguage')}>
          <SegmentedControl
            options={LANGUAGES.map(l => l.code)}
            value={preferences.language}
            onChange={(v) => onSetPreference('language', v)}
            getLabel={(code) => {
              const l = LANGUAGES.find(x => x.code === code)
              if (code === 'auto') {
                const detected = LANGUAGES.find(x => x.code === detectBrowserLanguage())
                return `${l.flag} ${l.label} (${detected?.flag ?? ''})`
              }
              return `${l.flag} ${l.label}`
            }}
          />
        </Section>

        {/* Theme */}
        <Section title={t(lang, 'settingsTheme')}>
          <SegmentedControl
            options={THEME_OPTIONS}
            value={preferences.theme}
            onChange={(v) => onSetPreference('theme', v)}
            getLabel={(v) => t(lang, `theme${v.charAt(0).toUpperCase() + v.slice(1)}`)}
          />
        </Section>

        {/* Units */}
        <Section title={t(lang, 'settingsUnits')}>
          <SegmentedControl
            options={UNITS_OPTIONS}
            value={preferences.units}
            onChange={(v) => onSetPreference('units', v)}
            getLabel={(v) => t(lang, `units${v.charAt(0).toUpperCase() + v.slice(1)}`)}
          />
        </Section>

        {/* Wind display */}
        <Section title={t(lang, 'settingsWind')}>
          <SegmentedControl
            options={WIND_OPTIONS}
            value={preferences.windDisplay}
            onChange={(v) => onSetPreference('windDisplay', v)}
            getLabel={(v) => t(lang, `wind${v.charAt(0).toUpperCase() + v.slice(1)}`)}
          />
        </Section>

        {/* IQR factor */}
        <Section title={`${t(lang, 'settingsIQR')}: ${preferences.iqrFactor}`}>
          <SegmentedControl
            options={IQR_OPTIONS}
            value={preferences.iqrFactor}
            onChange={(v) => onSetPreference('iqrFactor', v)}
            getLabel={(v) => String(v)}
          />
        </Section>

        {/* Auto-refresh */}
        <Section title={t(lang, 'settingsRefresh')}>
          <SegmentedControl
            options={REFRESH_OPTIONS.map(r => r.value)}
            value={preferences.refreshIntervalMin}
            onChange={(v) => onSetPreference('refreshIntervalMin', v)}
            getLabel={(v) => {
              const opt = REFRESH_OPTIONS.find(r => r.value === v)
              return t(lang, opt?.labelKey ?? 'refreshOff')
            }}
          />
        </Section>

        {/* API keys */}
        <Section title={t(lang, 'settingsApiKeys')}>
          {API_KEY_META.map(({ service, labelKey, hint, url, pattern }) => {
            const val     = apiKeys[service] ?? ''
            const isValid = val.length > 0 && pattern.test(val)
            const isSet   = val.length > 0
            return (
              <div key={service} style={{ marginBottom: 14 }}>
                <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                    {t(lang, labelKey)}
                  </span>
                  {isSet && (
                    <span style={{ fontSize: 11, color: isValid ? 'var(--success)' : 'var(--warning)' }}>
                      {isValid ? '✓ ' + t(lang, 'keyValid') : '⚠ ' + t(lang, 'keyInvalid')}
                    </span>
                  )}
                </label>
                <input
                  className="input"
                  type="password"
                  value={val}
                  onChange={(e) => onSetApiKey(service, e.target.value)}
                  placeholder={`${t(lang, 'keyFreeHint')} ${hint}`}
                  style={{ fontFamily: 'monospace', fontSize: 12 }}
                />
                {!isSet && (
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                    {t(lang, 'keyFreeHint')}{' '}
                    <a href={url} target="_blank" rel="noopener noreferrer"
                      style={{ color: 'var(--accent)' }}>{hint}</a>
                  </div>
                )}
              </div>
            )
          })}
        </Section>

        {/* Data */}
        <Section title={t(lang, 'settingsData')}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn btn-ghost" onClick={() => exportConfig(config)}>
              ↓ {t(lang, 'actionExport')}
            </button>
            <button className="btn btn-ghost" onClick={() => fileRef.current?.click()}>
              ↑ {t(lang, 'actionImport')}
            </button>
            <button className="btn btn-ghost" onClick={handleClear}
              style={{ color: 'var(--error)', borderColor: 'var(--error)' }}>
              {t(lang, 'actionClearAll')}
            </button>
            <input ref={fileRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />
          </div>
        </Section>
      </div>
    </div>
  )
}
