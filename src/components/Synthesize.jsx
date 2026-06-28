export default function Synthesize({
  canSynthesize,
  synthesizing,
  synthesis,
  onSynthesize,
}) {
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
              <p className="synthesis-section-label">Themes</p>
              <ul className="synthesis-list">
                {synthesis.themes.map((theme, i) => (
                  <li key={i}>{theme}</li>
                ))}
              </ul>
            </div>
          )}
          {synthesis.actionItems?.length > 0 && (
            <div>
              <p className="synthesis-section-label">Action Items</p>
              <ul className="synthesis-list">
                {synthesis.actionItems.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {synthesis?.error && (
        <div className="synthesis-result synthesis-error">
          <p className="synthesis-section-label">Error</p>
          <p>{synthesis.error}</p>
        </div>
      )}
    </div>
  )
}
