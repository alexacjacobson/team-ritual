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

  // Push content right when sidebar is open by padding .app from the left.
  // Using paddingLeft on .app (not marginLeft on .main) ensures the centered
  // .main always shifts rightward regardless of viewport width.
  useEffect(() => {
    const el = document.querySelector('.app')
    if (!el) return
    el.style.transition = 'padding-left 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
    el.style.paddingLeft = open ? '324px' : '0px'
  }, [open])

  // Set overflow-x on body to prevent horizontal scrollbar during panel slide-in.
  // Clean up all inline styles on unmount.
  useEffect(() => {
    document.body.style.overflowX = 'hidden'
    return () => {
      document.body.style.overflowX = ''
      const el = document.querySelector('.app')
      if (!el) return
      el.style.transition = ''
      el.style.paddingLeft = ''
    }
  }, [])

  return (
    <>
      {/* File-tab trigger — slides right with the panel, always clickable */}
      <button
        className="btn-facilitator-guide"
        onClick={() => setOpen(prev => !prev)}
        aria-label={open ? 'Close user manual' : 'Open user manual'}
        style={{
          position: 'fixed',
          left: open ? '300px' : '0',
          top: '212px',
          transform: 'none',
          transition: 'left 0.3s ease',
          background: '#FAF8F2',
          border: 'none',
          borderRadius: '0 4px 4px 0',
          padding: '20px 10px',
          cursor: 'pointer',
          writingMode: 'vertical-rl',
          zIndex: 490,
        }}
      >
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '11px',
          fontWeight: 400,
          color: '#1A1A1A',
          letterSpacing: '0.06em',
          display: 'block',
          transform: 'rotate(180deg)',
        }}>
          User Manual
        </span>
      </button>

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
          borderRadius: '0 4px 4px 0',
        }}
      >
        {/* Card 1 — What is this */}
        <GuideCard>
          <Eyebrow>Here's the scoop</Eyebrow>
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
          <Eyebrow>Stay mindful</Eyebrow>
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
