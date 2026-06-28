import { useState } from 'react'

export default function InitialsModal({ onConfirm }) {
  const [value, setValue] = useState('')

  const handleConfirm = () => {
    const trimmed = value.trim().toUpperCase().slice(0, 3)
    if (!trimmed) return
    onConfirm(trimmed)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleConfirm()
  }

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <p className="modal-label">What are your initials?</p>
        <input
          className="modal-input"
          type="text"
          maxLength={3}
          placeholder="e.g. AJ"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
        />
        <button
          className="btn-join"
          onClick={handleConfirm}
          disabled={!value.trim()}
        >
          Join
        </button>
      </div>
    </div>
  )
}
