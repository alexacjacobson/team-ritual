import { useState, useEffect, useRef } from 'react'
import Timer from './components/Timer'
import Board from './components/Board'
import Synthesize from './components/Synthesize'
import InitialsModal from './components/InitialsModal'
import PastRituals from './components/PastRituals'

export default function App() {
  const [userInitials, setUserInitials] = useState(null)
  const [board, setBoard] = useState({ rose: [], bud: [], thorn: [] })
  const [synthesis, setSynthesis] = useState(null)
  const [synthesizing, setSynthesizing] = useState(false)
  const [clearConfirm, setClearConfirm] = useState(false)
  const [pastRitualsOpen, setPastRitualsOpen] = useState(false)
  const clearTimerRef = useRef(null)

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

  const handleJoin = (initials) => {
    localStorage.setItem('userInitials', initials)
    setUserInitials(initials)
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
          initials: userInitials || '',
        },
      ],
    }))
    try {
      await fetch('/api/board/card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ column, text, initials: userInitials || '' }),
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

  const saveRitual = async (board, synthesis) => {
    await fetch('/api/rituals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ board, synthesis }),
    })
  }

  const canSynthesize =
    board.rose.length > 0 && board.bud.length > 0 && board.thorn.length > 0

  return (
    <div className="app">
      {!userInitials && <InitialsModal onConfirm={handleJoin} />}
      <main className="main">
        <div className="page-header">
          <div className="page-title">
            <span className="page-title-eyebrow">
              {'Ritual:'.split('').map((char, i) => (
                <span
                  key={i}
                  className="wave-char"
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  {char}
                </span>
              ))}
            </span>
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
              className={`btn-clear${clearConfirm ? ' confirming' : ''}`}
              onClick={clearBoard}
            >
              {clearConfirm ? 'Are you sure?' : 'Clear board'}
            </button>
          </div>
          <Board board={board} onAdd={addCard} onDelete={deleteCard} />
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
