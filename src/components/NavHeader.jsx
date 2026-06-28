export default function NavHeader() {
  return (
    <header className="nav">
      <div className="nav-inner">
        <div className="nav-left">
          <svg
            className="navicon"
            width="20"
            height="16"
            viewBox="0 0 20 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <rect width="20" height="1.5" rx="0.75" fill="#1A1A1A" />
            <rect y="7.25" width="20" height="1.5" rx="0.75" fill="#1A1A1A" />
            <rect y="14.5" width="20" height="1.5" rx="0.75" fill="#1A1A1A" />
          </svg>
          <span className="nav-title">TeamRitual</span>
        </div>
      </div>
    </header>
  )
}
