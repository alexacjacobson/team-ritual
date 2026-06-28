import { useState, useEffect, useRef } from 'react'

export default function Timer() {
  const [minutes, setMinutes] = useState(5)
  const [timerState, setTimerState] = useState({
    running: false,
    startedAt: null,
    duration: 300,
  })
  const [displayTime, setDisplayTime] = useState(300)
  const rafRef = useRef(null)

  useEffect(() => {
    fetchTimer()
    const interval = setInterval(fetchTimer, 2500)
    return () => clearInterval(interval)
  }, [])

  const fetchTimer = async () => {
    try {
      const res = await fetch('/api/timer')
      if (res.ok) {
        const data = await res.json()
        setTimerState(data)
        if (!data.running) {
          setMinutes(Math.round(data.duration / 60))
        }
      }
    } catch (_) {}
  }

  useEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)

    if (!timerState.running) {
      setDisplayTime(timerState.duration)
      return
    }

    const tick = () => {
      const elapsed = (Date.now() - timerState.startedAt) / 1000
      const remaining = Math.max(0, timerState.duration - elapsed)
      setDisplayTime(Math.ceil(remaining))
      if (remaining > 0) {
        rafRef.current = requestAnimationFrame(tick)
      }
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [timerState])

  const start = async () => {
    const duration = Math.max(60, minutes * 60)
    try {
      await fetch('/api/timer/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duration }),
      })
      await fetchTimer()
    } catch (_) {}
  }

  const reset = async () => {
    try {
      await fetch('/api/timer/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duration: timerState.duration }),
      })
      await fetchTimer()
    } catch (_) {}
  }

  const mins = Math.floor(displayTime / 60)
  const secs = displayTime % 60
  const timeStr = `${mins}:${String(secs).padStart(2, '0')}`
  const expired = timerState.running && displayTime === 0

  return (
    <div className="timer">
      <div className="timer-display">
        <span className={`timer-time${expired ? ' expired' : ''}`}>
          {timeStr}
        </span>
      </div>
      <div className="timer-controls">
        {!timerState.running && (
          <div className="timer-input-wrap">
            <input
              className="timer-input"
              type="number"
              min="1"
              max="60"
              value={minutes}
              onChange={(e) =>
                setMinutes(Math.max(1, parseInt(e.target.value) || 1))
              }
              aria-label="Duration in minutes"
            />
            <span className="timer-input-label">min</span>
          </div>
        )}
        {timerState.running ? (
          <button className="btn-timer btn-timer-reset" onClick={reset}>
            Reset
          </button>
        ) : (
          <button className="btn-timer" onClick={start}>
            Start
          </button>
        )}
      </div>
    </div>
  )
}
