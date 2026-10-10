import type { AgeFloorConfig, MasteryConfig, MasteryRecord, StageConfig } from './types'
import { factSets, skillTypes } from '../config'
import { getStageItemIds, isStageUnlocked } from './session'

/**
 * The active stage is the first one in order (at or after `floorOrder`)
 * whose items aren't yet sufficiently mastered. Once every stage
 * clears, he stays on the last one (continued full-fluency practice)
 * rather than running out of content.
 *
 * `floorOrder` lets an age-based starting guess skip the "Mix" mode
 * past stages a kid almost certainly doesn't need — it's a starting
 * point, not a permanent restriction: if it's ever set wrong, the
 * operation sub-menu reaches every stage regardless (see
 * PracticeScreen), so nothing is ever truly locked away by a bad
 * guess.
 */
export function getActiveStage(
  stages: StageConfig[],
  records: Map<string, MasteryRecord>,
  config: MasteryConfig,
  floorOrder = 1,
): StageConfig {
  const candidates = stages.filter((s) => s.order >= floorOrder)
  for (const stage of candidates) {
    const itemIds = getStageItemIds(stage, factSets, skillTypes)
    if (!isStageUnlocked(stage, itemIds, records, config)) {
      return stage
    }
  }
  return candidates[candidates.length - 1] ?? stages[stages.length - 1]
}

/**
 * Stages he's actually reached: the active stage and everything before
 * it. Used to scope an operation-filtered practice session ("just
 * addition") to content he's already met, rather than jumping ahead to
 * a stage he hasn't earned yet.
 */
export function getReachableStages(stages: StageConfig[], activeStage: StageConfig): StageConfig[] {
  return stages.filter((s) => s.order <= activeStage.order)
}

/**
 * Translates the age given at profile creation into a starting stage
 * order for "Mix" mode — e.g. a 10-year-old doesn't need to be walked
 * through addition within 20 before the app trusts they can handle
 * 2-digit regrouping. `ageFloors` is sorted ascending by minAge; this
 * picks the highest-minAge entry the age qualifies for.
 */
export function stageFloorForAge(age: number | undefined, ageFloors: AgeFloorConfig[]): number {
  if (age === undefined) return 1
  let floor = 1
  for (const entry of ageFloors) {
    if (age >= entry.minAge) floor = entry.stageOrder
  }
  return floor
}
