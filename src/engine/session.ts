import type { FactSetConfig, MasteryConfig, MasteryRecord, Operation, SkillTypeConfig, StageConfig } from './types'
import { expandFactSet } from './facts'
import { isDue, isMastered } from './mastery'

/** All item ids (fact ids or skill type ids) that belong to a stage. */
export function getStageItemIds(
  stage: StageConfig,
  factSets: FactSetConfig[],
  skillTypes: SkillTypeConfig[],
): string[] {
  if (stage.kind === 'fact') {
    return stage.refs
      .flatMap((setId) => factSets.find((s) => s.id === setId))
      .filter((s): s is FactSetConfig => !!s)
      .flatMap((s) => expandFactSet(s).map((f) => f.id))
  }
  return stage.refs.filter((id) => skillTypes.some((s) => s.id === id))
}

/**
 * A stage's items that belong to one operation — used when he's chosen
 * to drill a single operation rather than the adaptive mix. Most fact
 * stages only ever reference one operation's fact sets, but a couple
 * (the fluency check-in, the 2-digit +/- stages) mix + and -, so this
 * filters at the fact-set/skill-type level, not the whole stage.
 */
function stageItemIdsForOp(
  stage: StageConfig,
  operation: Operation,
  factSets: FactSetConfig[],
  skillTypes: SkillTypeConfig[],
): string[] {
  if (stage.kind === 'fact') {
    return stage.refs
      .flatMap((setId) => factSets.find((s) => s.id === setId))
      .filter((s): s is FactSetConfig => !!s && s.op === operation)
      .flatMap((s) => expandFactSet(s).map((f) => f.id))
  }
  return stage.refs.filter((id) => skillTypes.some((s) => s.id === id && s.op === operation))
}

/**
 * All items for one operation across every stage he's reached so far
 * (not just the single currently-active one) — so picking "Addition"
 * lets him drill everything up to his current frontier, not just
 * whatever happens to be in the one stage he's on right now.
 */
export function getOperationItemIds(
  operation: Operation,
  reachableStages: StageConfig[],
  factSets: FactSetConfig[],
  skillTypes: SkillTypeConfig[],
): string[] {
  const ids = new Set<string>()
  for (const stage of reachableStages) {
    for (const id of stageItemIdsForOp(stage, operation, factSets, skillTypes)) {
      ids.add(id)
    }
  }
  return Array.from(ids)
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function sampleWithReplacement<T>(pool: T[], n: number, avoidRepeatOf?: T): T[] {
  if (pool.length === 0) return []
  const out: T[] = []
  let last: T | undefined = avoidRepeatOf
  for (let i = 0; i < n; i++) {
    let pick: T
    if (pool.length === 1) {
      pick = pool[0]
    } else {
      do {
        pick = pool[Math.floor(Math.random() * pool.length)]
      } while (pick === last)
    }
    out.push(pick)
    last = pick
  }
  return out
}

/**
 * Build a practice session's question queue for a stage: a mix of
 * due/weak items, brand-new items, and mastered-review items, per the
 * fractions in masteryConfig.sessionMix. Falls back gracefully when a
 * pool is empty (e.g. nothing is "mastered" yet in a stage he just
 * started).
 */
export function buildSessionQueue(
  allItemIds: string[],
  records: Map<string, MasteryRecord>,
  config: MasteryConfig,
): string[] {
  const seen = allItemIds.filter((id) => (records.get(id)?.timesSeen ?? 0) > 0)
  const unseen = allItemIds.filter((id) => !seen.includes(id))

  const dueOrWeak = seen
    .filter((id) => {
      const r = records.get(id)!
      return isDue(r) || !isMastered(r, config)
    })
    .sort((a, b) => (records.get(a)!.strength ?? 0) - (records.get(b)!.strength ?? 0))

  const masteredReview = seen.filter((id) => isMastered(records.get(id)!, config))

  const target = config.sessionLength
  let numDue = Math.round(target * config.sessionMix.dueOrWeak)
  let numNew = Math.round(target * config.sessionMix.stageNew)
  let numReview = target - numDue - numNew

  // Redistribute from empty pools to the others, proportionally, so an
  // early session (nothing mastered, little seen) still fills out to
  // the target length from whatever pools do have items.
  const pools: { key: 'due' | 'new' | 'review'; count: number; pool: string[] }[] = [
    { key: 'due', count: numDue, pool: dueOrWeak },
    { key: 'new', count: numNew, pool: unseen },
    { key: 'review', count: numReview, pool: masteredReview },
  ]
  const empty = pools.filter((p) => p.pool.length === 0 && p.count > 0)
  const nonEmpty = pools.filter((p) => p.pool.length > 0)
  if (empty.length > 0 && nonEmpty.length > 0) {
    const spillover = empty.reduce((sum, p) => sum + p.count, 0)
    empty.forEach((p) => (p.count = 0))
    const share = Math.ceil(spillover / nonEmpty.length)
    nonEmpty.forEach((p) => (p.count += share))
  }

  numDue = pools.find((p) => p.key === 'due')!.count
  numNew = pools.find((p) => p.key === 'new')!.count
  numReview = pools.find((p) => p.key === 'review')!.count

  const queue = [
    ...sampleWithReplacement(dueOrWeak, numDue),
    ...sampleWithReplacement(unseen.length ? unseen : dueOrWeak, numNew),
    ...sampleWithReplacement(masteredReview.length ? masteredReview : dueOrWeak, numReview),
  ].slice(0, target)

  return shuffle(queue)
}

/** What fraction of a stage's items are "mastered" right now. */
export function stageMasteredFraction(
  itemIds: string[],
  records: Map<string, MasteryRecord>,
  config: MasteryConfig,
): number {
  if (itemIds.length === 0) return 0
  const masteredCount = itemIds.filter((id) => {
    const r = records.get(id)
    return r && isMastered(r, config)
  }).length
  return masteredCount / itemIds.length
}

export function isStageUnlocked(
  stage: StageConfig,
  itemIds: string[],
  records: Map<string, MasteryRecord>,
  config: MasteryConfig,
): boolean {
  return stageMasteredFraction(itemIds, records, config) >= stage.unlockFraction
}
