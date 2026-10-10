interface Props {
  onStart: () => void
}

export function LandingScreen({ onStart }: Props) {
  return (
    <div className="landing-screen">
      <div className="landing-top">
        <h1 className="landing-title">Fun with Math</h1>
      </div>
      <div className="landing-bottom">
        <button className="primary-button start-button" onClick={onStart}>
          Start playing
        </button>
      </div>
    </div>
  )
}
