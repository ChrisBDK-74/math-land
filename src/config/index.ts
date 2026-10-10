import masteryConfigJson from './masteryConfig.json'
import factSetsJson from './factSets.json'
import skillTypesJson from './skillTypes.json'
import stagesJson from './stages.json'
import ageFloorsJson from './ageFloors.json'
import type { AgeFloorConfig, FactSetConfig, MasteryConfig, SkillTypeConfig, StageConfig } from '../engine/types'

export const masteryConfig = masteryConfigJson as MasteryConfig
export const factSets = factSetsJson as FactSetConfig[]
export const skillTypes = skillTypesJson as SkillTypeConfig[]
export const stages = (stagesJson as StageConfig[]).slice().sort((a, b) => a.order - b.order)
export const ageFloors = (ageFloorsJson as AgeFloorConfig[]).slice().sort((a, b) => a.minAge - b.minAge)
