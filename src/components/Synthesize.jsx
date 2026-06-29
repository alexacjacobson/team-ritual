import { useState, useEffect } from 'react'

const toSentenceCase = (str) =>
  str ? str[0].toUpperCase() + str.slice(1).toLowerCase() : str

export default function Synthesize({
  canSynthesize,
  synthesizing,
  synthesis,
  onSynthesize,
  board,
  onSave,
}) {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setSaved(false)
  }, [synthesis])

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave(board, synthesis)
      setSaved(true)
    } catch (_) {}
    finally {
      setSaving(false)
    }
  }

  return (
    <div className="synthesize-section">
      <button
        className="btn-synthesize"
        onClick={onSynthesize}
        disabled={!canSynthesize || synthesizing}
        style={{ opacity: !canSynthesize && !synthesizing ? 0.38 : 1 }}
      >
        {synthesizing ? (
          <span className="synthesizing-label">Thinking...</span>
        ) : (
          'Synthesize'
        )}
      </button>

      {synthesis && !synthesis.error && (
        <div className="synthesis-result">
          {synthesis.themes?.length > 0 && (
            <div>
              <p className="synthesis-section-label">THEMES</p>
              <div className="synthesis-theme-pills">
                {synthesis.themes.map((theme, i) => (
                  <span key={i} className="synthesis-theme-pill">
                    {toSentenceCase(theme)}
                  </span>
                ))}
              </div>
            </div>
          )}
          {synthesis.actionItems?.length > 0 && (
            <div>
              <p className="synthesis-section-label">ACTION ITEMS</p>
              <div className="synthesis-action-list">
                {synthesis.actionItems.map((item, i) => (
                  <div key={i} className="synthesis-action-item">
                    {toSentenceCase(item)}
                  </div>
                ))}
              </div>
            </div>
          )}
          <button
            className="btn-save-ritual"
            onClick={handleSave}
            disabled={saving || saved}
          >
            {saved ? 'Saved' : saving ? 'Saving...' : 'Save ritual'}
          </button>
        </div>
      )}

      {synthesis?.error && (
        <div className="synthesis-result">
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '14px',
              color: 'var(--ash)',
            }}
          >
            {synthesis.error}
          </p>
        </div>
      )}
    </div>
  )
}
