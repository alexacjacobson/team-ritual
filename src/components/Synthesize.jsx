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
          {synthesis.title && (
            <div style={{ animation: 'fadeSlideIn 0.4s ease both', animationDelay: '0ms', marginBottom: '24px' }}>
              <p style={{
                fontFamily: 'var(--font-display)',
                fontSize: '28px',
                fontWeight: 400,
                fontStyle: 'italic',
                color: 'var(--ink)',
                lineHeight: 1.2,
              }}>
                {synthesis.title}
              </p>
            </div>
          )}
          {synthesis.themes?.length > 0 && (
            <div style={{ animation: 'fadeSlideIn 0.4s ease both', animationDelay: synthesis.title ? '150ms' : '0ms' }}>
              <p className="synthesis-section-label">THEMES</p>
              {/* flex-direction: column so each theme+description stacks vertically */}
              <div className="synthesis-theme-pills" style={{ flexDirection: 'column', gap: 0 }}>
                {synthesis.themes.map((theme, i) => {
                  const name = typeof theme === 'string' ? theme : theme.name
                  const description = typeof theme === 'object' && theme !== null ? theme.description : null
                  return (
                    <div key={i}>
                      <span className="synthesis-theme-pill">
                        {toSentenceCase(name)}
                      </span>
                      {description && (
                        <p style={{
                          fontFamily: 'var(--font-body)',
                          fontSize: '16px',
                          fontWeight: 400,
                          color: 'var(--ink)',
                          marginTop: '6px',
                          marginBottom: '16px',
                          lineHeight: 1.6,
                        }}>
                          {description}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
          {synthesis.actionItems?.length > 0 && (
            <div style={{ animation: 'fadeSlideIn 0.4s ease both', animationDelay: synthesis.title ? '300ms' : '150ms' }}>
              <p className="synthesis-section-label">ACTION ITEMS</p>
              <div className="synthesis-action-list">
                {synthesis.actionItems.map((item, i) => {
                  const text = typeof item === 'string' ? item : item.text
                  const isHigh = typeof item === 'object' && item !== null && item.priority === 'high'
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      {isHigh && (
                        <span style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: '#FF6E48',
                          flexShrink: 0,
                          marginTop: '8px',
                        }} />
                      )}
                      <div className="synthesis-action-item" style={{ flex: 1 }}>
                        {toSentenceCase(text)}
                      </div>
                    </div>
                  )
                })}
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
