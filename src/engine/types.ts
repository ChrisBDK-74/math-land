// Core data shapes for the adaptive engine.
// Everything that can vary (thresholds, stage order, which facts exist)
// lives in src/config/*.json, not in this code — this file only
// describes the shapes that config and runtime data take.

export type Operation = '+' | '-' | '×'

/** A fixed, memorizable fact, e.g. "6×7" or "7+8". */
export interface FactSpec {
  /** Stable id, e.g. "6x7" or "7+8". */
  id: string
  op: Operation
  a: number
  b: number
}

/** A named, enumerable set of facts (a times table, a range of sums). */
export interface FactSetConfig {
  id: string
  label: string
  op: Operation
  /** Inclusive ranges for the two operands; facts are the cross product. */
  aRange: [number, number]
  bRange: [number, number]
}

/**
 * A generative skill (2-digit addition with regrouping, etc). Unlike a
 * FactSpec, there's no fixed enumerable list — a fresh random instance
 * is generated each time it's practiced, and mastery is tracked once
 * per skill type rather than per instance.
 */
export interface SkillTypeConfig {
  id: string
  label: string
  op: '+' | '-'
  /** Number of digits for each operand. */
  digitsA: number
  digitsB: number
  /** Whether this skill requires carrying (addition) or borrowing (subtraction). */
  regroup: boolean
}

export type PracticeItemKind = 'fact' | 'skill'

/** One stage in the overall progression (see docs: progression stages). */
export interface StageConfig {
  id: string
  order: number
  title: string
  description: string
  kind: PracticeItemKind
  /** Ids of FactSetConfig (kind "fact") or SkillTypeConfig (kind "skill") this stage draws from. */
  refs: string[]
  /** Fraction of this stage's items that must be "mastered" to unlock the next stage. */
  unlockFraction: number
}

export interface MasteryConfig {
  /** Strength (0-100) gained for a correct, fast answer. */
  correctFastDelta: number
  /** Strength gained for a correct, slow answer. */
  correctSlowDelta: number
  /** Strength lost for an incorrect answer (positive number, subtracted). */
  incorrectDelta: number
  /** Strength threshold at/above which an item counts as "mastered". */
  masteredThreshold: number
  /** How many separate sessions an item must stay above threshold in before it's truly "mastered" (not just a lucky streak). */
  masteredSessionsRequired: number
  /** Multiplied by (strength/100) to get the next due interval, in days. */
  maxIntervalDays: number
  /** Minimum interval in days (even for strength 0, don't resurface instantly-instantly). */
  minIntervalDays: number
  /** What counts as a "fast" response, in milliseconds, per item kind — see responseTimeFastMs. */
  responseTimeFastMs: number
  /** Session composition: fraction due/weak vs new vs mastered-review. Should sum to 1. */
  sessionMix: {
    dueOrWeak: number
    stageNew: number
    masteredReview: number
  }
  /** Target number of questions in a single practice session. */
  sessionLength: number
}

/** Persisted per-item mastery record (one per fact id or skill type id), scoped to a profile. */
export interface MasteryRecord {
  profileId: string
  itemId: string
  itemKind: PracticeItemKind
  strength: number
  dueAt: string // ISO date
  timesSeen: number
  timesCorrect: number
  /** Consecutive sessions (not necessarily consecutive questions) this item has stayed above the mastery threshold. */
  sessionsAboveThreshold: number
  /** Rolling average correct response time in ms, used as this item's personal "fast" baseline. */
  avgCorrectResponseMs: number | null
  lastSeenAt: string | null
}

export interface SessionAnswer {
  itemId: string
  itemKind: PracticeItemKind
  /** The actual numbers shown, since skill-type items are generated fresh each time. */
  prompt: string
  correct: boolean
  responseMs: number
  givenAnswer: string
}

/**
 * Age at profile creation only sets a starting-point guess (see
 * progress.ts' stageFloorForAge) — it's never re-consulted once real
 * practice history exists, so there's no need to keep it up to date
 * as a kid gets older.
 */
export interface AgeFloorConfig {
  minAge: number
  stageOrder: number
}

export interface SessionRecord {
  id: string
  profileId: string
  startedAt: string
  endedAt: string | null
  stageId: string
  answers: SessionAnswer[]
}
