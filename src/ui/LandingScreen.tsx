interface Props {
  onStart: () => void
}

/**
 * Decorative stars: placed individually at varied sizes/positions
 * rather than a repeating background pattern, so they read as a
 * scattered night sky instead of a grid of dots.
 */
const STARS = [
  { top: '6.4%', left: '6.9%', size: 24 },
  { top: '23.3%', right: '21.4%', size: 14 },
  { bottom: '18.9%', left: '15.7%', size: 18 },
  { top: '36.7%', right: '5.7%', size: 11 },
  { bottom: '6.7%', left: '31.4%', size: 16 },
]

function Star({ size, ...position }: { size: number; top?: string; left?: string; right?: string; bottom?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      style={{ position: 'absolute', ...position }}
    >
      <path
        d="M12 0 L14.4 8.8 L23 8.8 L16 14.4 L18.4 23 L12 17.3 L5.6 23 L8 14.4 L1 8.8 L9.6 8.8 Z"
        fill="#ffe28a"
      />
    </svg>
  )
}

export function LandingScreen({ onStart }: Props) {
  return (
    <div className="landing-screen landing-space">
      <div className="space-planet space-planet-teal" />
      <div className="space-ring" />
      <div className="space-planet space-planet-coral" />
      <div className="space-planet space-planet-gold" />
      {STARS.map((star, i) => (
        <Star key={i} {...star} />
      ))}

      <div className="landing-top">
        <svg width="150" height="212" viewBox="0 0 180 260" aria-hidden="true" className="landing-rocket">
          <path d="M90 220 C 70 245, 70 260, 90 260 C 110 260, 110 245, 90 220 Z" fill="#ffd166" />
          <path d="M90 215 C 78 235, 78 250, 90 250 C 102 250, 102 235, 90 215 Z" fill="#ff8c42" />
          <path d="M55 150 L20 210 L70 190 Z" fill="#4f7cac" />
          <path d="M125 150 L160 210 L110 190 Z" fill="#4f7cac" />
          <path d="M90 10 C 40 60, 35 140, 50 200 L130 200 C145 140, 140 60, 90 10 Z" fill="#ff6b5e" />
          <circle cx="90" cy="110" r="28" fill="#ffe8a3" />
          <circle cx="90" cy="110" r="20" fill="#2e2a6b" />
        </svg>
        <div className="landing-title-block">
          <div className="landing-kicker">Welcome to</div>
          <h1 className="landing-title">Math Land</h1>
        </div>
      </div>
      <div className="landing-bottom">
        <button className="primary-button start-button" onClick={onStart}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path
              d="M10 1 L12.2 7.2 L18.5 7.2 L13.4 11 L15.3 17.3 L10 13.6 L4.7 17.3 L6.6 11 L1.5 7.2 L7.8 7.2 Z"
              fill="#ffffff"
            />
          </svg>
          Start playing
        </button>
      </div>
    </div>
  )
}
