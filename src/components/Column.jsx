import { useState, useRef } from 'react'
import Card from './Card'

export default function Column({ column, label, color, cards, onAdd, onDelete, prompts }) {
  const [text, setText] = useState('')
  const textareaRef = useRef(null)

  const handleAdd = () => {
    const trimmed = text.trim()
    if (!trimmed) return
    onAdd(column, trimmed)
    setText('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleAdd()
    }
  }

  const handleInput = (e) => {
    e.target.style.height = 'auto'
    e.target.style.height = e.target.scrollHeight + 'px'
  }

  return (
    <div className="column">
      <h2 className="column-label" style={{ color }}>
        {label}
      </h2>
      {prompts && prompts.length > 0 && (
        <div className="column-prompts">
          {prompts.map((p, i) => (
            <p key={i} className="column-prompt">{p}</p>
          ))}
        </div>
      )}
      <div className="column-input-row">
        <textarea
          ref={textareaRef}
          className="card-input"
          placeholder={`Add a ${label.toLowerCase()}...`}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          rows={1}
          style={{ resize: 'none', overflow: 'hidden', minHeight: '40px' }}
        />
        <button
          className="btn-add"
          onClick={handleAdd}
          disabled={!text.trim()}
          aria-label={`Add ${label}`}
        >
          <span className="btn-add-icon">+</span>
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
