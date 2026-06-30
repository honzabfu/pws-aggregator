// src/hooks/useSwipeNav.js
import { useEffect, useRef } from 'react'

// Horizontal swipe navigation for touch devices. Fires `onSwipeLeft` /
// `onSwipeRight` when the user drags predominantly sideways past THRESHOLD.
// The gesture only commits once the horizontal travel clearly dominates the
// vertical one (|dx| > |dy| * AXIS_RATIO), so it never steals vertical scroll
// or the pull-to-refresh gesture, which are both vertical.
const THRESHOLD  = 60   // px of horizontal travel needed to fire
const AXIS_RATIO = 1.5  // how much |dx| must exceed |dy| to count as horizontal

// Walk up from the touched node; if any ancestor can actually scroll
// horizontally (e.g. the overflow-x:auto wrapper around the stations table),
// the swipe belongs to that element, not to tab navigation.
function startedInHorizontalScroller(node) {
  for (let el = node; el && el !== document.body; el = el.parentElement) {
    if (el.scrollWidth > el.clientWidth) {
      const ox = getComputedStyle(el).overflowX
      if (ox === 'auto' || ox === 'scroll') return true
    }
  }
  return false
}

export function useSwipeNav(onSwipeLeft, onSwipeRight, { disabled = false } = {}) {
  // Callbacks go through refs so the touch listeners stay registered once and
  // always see the latest handlers without re-subscribing.
  const onLeftRef  = useRef(onSwipeLeft)
  const onRightRef = useRef(onSwipeRight)
  onLeftRef.current  = onSwipeLeft
  onRightRef.current = onSwipeRight

  const startX = useRef(null)
  const startY = useRef(null)

  useEffect(() => {
    if (disabled) return

    const onStart = (e) => {
      if (e.touches.length !== 1 || startedInHorizontalScroller(e.target)) {
        startX.current = null
        return
      }
      startX.current = e.touches[0].clientX
      startY.current = e.touches[0].clientY
    }

    const onEnd = (e) => {
      if (startX.current === null) return
      const touch = e.changedTouches[0]
      const dx = touch.clientX - startX.current
      const dy = touch.clientY - startY.current
      startX.current = null
      startY.current = null
      // Only a clearly horizontal swipe past the threshold navigates.
      if (Math.abs(dx) < THRESHOLD || Math.abs(dx) < Math.abs(dy) * AXIS_RATIO) return
      if (dx < 0) onLeftRef.current?.()
      else        onRightRef.current?.()
    }

    window.addEventListener('touchstart',  onStart, { passive: true })
    window.addEventListener('touchend',    onEnd,   { passive: true })
    return () => {
      window.removeEventListener('touchstart', onStart)
      window.removeEventListener('touchend',   onEnd)
    }
  }, [disabled])
}
