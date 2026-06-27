// src/components/Compass.jsx
import { windDirLabel } from '../lib/units.js'

export function Compass({ deg, lang = 'en', size = 80 }) {
  if (deg === null || deg === undefined) return null
  const rad = (deg - 90) * Math.PI / 180
  const cx = size / 2, cy = size / 2, r = size * 0.38
  const cardinals = lang === 'cs'
    ? ['S', 'V', 'J', 'Z']
    : lang === 'es'
    ? ['N', 'E', 'S', 'O']
    : ['N', 'E', 'S', 'W']

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Outer ring */}
      <circle cx={cx} cy={cy} r={r + 10} fill="none" stroke="var(--border)" strokeWidth="1" />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--border)" strokeWidth="1.5" />

      {/* Cardinal labels */}
      {cardinals.map((d, i) => {
        const a = i * 90 * Math.PI / 180
        return (
          <text key={d}
            x={cx + (r + 18) * Math.cos(a - Math.PI / 2)}
            y={cy + (r + 18) * Math.sin(a - Math.PI / 2)}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={size * 0.1}
            fill="var(--text-muted)"
            fontFamily="monospace"
            fontWeight="600"
          >{d}</text>
        )
      })}

      {/* Tick marks */}
      {Array.from({ length: 16 }, (_, i) => {
        const a = i * 22.5 * Math.PI / 180
        const inner = i % 4 === 0 ? r - 8 : r - 4
        return (
          <line key={i}
            x1={cx + inner * Math.cos(a - Math.PI / 2)}
            y1={cy + inner * Math.sin(a - Math.PI / 2)}
            x2={cx + r * Math.cos(a - Math.PI / 2)}
            y2={cy + r * Math.sin(a - Math.PI / 2)}
            stroke="var(--border)"
            strokeWidth={i % 4 === 0 ? 1.5 : 1}
          />
        )
      })}

      {/* Arrow */}
      <line
        x1={cx} y1={cy}
        x2={cx + r * 0.75 * Math.cos(rad)}
        y2={cy + r * 0.75 * Math.sin(rad)}
        stroke="var(--metric-wind)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* Counter arrow (tail) */}
      <line
        x1={cx} y1={cy}
        x2={cx - r * 0.3 * Math.cos(rad)}
        y2={cy - r * 0.3 * Math.sin(rad)}
        stroke="var(--metric-wind)"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.4"
      />
      <circle cx={cx} cy={cy} r="3" fill="var(--metric-wind)" />
    </svg>
  )
}
