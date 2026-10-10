import type { MasteryConfig, MasteryRecord, PracticeItemKind } from './types'

export function createFreshRecord(
  profileId: string,
  itemId: string,
  itemKind: PracticeItemKind,
): MasteryRecord {
  return {
    profileId,
    itemId,
    itemKind,
    strength: 0,
    dueAt: new Date().toISOString(), // due immediately — it's new
    timesSeen: 0,
    timesCorrect: 0,
    sessionsAboveThreshold: 0,
    avgCorrectResponseMs: null,
    lastSeenAt: null,
  }
}

function clampStrength(n: number): number {
  return Math.max(0, Math.min(100, n))
}

/**
 * Apply one answer to a mastery record, per the doc's update rule:
 *   correct + fast  -> strength += correctFastDelta
 *   correct + slow  -> strength += correctSlowDelta
 *   incorrect       -> strength -= incorrectDelta, due date resets to "soon"
 *   next due date   -> now + (strength / 100) * maxIntervalDays
 *
 * "Fast" is judged against this item's own rolling average correct
 * response time once there's enough data, falling back to the global
 * config default for a brand new item.
 */
export function applyAnswer(
  record: MasteryRecord,
  correct: boolean,
  responseMs: number,
  config: MasteryConfig,
  sessionAlreadyCountedThisItem: boolean,
): MasteryRecord {
  const fastThreshold = record.avgCorrectResponseMs ?? config.responseTimeFastMs
  const isFast = responseMs <= fastThreshold

  let strength = record.strength
  if (correct) {
    strength = clampStrength(strength + (isFast ? config.correctFastDelta : config.correctSlowDelta))
  } else {
    strength = clampStrength(strength - config.incorrectDelta)
  }

  const intervalDays = correct
    ? Math.max(config.minIntervalDays, (strength / 100) * config.maxIntervalDays)
    : config.minIntervalDays // wrong answers resurface soon, not on the usual schedule

  const dueAt = new Date(Date.now() + intervalDays * 24 * 60 * 60 * 1000).toISOString()

  const avgCorrectResponseMs =
    correct
      ? record.avgCorrectResponseMs === null
        ? responseMs
        : Math.round(record.avgCorrectResponseMs * 0.8 + responseMs * 0.2)
      : record.avgCorrectResponseMs

  // "Mastered" requires staying above threshold across several separate
  // sessions, not just a lucky streak within one session — so this only
  // increments once per session, the first time the item crosses (or
  // stays above) threshold in that session, and resets the moment it
  // drops below.
  let sessionsAboveThreshold = record.sessionsAboveThreshold
  if (strength >= config.masteredThreshold) {
    if (!sessionAlreadyCountedThisItem) {
      sessionsAboveThreshold += 1
    }
  } else {
    sessionsAboveThreshold = 0
  }

  return {
    ...record,
    strength,
    dueAt,
    timesSeen: record.timesSeen + 1,
    timesCorrect: record.timesCorrect + (correct ? 1 : 0),
    sessionsAboveThreshold,
    avgCorrectResponseMs,
    lastSeenAt: new Date().toISOString(),
  }
}

export function isMastered(record: MasteryRecord, config: MasteryConfig): boolean {
  return (
    record.strength >= config.masteredThreshold &&
    record.sessionsAboveThreshold >= config.masteredSessionsRequired
  )
}

export function isDue(record: MasteryRecord): boolean {
  return new Date(record.dueAt).getTime() <= Date.now()
}
