import Column from './Column'

const COLUMNS = [
  { key: 'rose', label: 'Rose', color: 'var(--deep-pink)' },
  { key: 'bud', label: 'Bud', color: 'var(--marigold)' },
  { key: 'thorn', label: 'Thorn', color: 'var(--forest)' },
]

export default function Board({ board, onAdd, onDelete, prompts }) {
  return (
    <div className="board">
      {COLUMNS.map((col) => (
        <Column
          key={col.key}
          column={col.key}
          label={col.label}
          color={col.color}
          cards={board[col.key] || []}
          onAdd={onAdd}
          onDelete={onDelete}
          prompts={prompts?.[col.key] || null}
        />
      ))}
    </div>
  )
}
