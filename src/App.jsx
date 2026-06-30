import { useState, useEffect, useRef, useCallback } from 'react'
import Timer from './components/Timer'
import Board from './components/Board'
import Synthesize from './components/Synthesize'
import Intro from './components/Intro'
import PastRituals from './components/PastRituals'
import FacilitatorGuide from './components/FacilitatorGuide'

export default function App() {
  const [showIntro, setShowIntro] = useState(true)
  const [userName, setUserName] = useState('')
  const [board, setBoard] = useState({ rose: [], bud: [], thorn: [] })
  const [synthesis, setSynthesis] = useState(null)
  const [synthesizing, setSynthesizing] = useState(false)
  const [clearConfirm, setClearConfirm] = useState(false)
  const [pastRitualsOpen, setPastRitualsOpen] = useState(false)
  const [reflectPrompts, setReflectPrompts] = useState(null)
  const [reflectLoading, setReflectLoading] = useState(false)
  const clearTimerRef = useRef(null)
  const waveCharRefs = useRef([])
  const waveRafRef = useRef(null)
  const waveMouse = useRef({ x: -999, y: -999 })

  const updateWaveChars = useCallback(() => {
    const { x, y } = waveMouse.current
    waveCharRefs.current.forEach((el) => {
      if (!el) return
      const rect = el.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2)
      const lift = dist < 150 ? -30 * (1 - dist / 150) : 0
      el.style.transform = `translateY(${lift}px)`
    })
    waveRafRef.current = null
  }, [])

  useEffect(() => {
    const onMouseMove = (e) => {
      waveMouse.current = { x: e.clientX, y: e.clientY }
      if (!waveRafRef.current) {
        waveRafRef.current = requestAnimationFrame(updateWaveChars)
      }
    }
    window.addEventListener('mousemove', onMouseMove)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      if (waveRafRef.current) cancelAnimationFrame(waveRafRef.current)
    }
  }, [updateWaveChars])

  useEffect(() => {
    fetchBoard()
    const interval = setInterval(fetchBoard, 2500)
    return () => clearInterval(interval)
  }, [])

  const fetchBoard = async () => {
    try {
      const res = await fetch('/api/board')
      if (res.ok) setBoard(await res.json())
    } catch (_) {}
  }

  const addCard = async (column, text) => {
    const tempId = `temp-${Date.now()}`
    setBoard((prev) => ({
      ...prev,
      [column]: [
        ...prev[column],
        {
          id: tempId,
          text,
          createdAt: new Date().toISOString(),
          name: userName || '',
        },
      ],
    }))
    try {
      await fetch('/api/board/card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ column, text, name: userName || '' }),
      })
    } catch (_) {}
  }

  const deleteCard = async (column, id) => {
    setBoard((prev) => ({
      ...prev,
      [column]: prev[column].filter((c) => c.id !== id),
    }))
    try {
      await fetch(`/api/board/card/${id}`, { method: 'DELETE' })
    } catch (_) {}
  }

  const clearBoard = async () => {
    if (!clearConfirm) {
      setClearConfirm(true)
      clearTimerRef.current = setTimeout(() => setClearConfirm(false), 3000)
      return
    }
    clearTimeout(clearTimerRef.current)
    setClearConfirm(false)
    setSynthesis(null)
    setBoard({ rose: [], bud: [], thorn: [] })
    try {
      await fetch('/api/board', { method: 'DELETE' })
    } catch (_) {}
  }

  const synthesize = async () => {
    setSynthesizing(true)
    setSynthesis(null)
    try {
      const res = await fetch('/api/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(board),
      })
      setSynthesis(await res.json())
    } catch (_) {
      setSynthesis({ error: 'Failed to synthesize. Please try again.' })
    } finally {
      setSynthesizing(false)
    }
  }

  const toggleReflect = async () => {
    if (reflectPrompts !== null) {
      setReflectPrompts(null)
      return
    }
    setReflectLoading(true)
    try {
      const res = await fetch('/api/reflection-prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(board),
      })
      const data = await res.json()
      setReflectPrompts(
        data.rose && data.bud && data.thorn ? data : null
      )
    } catch (_) {
      setReflectPrompts(null)
    } finally {
      setReflectLoading(false)
    }
  }

  const saveRitual = async (board, synthesis) => {
    await fetch('/api/rituals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ board, synthesis }),
    })
  }

  if (showIntro) {
    return (
      <Intro
        onComplete={(name) => {
          setUserName(name)
          setShowIntro(false)
        }}
      />
    )
  }

  const canSynthesize =
    board.rose.length > 0 && board.bud.length > 0 && board.thorn.length > 0

  return (
    <div className="app">
      <main className="main">
        <div className="page-header">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'flex-start' }}>
            <FacilitatorGuide />
            <div className="page-title">
              <span className="page-title-eyebrow">
                {'Ritual: Retrospective'.split('').map((char, i) => (
                  <span
                    key={i}
                    ref={(el) => (waveCharRefs.current[i] = el)}
                    className="wave-char"
                    style={{ display: 'inline-block', animation: 'none', transition: 'transform 0.08s ease-out' }}
                  >
                    {char === ' ' ? ' ' : char}
                  </span>
                ))}
              </span>
            </div>
          </div>
          <div className="page-header-right">
            <button
              className="btn-past-rituals"
              onClick={() => setPastRitualsOpen(true)}
            >
              Past rituals
            </button>
            <Timer />
          </div>
        </div>
        <div className="board-card">
          <div className="board-card-top">
            <button
              className="btn-reflect"
              onClick={toggleReflect}
              disabled={reflectLoading}
            >
              {reflectLoading
                ? <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--ash)' }}>Thinking...</span>
                : reflectPrompts !== null ? 'Hide prompts' : 'Generate prompts'
              }
            </button>
            <button
              className={`btn-clear${clearConfirm ? ' confirming' : ''}`}
              onClick={clearBoard}
            >
              {clearConfirm ? 'Are you sure?' : 'Clear board'}
            </button>
          </div>
          <Board board={board} onAdd={addCard} onDelete={deleteCard} prompts={reflectPrompts} />
          <Synthesize
            canSynthesize={canSynthesize}
            synthesizing={synthesizing}
            synthesis={synthesis}
            onSynthesize={synthesize}
            board={board}
            onSave={saveRitual}
          />
        </div>
      </main>
      {pastRitualsOpen && (
        <PastRituals onClose={() => setPastRitualsOpen(false)} />
      )}
    </div>
  )
}
