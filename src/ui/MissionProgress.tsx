interface Props {
  filled: number
  total: number
}

/**
 * Placeholder for the Space Mission's rocket build: dark blue squares
 * stacked vertically, one per piece earned, standing in for the actual
 * rocket-piece artwork until that's ready. Lives on its own so the
 * eventual swap to real artwork only touches this file.
 */
export function MissionProgress({ filled, total }: Props) {
  return (
    <div className="piece-stack" aria-label={`Rocket pieces: ${filled} of ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className={`piece-square${i < filled ? ' filled' : ''}`} />
      ))}
    </div>
  )
}
