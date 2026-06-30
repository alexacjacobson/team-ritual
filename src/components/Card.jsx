export default function Card({ card, color, onDelete }) {
  return (
    <div className="card" style={{ '--card-border-color': color }}>
      <p className="card-text">{card.text}</p>
      <button
        className="btn-delete"
        onClick={onDelete}
        aria-label="Delete card"
      >
        ×
      </button>
      {card.name && (
        <span className="card-name">{card.name}</span>
      )}
    </div>
  )
}
