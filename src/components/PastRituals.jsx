import { useState, useEffect } from 'react'

const toSentenceCase = (str) =>
  str ? str[0].toUpperCase() + str.slice(1).toLowerCase() : str

const formatDate = (iso) => {
  const d = new Date(iso)
  return (
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' · ' +
    d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  )
}

export default function PastRituals({ onClose }) {
  const [rituals, setRituals] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/rituals')
      .then((r) => r.json())
      .then((data) => setRituals(Array.isArray(data) ? data : []))
      .catch(() => setRituals([]))
      .finally(() => setLoading(false))
  }, [])

  const deleteRitual = async (id) => {
    setRituals((prev) => prev.filter((r) => r.id !== id))
    try {
      await fetch(`/api/rituals/${id}`, { method: 'DELETE' })
    } catch (_) {}
  }

  return (
    <div className="past-rituals-overlay" onClick={onClose}>
      <div className="past-rituals-panel" onClick={(e) => e.stopPropagation()}>
        <div className="past-rituals-header">
          <h2 className="past-rituals-title">Past rituals</h2>
          <button className="btn-close-rituals" onClick={onClose}>×</button>
        </div>

        {!loading && rituals.length === 0 && (
          <p className="ritual-empty">No rituals saved yet.</p>
        )}

        {rituals.map((ritual) => (
          <div key={ritual.id} className="ritual-card">
            <div className="ritual-card-date">{formatDate(ritual.savedAt)}</div>

            {ritual.synthesis.themes?.length > 0 && (
              <div>
                <p className="synthesis-section-label">THEMES</p>
                <div className="synthesis-theme-pills">
                  {ritual.synthesis.themes.map((theme, i) => (
                    <span key={i} className="synthesis-theme-pill">
                      {toSentenceCase(theme)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <hr className="ritual-card-divider" />

            {ritual.synthesis.actionItems?.length > 0 && (
              <div>
                <p className="synthesis-section-label">ACTION ITEMS</p>
                <div className="synthesis-action-list">
                  {ritual.synthesis.actionItems.map((item, i) => (
                    <div key={i} className="synthesis-action-item">
                      {toSentenceCase(item)}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <button
              className="btn-delete-ritual"
              onClick={() => deleteRitual(ritual.id)}
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
