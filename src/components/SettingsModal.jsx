// src/components/SettingsModal.jsx
import { useRef, useState, useEffect } from 'react'
import { t, LANGUAGES, detectBrowserLanguage } from '../lib/i18n.js'
import { exportConfig, importConfig, clearConfig } from '../lib/config.js'

const THEME_OPTIONS     = ['system', 'light', 'dark']
const FONT_SIZE_OPTIONS = ['small', 'medium', 'large', 'xl']
const UNITS_OPTIONS     = ['metric', 'imperial']
const WIND_OPTIONS      = ['combined', 'ms', 'kmh', 'mph', 'beaufort']
const IQR_OPTIONS       = [1.0, 1.5, 2.0, 2.5, 3.0]
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
    hint: 'api.windy.com/point-forecast',
    url: 'https://api.windy.com/point-forecast',
    pattern: /^[A-Za-z0-9]{32,}$/,
    noteKey: 'keyWindyNote',
    freePref: 'windyKeyFree',
  },
  {
    service: 'tomorrow',
    labelKey: 'keyTomorrow',
    hint: 'tomorrow.io',
    url: 'https://www.tomorrow.io',
    pattern: /^[A-Za-z0-9]{32,}$/,
  },
]

function Section({ title, hint, children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{
        fontSize: '0.6875rem',
        fontWeight: 700,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: 'var(--text-muted)',
        marginBottom: 10,
        paddingBottom: 6,
        borderBottom: '1px solid var(--border)',
      }}>{title}</div>
      {children}
      {hint && (
        <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: 7, lineHeight: 1.5 }}>
          {hint}
        </div>
      )}
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
            fontSize: '0.75rem',
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

const README_URL = 'https://github.com/honzabfu/jz-weatherfusion#readme'
const APPS_URL   = 'https://jan-zak.cz'

function isIos() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream
}

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches
    || navigator.standalone === true
}

export function SettingsModal({ config, onSetPreference, onSetApiKey, onReplaceConfig, onClose, lang }) {
  const { preferences, apiKeys } = config

  const fileRef = useRef()
  const [installPrompt, setInstallPrompt] = useState(null)
  const [installed, setInstalled]         = useState(isStandalone)

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault()
      setInstallPrompt(e)
    }
    const installedHandler = () => {
      setInstallPrompt(null)
      setInstalled(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', installedHandler)
    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      window.removeEventListener('appinstalled', installedHandler)
    }
  }, [])

  const handleInstall = async () => {
    if (!installPrompt) return
    installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    if (outcome === 'accepted') {
      setInstallPrompt(null)
      setInstalled(true)
    }
  }

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
        maxHeight: '90dvh',
        overflowY: 'auto',
        overflowX: 'hidden',
        padding: '24px 20px 32px',
        boxSizing: 'border-box',
      }}>
        {/* Handle */}
        <div style={{ width: 36, height: 4, background: 'var(--border)', borderRadius: 2, margin: '0 auto 20px' }} />

        {/* Title */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700 }}>{t(lang, 'settingsTitle')}</h2>
          <button onClick={onClose} className="btn-icon" style={{ fontSize: '1.125rem', lineHeight: 1 }}>×</button>
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

        {/* Font size */}
        <Section title={t(lang, 'settingsFontSize')}>
          <SegmentedControl
            options={FONT_SIZE_OPTIONS}
            value={preferences.fontSize ?? 'medium'}
            onChange={(v) => onSetPreference('fontSize', v)}
            getLabel={(v) => t(lang, `fontSize${v.charAt(0).toUpperCase() + v.slice(1)}`)}
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
        <Section title={t(lang, 'settingsWind')} hint={t(lang, 'hintWind')}>
          <SegmentedControl
            options={WIND_OPTIONS}
            value={preferences.windDisplay}
            onChange={(v) => onSetPreference('windDisplay', v)}
            getLabel={(v) => t(lang, `wind${v.charAt(0).toUpperCase() + v.slice(1)}`)}
          />
        </Section>

        {/* IQR factor */}
        <Section title={`${t(lang, 'settingsIQR')}: ${preferences.iqrFactor}`} hint={t(lang, 'hintIQR')}>
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
          {API_KEY_META.map(({ service, labelKey, hint, url, pattern, noteKey, freePref }) => {
            const val     = apiKeys[service] ?? ''
            const isValid = val.length > 0 && pattern.test(val)
            const isSet   = val.length > 0
            return (
              <div key={service} style={{ marginBottom: 14 }}>
                <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    {t(lang, labelKey)}
                  </span>
                  {isSet && (
                    <span style={{ fontSize: '0.6875rem', color: isValid ? 'var(--success)' : 'var(--warning)' }}>
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
                  style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}
                />
                {freePref && (
                  <label style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    marginTop: 8, cursor: 'pointer',
                  }}>
                    <input
                      type="checkbox"
                      checked={preferences[freePref] ?? true}
                      onChange={e => onSetPreference(freePref, e.target.checked)}
                      style={{ width: 14, height: 14, cursor: 'pointer', accentColor: 'var(--accent)' }}
                    />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {t(lang, freePref + 'Label')}
                    </span>
                  </label>
                )}
                {!isSet && (
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: 4 }}>
                    {t(lang, 'keyFreeHint')}{' '}
                    <a href={url} target="_blank" rel="noopener noreferrer"
                      style={{ color: 'var(--accent)' }}>{hint}</a>
                    {noteKey && (
                      <span style={{ display: 'block', marginTop: 2 }}>
                        → {t(lang, noteKey)}
                      </span>
                    )}
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

        {/* PWA install */}
        <Section title={t(lang, 'settingsPWA')}>
          {installed ? (
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
              ✓ {t(lang, 'pwaInstalled')}
            </p>
          ) : installPrompt ? (
            <button className="btn btn-ghost" onClick={handleInstall}>
              ↓ {t(lang, 'pwaInstallBtn')}
            </button>
          ) : isIos() ? (
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>
              {t(lang, 'pwaIosHint')}
            </p>
          ) : null}
        </Section>

        {/* About */}
        <div style={{
          borderTop: '1px solid var(--border)',
          paddingTop: 16,
          marginTop: 8,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 8,
        }}>
          <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
            {t(lang, 'appName')} v{__APP_VERSION__}
          </span>
          <div style={{ display: 'flex', gap: 12 }}>
            <a href={README_URL} target="_blank" rel="noopener noreferrer"
              style={{ fontSize: '0.6875rem', color: 'var(--accent)', textDecoration: 'none' }}>
              {t(lang, 'footerHelp')}
            </a>
            <a href={APPS_URL} target="_blank" rel="noopener noreferrer"
              style={{ fontSize: '0.6875rem', color: 'var(--accent)', textDecoration: 'none' }}>
              {t(lang, 'footerApps')}
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
