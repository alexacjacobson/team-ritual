import { useState, useEffect } from 'react'

const AGENDAS = {
  '5 min': [
    { time: '1 min', desc: 'Set context' },
    { time: '2 min', desc: 'One card per person per column' },
    { time: '1 min', desc: 'Read cards aloud' },
    { time: '1 min', desc: 'Pick one action item' },
  ],
  '20 min': [
    { time: '2 min', desc: 'Set context' },
    { time: '5 min', desc: 'Silent card writing' },
    { time: '8 min', desc: 'Read and discuss by column' },
    { time: '3 min', desc: 'AI synthesis' },
    { time: '2 min', desc: 'Commit to action items' },
  ],
  '40 min': [
    { time: '5 min', desc: 'Set context and reflection prompts' },
    { time: '10 min', desc: 'Silent card writing' },
    { time: '15 min', desc: 'Deep discussion by column' },
    { time: '5 min', desc: 'AI synthesis and theme review' },
    { time: '5 min', desc: 'Action items with owners' },
  ],
}

const PITFALLS = [
  'Be specific. "Communication was hard" is less useful than "we didn\'t align on scope before dev started."',
  'Be honest. Thorns are not complaints — they\'re opportunities.',
  'Be generous. Roses deserve as much airtime as Thorns.',
  'Be actionable. If you name a problem, think about what could change it.',
]

function GuideCard({ children }) {
  return (
    <div style={{
      background: '#FFFFFF',
      borderRadius: '8px',
      padding: '16px',
      marginBottom: '12px',
    }}>
      {children}
    </div>
  )
}

function Eyebrow({ children }) {
  return (
    <p style={{
      fontFamily: 'var(--font-mono)',
      fontSize: '10px',
      fontWeight: 400,
      color: '#888888',
      letterSpacing: '0.07em',
      textTransform: 'uppercase',
      marginBottom: '10px',
    }}>
      {children}
    </p>
  )
}

function Body({ children }) {
  return (
    <p style={{
      fontFamily: 'var(--font-body)',
      fontSize: '13px',
      fontWeight: 400,
      color: '#1A1A1A',
      lineHeight: 1.6,
      margin: 0,
    }}>
      {children}
    </p>
  )
}

export default function FacilitatorGuide() {
  const [open, setOpen] = useState(true)
  const [agendaTab, setAgendaTab] = useState('20 min')

  // Push .main right when sidebar is open, restore on close.
  useEffect(() => {
    const el = document.querySelector('.main')
    if (!el) return
    el.style.transition = 'margin-left 0.3s ease'
    el.style.marginLeft = open ? '324px' : ''
  }, [open])

  // Clean up inline styles on unmount.
  useEffect(() => {
    return () => {
      const el = document.querySelector('.main')
      if (!el) return
      el.style.transition = ''
      el.style.marginLeft = ''
    }
  }, [])

  return (
    <>
      {/* Trigger pill — appears at the same position as the panel title when closed */}
      {!open && (
        <button
          className="btn-facilitator-guide"
          style={{
            position: 'fixed',
            top: '23px',
            left: '0',
            transform: 'none',
            writingMode: 'horizontal-tb',
            textOrientation: 'mixed',
            background: 'transparent',
            backdropFilter: 'none',
            WebkitBackdropFilter: 'none',
            border: '1.5px solid #ffffff',
            borderRadius: '999px',
            padding: '9px 20px',
            fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
            fontSize: '13px',
            fontWeight: 500,
            color: '#ffffff',
          }}
          onClick={() => setOpen(true)}
          aria-label="Open user manual"
        >
          User Manual
        </button>
      )}

      {/* Sidebar — slides in from left, linen background */}
      <div
        className="facilitator-panel"
        style={{
          transform: open ? 'translateX(0)' : 'translateX(-100%)',
          background: '#FAF8F2',
          backdropFilter: 'none',
          WebkitBackdropFilter: 'none',
          borderRight: 'none',
          border: 'none',
        }}
      >
        {/* Header: title + close arrow */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}>
          <span style={{
            fontFamily: 'var(--font-body)',
            fontSize: '14px',
            fontWeight: 500,
            color: '#1A1A1A',
          }}>
            User Manual
          </span>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close sidebar"
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '16px',
              fontWeight: 400,
              color: '#1A1A1A',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              lineHeight: 1,
            }}
          >
            ←
          </button>
        </div>

        {/* Card 1 — What is this */}
        <GuideCard>
          <Eyebrow>What is this</Eyebrow>
          <Body>
            A team reflection format. Add cards to each column based on your experience. Rose = something that went well. Bud = something with potential you'd like to explore. Thorn = something that felt painful or blocked.
          </Body>
        </GuideCard>

        {/* Card 2 — When to use it */}
        <GuideCard>
          <Eyebrow>When to use it</Eyebrow>
          <Body>
            At the end of a sprint, project, or semester. When your team needs a shared moment to reflect before moving forward.
          </Body>
        </GuideCard>

        {/* Card 3 — Agenda with tabs */}
        <GuideCard>
          <Eyebrow>Agenda</Eyebrow>
          <div style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
            {Object.keys(AGENDAS).map((tab) => {
              const selected = agendaTab === tab
              return (
                <button
                  key={tab}
                  onClick={() => setAgendaTab(tab)}
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '11px',
                    fontWeight: 500,
                    borderRadius: '999px',
                    padding: '4px 12px',
                    cursor: 'pointer',
                    border: selected ? 'none' : '1px solid #1A1A1A',
                    background: selected ? '#1A1A1A' : 'transparent',
                    color: selected ? '#ffffff' : '#1A1A1A',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {tab}
                </button>
              )
            })}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {AGENDAS[agendaTab].map(({ time, desc }, i) => (
              <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'baseline' }}>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  color: 'var(--deep-pink)',
                  flexShrink: 0,
                  whiteSpace: 'nowrap',
                }}>
                  {time}
                </span>
                <Body>{desc}</Body>
              </div>
            ))}
          </div>
        </GuideCard>

        {/* Card 4 — Common pitfalls */}
        <GuideCard>
          <Eyebrow>Common pitfalls</Eyebrow>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {PITFALLS.map((text, i) => (
              <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'baseline' }}>
                <span style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '13px',
                  color: '#1A1A1A',
                  flexShrink: 0,
                }}>→</span>
                <Body>{text}</Body>
              </div>
            ))}
          </div>
        </GuideCard>
      </div>
    </>
  )
}
