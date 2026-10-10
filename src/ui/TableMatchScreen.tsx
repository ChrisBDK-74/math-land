import { useEffect, useMemo, useRef, useState } from 'react'

interface Tile {
  id: string
  value: number
  /** The multiplier (1-10) this tile is the correct answer for. */
  n: number
}

type Location = 'tray' | number // number = slot index 1-10

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function buildTiles(table: number): Tile[] {
  const base = Array.from({ length: 10 }, (_, i) => i + 1).map((n) => ({
    id: `${table}x${n}`,
    value: table * n,
    n,
  }))
  return shuffle(base)
}

const TABLE_OPTIONS = Array.from({ length: 10 }, (_, i) => i + 1)

const INITIAL_TABLE = 6
const initialTiles = buildTiles(INITIAL_TABLE)

interface DragMeta {
  el: HTMLElement
  offsetX: number
  offsetY: number
}

export function TableMatchScreen() {
  const [table, setTable] = useState(INITIAL_TABLE)
  const [tiles, setTiles] = useState<Tile[]>(initialTiles)
  const [locations, setLocations] = useState<Record<string, Location>>(() =>
    Object.fromEntries(initialTiles.map((t) => [t.id, 'tray'])),
  )

  // `draggingId` (state) drives a window-level listener effect below, so
  // cleanup is guaranteed by React whenever it changes or the component
  // unmounts. `dragMetaRef` (not state — it changes too fast for React
  // to care about) holds the actual DOM node and drag offsets.
  //
  // Why window-level listeners instead of per-element pointer capture:
  // on a touchscreen a finger can't leave the screen mid-drag, so the
  // captured element reliably gets its pointerup. On desktop, a mouse
  // can be released somewhere capture doesn't cleanly deliver the event
  // back from (outside a scrollable panel, over a scrollbar, etc.),
  // which left tiles permanently stuck mid-drag. Listening on `window`
  // instead means any mouseup/touchend anywhere in the page finishes
  // the drag, and a `blur` listener catches the one case nothing in the
  // page can see at all: the mouse button released outside the browser
  // window entirely.
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const dragMetaRef = useRef<DragMeta | null>(null)

  function cancelDragVisuals() {
    const meta = dragMetaRef.current
    if (!meta) return
    meta.el.style.position = ''
    meta.el.style.left = ''
    meta.el.style.top = ''
    meta.el.style.width = ''
    meta.el.style.zIndex = ''
    meta.el.style.pointerEvents = ''
    meta.el.classList.remove('dragging')
    dragMetaRef.current = null
  }

  useEffect(() => {
    if (!draggingId) return
    const tileId = draggingId // narrowed to string for the handlers below

    function moveTo(x: number, y: number) {
      const meta = dragMetaRef.current
      if (!meta) return
      meta.el.style.left = `${x - meta.offsetX}px`
      meta.el.style.top = `${y - meta.offsetY}px`
    }

    function onMove(e: PointerEvent) {
      moveTo(e.clientX, e.clientY)
    }

    function onUp(e: PointerEvent) {
      // Find what's under the pointer WHILE the dragged tile still has
      // pointer-events:none — otherwise the tile itself (sitting right
      // on top of the slot it's being dropped onto) is what
      // elementFromPoint finds, not the slot underneath it.
      const dropTarget = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null
      const slotEl = dropTarget?.closest('[data-slot-index]') as HTMLElement | null
      cancelDragVisuals()
      setDraggingId(null)
      if (slotEl) {
        placeTile(tileId, Number(slotEl.dataset.slotIndex))
      } else {
        placeTile(tileId, 'tray')
      }
    }

    function onCancel() {
      // Pointer was taken over by the browser (e.g. a context menu, or
      // the OS) or the window lost focus mid-drag — we can't know where
      // it would have been dropped, so just snap it back visually; the
      // tile's actual location in state never changed during the drag.
      cancelDragVisuals()
      setDraggingId(null)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onCancel)
    window.addEventListener('blur', onCancel)

    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onCancel)
      window.removeEventListener('blur', onCancel)
      // Safety net: however this effect ends (table switched mid-drag,
      // component unmounted, state changed from under us), never leave
      // a tile's inline "floating" styles in place.
      cancelDragVisuals()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draggingId])

  function resetTable(newTable: number) {
    setDraggingId(null) // triggers the effect's cleanup, which resets any dragged tile's styles
    const freshTiles = buildTiles(newTable)
    setTable(newTable)
    setTiles(freshTiles)
    setLocations(Object.fromEntries(freshTiles.map((t) => [t.id, 'tray'])))
  }

  function shuffleTray() {
    setTiles((prev) => shuffle(prev))
  }

  const trayTiles = useMemo(
    () => tiles.filter((t) => locations[t.id] === 'tray'),
    [tiles, locations],
  )

  const slotTile = (slotIndex: number) => tiles.find((t) => locations[t.id] === slotIndex)

  const filledCount = useMemo(
    () => tiles.filter((t) => typeof locations[t.id] === 'number').length,
    [tiles, locations],
  )
  const correctCount = useMemo(
    () => tiles.filter((t) => locations[t.id] === t.n).length,
    [tiles, locations],
  )
  const complete = correctCount === 10

  function placeTile(tileId: string, target: Location) {
    setLocations((prev) => {
      const next = { ...prev }
      if (typeof target === 'number') {
        // If something's already in the target slot, swap it back to the tray.
        const occupantId = Object.keys(next).find(
          (id) => next[id] === target && id !== tileId,
        )
        if (occupantId) next[occupantId] = 'tray'
      }
      next[tileId] = target
      return next
    })
  }

  function handlePointerDown(e: React.PointerEvent<HTMLButtonElement>, tileId: string) {
    // Stop the browser's own native drag/text-selection gesture from
    // kicking in alongside ours — a mouse-specific issue that doesn't
    // show up on touch.
    e.preventDefault()
    const el = e.currentTarget
    const rect = el.getBoundingClientRect()
    dragMetaRef.current = {
      el,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
    }
    el.style.position = 'fixed'
    el.style.left = `${rect.left}px`
    el.style.top = `${rect.top}px`
    el.style.width = `${rect.width}px`
    el.style.zIndex = '1000'
    el.style.pointerEvents = 'none'
    el.classList.add('dragging')
    setDraggingId(tileId)
  }

  return (
    <div className="table-match-screen op-mult">
      <div className="table-picker">
        <span className="muted">Table:</span>
        {TABLE_OPTIONS.map((n) => (
          <button
            key={n}
            className={n === table ? 'table-chip active' : 'table-chip'}
            onClick={() => resetTable(n)}
          >
            {n}
          </button>
        ))}
      </div>

      <p className="muted" style={{ marginTop: 4 }}>
        Drag each answer into the right spot for the {table} times table.
      </p>

      <div className="slots-grid">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
          const tile = slotTile(n)
          const isCorrect = tile ? tile.n === n : false
          const isFilled = !!tile
          return (
            <div
              key={n}
              data-slot-index={n}
              className={
                'slot' +
                (isFilled ? (isCorrect ? ' slot-correct' : ' slot-filled') : '')
              }
            >
              <span className="slot-label">
                {table} × {n}
              </span>
              <span className="slot-value">
                {tile ? (
                  <button
                    className="tile placed-tile"
                    onPointerDown={(e) => handlePointerDown(e, tile.id)}
                  >
                    {tile.value}
                  </button>
                ) : (
                  '?'
                )}
              </span>
            </div>
          )
        })}
      </div>

      <div className="tray" data-tray="true">
        {trayTiles.length === 0 && !complete && (
          <p className="muted">All placed — check the slots above.</p>
        )}
        {trayTiles.map((tile) => (
          <button
            key={tile.id}
            className="tile"
            onPointerDown={(e) => handlePointerDown(e, tile.id)}
          >
            {tile.value}
          </button>
        ))}
      </div>

      <div className="table-match-footer">
        <p className="muted">
          {filledCount} / 10 placed · {correctCount} / 10 correct
        </p>
        {complete && <p className="feedback-correct">All correct! 🎉</p>}
        <button className="primary-button" onClick={shuffleTray}>
          Shuffle again
        </button>
      </div>
    </div>
  )
}
