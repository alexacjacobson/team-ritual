import { useState, useEffect, useRef } from 'react'
import { RotateCcw } from 'lucide-react'

export default function Timer() {
  const [minutes, setMinutes] = useState(5)
  const [running, setRunning] = useState(false)
  const [remaining, setRemaining] = useState(300)
  const [hasStarted, setHasStarted] = useState(false)
  const startDurationRef = useRef(300)
  const runningRef = useRef(false)
  const intervalRef = useRef(null)

  useEffect(() => {
    runningRef.current = running
  }, [running])

  useEffect(() => {
    syncFromApi()
    const poll = setInterval(syncFromApi, 2500)
    return () => clearInterval(poll)
  }, [])

  const syncFromApi = async () => {
    if (runningRef.current) return
    try {
      const res = await fetch('/api/timer')
      if (!res.ok) return
      const data = await res.json()
      if (data.running) {
        const elapsed = (Date.now() - data.startedAt) / 1000
        const rem = Math.max(0, data.duration - elapsed)
        startDurationRef.current = data.duration
        setMinutes(Math.round(data.duration / 60))
        setRemaining(Math.ceil(rem))
        setRunning(true)
        setHasStarted(true)
      } else {
        startDurationRef.current = data.duration
        setMinutes(Math.round(data.duration / 60))
        setRemaining(data.duration)
      }
    } catch (_) {}
  }

  useEffect(() => {
    if (!running) {
      clearInterval(intervalRef.current)
      return
    }
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current)
          setRunning(false)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(intervalRef.current)
  }, [running])

  const toggleStartPause = async () => {
    if (running) {
      setRunning(false)
    } else {
      if (remaining === 0) setRemaining(startDurationRef.current)
      setRunning(true)
      setHasStarted(true)
      try {
        await fetch('/api/timer/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ duration: startDurationRef.current }),
        })
      } catch (_) {}
    }
  }

  const reset = async () => {
    setRunning(false)
    setHasStarted(false)
    setRemaining(startDurationRef.current)
    try {
      await fetch('/api/timer/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duration: startDurationRef.current }),
      })
    } catch (_) {}
  }

  const adjustMinutes = (delta) => {
    if (running) return
    const next = Math.max(1, Math.min(60, minutes + delta))
    setMinutes(next)
    setRemaining(next * 60)
    startDurationRef.current = next * 60
  }

  const mins = Math.floor(remaining / 60)
  const secs = remaining % 60
  const timeStr = `${mins}:${String(secs).padStart(2, '0')}`
  const expired = !running && remaining === 0

  return (
    <div className="timer">
      <div className="timer-display">
        <button
          className="btn-timer-step"
          onClick={() => adjustMinutes(-1)}
          disabled={running}
          aria-label="Decrease minutes"
        >
          −
        </button>
        <span className={`timer-time${expired ? ' expired' : ''}`}>
          {timeStr}
        </span>
        <button
          className="btn-timer-step"
          onClick={() => adjustMinutes(1)}
          disabled={running}
          aria-label="Increase minutes"
        >
          +
        </button>
      </div>
      <div className="timer-controls">
        {hasStarted && (
          <button
            className="btn-timer-undo"
            onClick={reset}
            aria-label="Reset timer"
          >
            <RotateCcw size={14} />
          </button>
        )}
        <button className="btn-timer-start" onClick={toggleStartPause}>
          {running ? 'Pause' : 'Start'}
        </button>
      </div>
    </div>
  )
}
