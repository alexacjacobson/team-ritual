import { useState } from 'react'
import Card from './Card'

export default function Column({ column, label, color, cards, onAdd, onDelete }) {
  const [text, setText] = useState('')

  const handleAdd = () => {
    const trimmed = text.trim()
    if (!trimmed) return
    onAdd(column, trimmed)
    setText('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleAdd()
  }

  return (
    <div className="column">
      <h2 className="column-label" style={{ color }}>
        {label}
      </h2>
      <div className="column-input-row">
        <input
          className="card-input"
          type="text"
          placeholder={`Add a ${label.toLowerCase()}...`}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          className="btn-add"
          onClick={handleAdd}
          disabled={!text.trim()}
          aria-label={`Add ${label}`}
        >
          +
        </button>
      </div>
      <div className="cards">
        {cards.map((card) => (
          <Card
            key={card.id}
            card={card}
            color={color}
            onDelete={() => onDelete(column, card.id)}
          />
        ))}
      </div>
    </div>
  )
}
