import { useEffect, useRef, useState } from 'react'
import { ageFloors, factSets, masteryConfig, skillTypes, stages } from '../config'
import { buildFactIndex, resolveQuestion, type Question } from '../engine/question'
import { getOperationItemIds, getStageItemIds, buildSessionQueue, stageMasteredFraction } from '../engine/session'
import { applyAnswer, createFreshRecord } from '../engine/mastery'
import { getActiveStage, stageFloorForAge } from '../engine/progress'
import { getMasteryRecords, putMasteryRecord, putSession } from '../storage/db'
import type { MasteryRecord, Operation, SessionAnswer, SessionRecord, StageConfig } from '../engine/types'
import { opClassName } from './opColor'
import { createId } from '../utils/uuid'

const factIndex = buildFactIndex(factSets)

interface Props {
  profileId: string
  profileName: string
  profileAge?: number
}

type Phase = 'loading' | 'question' | 'feedback' | 'done' | 'locked'
type OpFilter = 'mix' | Operation

const OP_FILTERS: { key: OpFilter; label: string; className: string }[] = [
  { key: '+', label: 'Addition', className: 'op-add' },
  { key: '-', label: 'Subtraction', className: 'op-sub' },
  { key: '×', label: 'Multiplication', className: 'op-mult' },
  { key: 'mix', label: 'Mix', className: 'op-mix' },
]

export function PracticeScreen({ profileId, profileName, profileAge }: Props) {
  // The live mastery map lives in a ref, not state: it's written
  // synchronously after every answer, and it must NOT be a dependency
  // of the queue-building effect below — if it were, scoring an answer
  // would re-trigger that effect and silently replace the question
  // queue (and the stage) mid-session, wiping out whatever phase we'd
  // just moved to. `recordsVersion` is a plain counter used only to
  // tell React to re-render when the ref's contents change.
  const recordsRef = useRef<Map<string, MasteryRecord> | null>(null)
  const [recordsVersion, setRecordsVersion] = useState(0)

  // `sessionSeed` is what the queue-building effect depends on instead:
  // it only changes when a session should actually start over (first
  // load, or "Practice again"). Changing `opFilter` also rebuilds the
  // session — that's the point of the sub-menu — since it's in the
  // same effect's dependency list.
  const [sessionSeed, setSessionSeed] = useState(0)
  const [opFilter, setOpFilter] = useState<OpFilter>('mix')

  // `sessionStage` is always the active stage (used to scope an
  // operation-filtered pool to stages he's actually reached).
  // `sessionItemIds`/`sessionLabel` describe the actual pool this
  // session draws from, whichever mode produced it.
  const [sessionStage, setSessionStage] = useState<StageConfig>(stages[0])
  const [sessionItemIds, setSessionItemIds] = useState<string[]>([])
  const [sessionLabel, setSessionLabel] = useState<string>('')

  const [queue, setQueue] = useState<string[]>([])
  const [queueIndex, setQueueIndex] = useState(0)
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null)
  const [answerInput, setAnswerInput] = useState('')
  const [phase, setPhase] = useState<Phase>('loading')
  const [lastCorrect, setLastCorrect] = useState(false)
  const [sessionCorrectCount, setSessionCorrectCount] = useState(0)
  // Tracks which items have already had their "mastered this session"
  // counter bumped, so a repeat of the same item later in the session
  // doesn't double-count it.
  const countedThisSession = useRef<Set<string>>(new Set())
  const answersRef = useRef<SessionAnswer[]>([])
  const sessionStartedAt = useRef<string>(new Date().toISOString())
  const questionShownAt = useRef<number>(0)
  const inputRef = useRef<HTMLInputElement>(null)

  // Build (or rebuild, on a fresh sessionSeed or a changed opFilter) the
  // session queue: load mastery records, pick the active stage, work out
  // the item pool for the chosen filter, and assemble the mix of
  // due/new/review questions for this session.
  useEffect(() => {
    let cancelled = false
    setPhase('loading')
    getMasteryRecords(profileId).then((records) => {
      if (cancelled) return
      const map = new Map(records.map((r) => [r.itemId, r]))
      recordsRef.current = map
      setRecordsVersion((v) => v + 1)

      // Age only ever sets a starting-point guess for "Mix" mode — once
      // real mastery records exist, the normal forward walk through
      // stages 1..7 takes over same as before; this just skips an older
      // kid past stages they almost certainly don't need to be walked
      // through from scratch.
      const floorOrder = stageFloorForAge(profileAge, ageFloors)
      const activeStage = getActiveStage(stages, map, masteryConfig, floorOrder)
      setSessionStage(activeStage)

      let itemIds: string[]
      let label: string
      if (opFilter === 'mix') {
        itemIds = getStageItemIds(activeStage, factSets, skillTypes)
        label = activeStage.title
      } else {
        // Picking an operation by name is a deliberate choice, not the
        // adaptive path — so it draws from every stage, not just the
        // ones the Mix mode has unlocked so far. "Mix" is still gated
        // by mastery progression; this sub-menu never is.
        itemIds = getOperationItemIds(opFilter, stages, factSets, skillTypes)
        label = OP_FILTERS.find((f) => f.key === opFilter)?.label ?? ''
      }
      setSessionItemIds(itemIds)
      setSessionLabel(label)

      if (itemIds.length === 0) {
        setQueue([])
        setPhase('locked')
        return
      }

      const q = buildSessionQueue(itemIds, map, masteryConfig)
      setQueue(q)
      setQueueIndex(0)
      countedThisSession.current = new Set()
      answersRef.current = []
      sessionStartedAt.current = new Date().toISOString()
      setSessionCorrectCount(0)
      setPhase(q.length > 0 ? 'question' : 'done')
    })
    return () => {
      cancelled = true
    }
  }, [profileId, sessionSeed, opFilter, profileAge])

  useEffect(() => {
    if (phase !== 'question' || queue.length === 0) return
    const itemId = queue[queueIndex]
    if (!itemId) {
      setPhase('done')
      return
    }
    const question = resolveQuestion(itemId, factIndex, skillTypes)
    setCurrentQuestion(question)
    setAnswerInput('')
    questionShownAt.current = Date.now()
    setTimeout(() => inputRef.current?.focus(), 0)
  }, [phase, queue, queueIndex])

  const opSubMenu = (
    <div className="op-submenu">
      {OP_FILTERS.map((f) => (
        <button
          key={f.key}
          className={`op-filter-button ${f.className} ${opFilter === f.key ? 'active' : ''}`}
          onClick={() => setOpFilter(f.key)}
        >
          {f.label}
        </button>
      ))}
    </div>
  )

  if (phase === 'loading' || !recordsRef.current) {
    return (
      <div className="screen-centered">
        {opSubMenu}
        <div>Loading…</div>
      </div>
    )
  }

  if (phase === 'locked') {
    const filterLabel = OP_FILTERS.find((f) => f.key === opFilter)?.label ?? ''
    return (
      <div className="screen-centered">
        {opSubMenu}
        <h2>Not unlocked yet</h2>
        <p className="muted">
          Keep practicing the mix a bit more to unlock {filterLabel.toLowerCase()} on its own.
        </p>
        <button className="primary-button" onClick={() => setOpFilter('mix')}>
          Back to Mix
        </button>
      </div>
    )
  }

  if (phase === 'done') {
    const fraction = stageMasteredFraction(sessionItemIds, recordsRef.current, masteryConfig)
    return (
      <div className="screen-centered">
        {opSubMenu}
        <h2>Great work, {profileName}! 🎉</h2>
        <p>
          {sessionCorrectCount} / {queue.length} correct this session.
        </p>
        <p className="muted">
          {sessionLabel}: {Math.round(fraction * 100)}% mastered
        </p>
        <button className="primary-button" onClick={() => setSessionSeed((s) => s + 1)}>
          Practice again
        </button>
      </div>
    )
  }

  if (!currentQuestion) {
    return (
      <div className="screen-centered">
        {opSubMenu}
        <div>Loading…</div>
      </div>
    )
  }

  async function handleSubmit() {
    if (!currentQuestion || answerInput.trim() === '') return
    const responseMs = Date.now() - questionShownAt.current
    const given = Number(answerInput)
    const correct = given === currentQuestion.answer

    const records = recordsRef.current!
    const existing =
      records.get(currentQuestion.itemId) ??
      createFreshRecord(profileId, currentQuestion.itemId, currentQuestion.itemKind)
    const alreadyCounted = countedThisSession.current.has(currentQuestion.itemId)
    const updated = applyAnswer(existing, correct, responseMs, masteryConfig, alreadyCounted)
    countedThisSession.current.add(currentQuestion.itemId)

    records.set(currentQuestion.itemId, updated)
    setRecordsVersion((v) => v + 1)
    await putMasteryRecord(updated)

    answersRef.current.push({
      itemId: currentQuestion.itemId,
      itemKind: currentQuestion.itemKind,
      prompt: currentQuestion.prompt,
      correct,
      responseMs,
      givenAnswer: answerInput,
    })

    setLastCorrect(correct)
    if (correct) setSessionCorrectCount((c) => c + 1)
    setPhase('feedback')
  }

  async function handleNext() {
    const isLast = queueIndex + 1 >= queue.length
    if (isLast) {
      const session: SessionRecord = {
        id: createId(),
        profileId,
        startedAt: sessionStartedAt.current,
        endedAt: new Date().toISOString(),
        stageId: sessionStage.id,
        answers: answersRef.current,
      }
      await putSession(session)
      setPhase('done')
    } else {
      setQueueIndex((i) => i + 1)
      setPhase('question')
    }
  }

  return (
    <div className="screen-centered">
      {opSubMenu}
      <p className="stage-label">{sessionLabel}</p>
      {/* data-records-version forces nothing visually; it just documents that this
          subtree is meant to re-render whenever a mastery record changes. */}
      <div
        className={`question-card ${opClassName(currentQuestion.op)}`}
        data-records-version={recordsVersion}
      >
        <div className="prompt">
          {currentQuestion.prompt} = ?
        </div>
        {phase === 'question' && (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSubmit()
            }}
          >
            <input
              ref={inputRef}
              type="number"
              inputMode="numeric"
              value={answerInput}
              onChange={(e) => setAnswerInput(e.target.value)}
              className="answer-input"
            />
            <button type="submit" className="primary-button">
              Check
            </button>
          </form>
        )}
        {phase === 'feedback' && (
          <div>
            <p className={lastCorrect ? 'feedback-correct' : 'feedback-incorrect'}>
              {lastCorrect ? 'Correct!' : `Not quite — it's ${currentQuestion.answer}`}
            </p>
            <button className="primary-button" onClick={handleNext}>
              Next
            </button>
          </div>
        )}
      </div>
      <p className="progress-label">
        Question {queueIndex + 1} of {queue.length}
      </p>
    </div>
  )
}
