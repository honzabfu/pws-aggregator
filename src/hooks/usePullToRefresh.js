// src/hooks/usePullToRefresh.js
import { useEffect, useRef, useState } from 'react'

// Pull-to-refresh for touch devices. Activates only when the page is scrolled
// to the very top and the user drags downward; past THRESHOLD the gesture
// triggers `onRefresh`. Drag is dampened by RESISTANCE and capped at MAX_PULL
// so it feels rubber-band-y rather than 1:1 with the finger.
const THRESHOLD  = 70   // px of (dampened) pull needed to fire a refresh
const MAX_PULL   = 110  // px the indicator can travel at most
const RESISTANCE = 0.5  // finger-to-pull ratio

export function usePullToRefresh(onRefresh, { disabled = false } = {}) {
  const [pullDistance, setPullDistance] = useState(0)
  const [refreshing, setRefreshing]     = useState(false)

  // Logic reads/writes go through refs so the touch listeners can stay
  // registered once for the lifetime of the gesture (no re-subscribing on
  // every move). State mirrors are only for rendering.
  const startY        = useRef(null)
  const pulling       = useRef(false)
  const pullRef       = useRef(0)
  const refreshingRef = useRef(false)
  const onRefreshRef  = useRef(onRefresh)
  onRefreshRef.current = onRefresh

  const setPull = (d) => { pullRef.current = d; setPullDistance(d) }
  const setBusy = (v) => { refreshingRef.current = v; setRefreshing(v) }

  useEffect(() => {
    if (disabled) return

    const onStart = (e) => {
      if (refreshingRef.current) return
      // Only begin a pull from the top, with a single finger.
      if (window.scrollY > 0 || e.touches.length !== 1) { startY.current = null; return }
      startY.current = e.touches[0].clientY
      pulling.current = false
    }

    const onMove = (e) => {
      if (startY.current === null || refreshingRef.current) return
      const dy = e.touches[0].clientY - startY.current
      // Upward drag, or the page scrolled away from the top — abandon the pull.
      if (dy <= 0 || window.scrollY > 0) {
        if (pulling.current) { pulling.current = false; setPull(0) }
        return
      }
      pulling.current = true
      setPull(Math.min(MAX_PULL, dy * RESISTANCE))
      // Suppress the browser's native overscroll/bounce while we own the gesture.
      if (e.cancelable) e.preventDefault()
    }

    const onEnd = async () => {
      if (startY.current === null) return
      const trigger = pulling.current && pullRef.current >= THRESHOLD
      startY.current = null
      pulling.current = false
      if (trigger) {
        setBusy(true)
        setPull(THRESHOLD)
        try { await onRefreshRef.current?.() }
        finally { setBusy(false); setPull(0) }
      } else {
        setPull(0)
      }
    }

    window.addEventListener('touchstart',  onStart, { passive: true })
    window.addEventListener('touchmove',   onMove,  { passive: false })
    window.addEventListener('touchend',    onEnd)
    window.addEventListener('touchcancel', onEnd)
    return () => {
      window.removeEventListener('touchstart',  onStart)
      window.removeEventListener('touchmove',   onMove)
      window.removeEventListener('touchend',    onEnd)
      window.removeEventListener('touchcancel', onEnd)
    }
  }, [disabled])

  return { pullDistance, refreshing, threshold: THRESHOLD }
}
