import { useEffect, useRef, useState } from 'react'
import Icon from './Icon'
import { formatDate } from './ui'

const SWIPE_THRESHOLD = 40

export default function PhotoLightbox({ photos, startIndex = 0, onClose }) {
  const [index, setIndex] = useState(startIndex)
  const touchStartX = useRef(null)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') setIndex((i) => Math.max(0, i - 1))
      if (e.key === 'ArrowRight') setIndex((i) => Math.min(photos.length - 1, i + 1))
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [photos.length, onClose])

  if (!photos || photos.length === 0) return null
  const photo = photos[index]

  function handleTouchStart(e) {
    touchStartX.current = e.touches[0].clientX
  }

  function handleTouchEnd(e) {
    if (touchStartX.current == null) return
    const deltaX = e.changedTouches[0].clientX - touchStartX.current
    touchStartX.current = null
    if (deltaX > SWIPE_THRESHOLD) setIndex((i) => Math.max(0, i - 1))
    else if (deltaX < -SWIPE_THRESHOLD) setIndex((i) => Math.min(photos.length - 1, i + 1))
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.92)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        style={{
          position: 'absolute',
          top: 16,
          right: 16,
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.12)',
          color: '#fff',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name="x" size={18} />
      </button>

      <div
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: '100%', maxHeight: '100%' }}
      >
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          {photos.length > 1 && index > 0 && (
            <button
              type="button"
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              aria-label="Previous photo"
              style={navButtonStyle('left')}
            >
              <Icon name="chevron-left" size={20} />
            </button>
          )}
          <img
            src={photo.dataUrl}
            alt=""
            style={{ maxWidth: '100%', maxHeight: '72vh', borderRadius: 12, display: 'block', objectFit: 'contain' }}
          />
          {photos.length > 1 && index < photos.length - 1 && (
            <button
              type="button"
              onClick={() => setIndex((i) => Math.min(photos.length - 1, i + 1))}
              aria-label="Next photo"
              style={navButtonStyle('right')}
            >
              <Icon name="chevron-right" size={20} />
            </button>
          )}
        </div>

        <div style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: 14, marginTop: 14 }}>{formatDate(photo.date)}</div>

        {photos.length > 1 && (
          <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
            {photos.map((p, i) => (
              <span
                key={p.id}
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: i === index ? '#fff' : 'rgba(255, 255, 255, 0.35)',
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function navButtonStyle(side) {
  return {
    position: 'absolute',
    [side]: 8,
    width: 36,
    height: 36,
    borderRadius: '50%',
    background: 'rgba(255, 255, 255, 0.12)',
    color: '#fff',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  }
}
