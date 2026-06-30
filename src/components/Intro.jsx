import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react'

const TEXT = 'Ritual: Retrospective'
const STAGGER = 0.04       // seconds between characters
const CHAR_DURATION = 0.6  // seconds per character fade

export default function Intro({ onComplete }) {
  const [phase, setPhase] = useState(1)
  const [name, setName] = useState('')
  const charRefs = useRef([])
  const enterRef = useRef(null)
  const screenRef = useRef(null)
  const fadeTimerRef = useRef(null)
  const rafRef = useRef(null)
  const mousePos = useRef({ x: -999, y: -999 })

  // Inject keyframe before first paint so animation is defined when chars render
  useLayoutEffect(() => {
    const style = document.createElement('style')
    style.textContent = `
      @keyframes intro-char-fade {
        from { opacity: 0; transform: translateY(20px); }
        to   { opacity: 1; transform: translateY(0); }
      }
    `
    document.head.appendChild(style)
    return () => document.head.removeChild(style)
  }, [])

  // After all chars finish fading, clear animation and hand off to wave
  useEffect(() => {
    const lastEnd = (TEXT.length - 1) * STAGGER + CHAR_DURATION
    const timer = setTimeout(() => {
      charRefs.current.forEach((el) => {
        if (!el) return
        el.removeAttribute('style')
        el.style.opacity = '1'
        el.style.transform = 'translateY(0)'
        el.style.transition = 'transform 0.08s ease-out'
      })
    }, lastEnd * 1000)
    return () => clearTimeout(timer)
  }, [])

  // Fade in Enter button at 2.2s
  useEffect(() => {
    const t = setTimeout(() => {
      if (enterRef.current) enterRef.current.style.opacity = '1'
    }, 2200)
    return () => clearTimeout(t)
  }, [])

  // Cleanup fade timer on unmount
  useEffect(() => {
    return () => { if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current) }
  }, [])

  // Wave effect: mouse proximity lifts characters
  const updateChars = useCallback(() => {
    const { x, y } = mousePos.current
    charRefs.current.forEach((el) => {
      if (!el) return
      const rect = el.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2)
      const lift = dist < 150 ? -30 * (1 - dist / 150) : 0
      el.style.transform = `translateY(${lift}px)`
    })
    rafRef.current = null
  }, [])

  useEffect(() => {
    const onMouseMove = (e) => {
      mousePos.current = { x: e.clientX, y: e.clientY }
      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(updateChars)
      }
    }
    window.addEventListener('mousemove', onMouseMove)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [updateChars])

  const goToPhase2 = () => {
    const el = screenRef.current
    if (!el) return
    // Fade out the ink screen
    el.style.transition = 'opacity 0.6s ease'
    el.style.opacity = '0'
    fadeTimerRef.current = setTimeout(() => {
      // Snap back to visible with gradient bg and card — no fade-in on card
      el.style.transition = 'none'
      el.style.opacity = '1'
      setPhase(2)
    }, 600)
  }

  const handleSubmit = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    localStorage.setItem('userName', trimmed)
    onComplete(trimmed)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSubmit()
  }

  const screenStyle = phase === 2
    ? {
        backgroundImage: "url('/gradient.png')",
        backgroundSize: 'cover',
        backgroundAttachment: 'fixed',
        backgroundColor: 'transparent',
      }
    : {}

  return (
    <div className="intro-screen" ref={screenRef} style={screenStyle}>
      {phase === 1 && (
        <>
          <div
            className="intro-title"
            style={{ fontSize: 'clamp(64px, 10vw, 140px)', letterSpacing: '-0.02em' }}
          >
            {TEXT.split('').map((char, i) => (
              <span
                key={i}
                ref={(el) => (charRefs.current[i] = el)}
                className="intro-char"
                style={{
                  opacity: 0,
                  animationName: 'intro-char-fade',
                  animationDuration: `${CHAR_DURATION}s`,
                  animationTimingFunction: 'ease',
                  animationFillMode: 'forwards',
                  animationDelay: `${i * STAGGER}s`,
                }}
              >
                {char === ' ' ? ' ' : char}
              </span>
            ))}
          </div>
          <button
            ref={enterRef}
            style={{
              opacity: 0,
              transition: 'opacity 0.6s ease',
              fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
              fontSize: '14px',
              fontWeight: 500,
              color: '#ffffff',
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.35)',
              borderRadius: '999px',
              padding: '12px 32px',
              cursor: 'pointer',
            }}
            onClick={goToPhase2}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)' }}
          >
            Enter
          </button>
        </>
      )}

      {phase === 2 && (
        <div className="intro-card">
          <p className="intro-card-label" style={{ fontSize: '18px' }}>
            What&rsquo;s your name?
          </p>
          <input
            className="intro-input"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{
              width: '280px',
              borderBottom: '1px solid rgba(255,255,255,0.5)',
              fontFamily: "'JetBrains Mono', monospace",
            }}
            autoFocus
          />
          <button
            className="intro-submit"
            onClick={handleSubmit}
            disabled={!name.trim()}
          >
            Begin →
          </button>
        </div>
      )}
    </div>
  )
}
