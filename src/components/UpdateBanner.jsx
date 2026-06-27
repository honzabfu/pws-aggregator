// src/components/UpdateBanner.jsx
import { useRegisterSW } from 'virtual:pwa-register/react'
import { t } from '../lib/i18n.js'

export function UpdateBanner({ lang }) {
  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW()

  if (!needRefresh) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: 0, left: 0, right: 0,
      zIndex: 200,
      background: 'var(--accent)',
      color: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 16px',
      gap: 12,
      fontSize: 13,
      fontWeight: 500,
    }}>
      <span>{t(lang, 'updateAvailable')}</span>
      <button
        onClick={() => updateServiceWorker(true)}
        style={{
          background: '#fff',
          color: 'var(--accent)',
          border: 'none',
          borderRadius: 'var(--radius-sm)',
          padding: '6px 14px',
          fontSize: 13,
          fontWeight: 700,
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        {t(lang, 'updateBtn')}
      </button>
    </div>
  )
}
