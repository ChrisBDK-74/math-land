import type { SkillTypeConfig } from './types'

export interface SkillInstance {
  skillTypeId: string
  op: '+' | '-'
  a: number
  b: number
  answer: number
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function onesDigit(n: number): number {
  return n % 10
}

/**
 * Generate one fresh random instance of a skill type (e.g. a random
 * 2-digit + 2-digit pair that does or doesn't require regrouping).
 * Uses simple rejection sampling since the ranges are small.
 */
export function generateSkillInstance(skill: SkillTypeConfig): SkillInstance {
  const aMin = Math.pow(10, skill.digitsA - 1)
  const aMax = Math.pow(10, skill.digitsA) - 1
  const bMin = Math.pow(10, skill.digitsB - 1)
  const bMax = Math.pow(10, skill.digitsB) - 1

  for (let attempt = 0; attempt < 500; attempt++) {
    let a = randInt(aMin, aMax)
    let b = randInt(bMin, bMax)

    if (skill.op === '-') {
      // Keep subtraction non-negative: a is always the larger operand.
      if (a < b) [a, b] = [b, a]
      if (a === b) continue
    }

    const needsRegroup =
      skill.op === '+' ? onesDigit(a) + onesDigit(b) >= 10 : onesDigit(a) < onesDigit(b)

    if (needsRegroup === skill.regroup) {
      return {
        skillTypeId: skill.id,
        op: skill.op,
        a,
        b,
        answer: skill.op === '+' ? a + b : a - b,
      }
    }
  }

  // Fallback: shouldn't normally hit this, but never leave the caller
  // without an instance.
  const a = aMax
  const b = skill.regroup ? bMax : bMin
  return {
    skillTypeId: skill.id,
    op: skill.op,
    a,
    b,
    answer: skill.op === '+' ? a + b : Math.max(a - b, 0),
  }
}

export function formatSkillPrompt(instance: SkillInstance): string {
  return `${instance.a} ${instance.op} ${instance.b}`
}
