import type { FactSetConfig, FactSpec, Operation, PracticeItemKind, SkillTypeConfig } from './types'
import { computeAnswer, expandFactSet, formatPrompt } from './facts'
import { formatSkillPrompt, generateSkillInstance } from './skills'

export interface Question {
  itemId: string
  itemKind: PracticeItemKind
  op: Operation
  a: number
  b: number
  answer: number
  prompt: string
}

export function buildFactIndex(factSets: FactSetConfig[]): Map<string, FactSpec> {
  const index = new Map<string, FactSpec>()
  for (const set of factSets) {
    for (const fact of expandFactSet(set)) {
      index.set(fact.id, fact)
    }
  }
  return index
}

/**
 * Resolves an item id to an actual question. Which kind it is (a fixed
 * fact vs. a generative skill) is read off the id itself — by checking
 * whether it's in the fact index or the skill type list — rather than
 * being told by a single "stage", since an operation-filtered session
 * pool can freely mix fact ids and skill ids from several stages.
 */
export function resolveQuestion(
  itemId: string,
  factIndex: Map<string, FactSpec>,
  skillTypes: SkillTypeConfig[],
): Question {
  const fact = factIndex.get(itemId)
  if (fact) {
    return {
      itemId,
      itemKind: 'fact',
      op: fact.op,
      a: fact.a,
      b: fact.b,
      answer: computeAnswer(fact.op, fact.a, fact.b),
      prompt: formatPrompt(fact.op, fact.a, fact.b),
    }
  }

  const skill = skillTypes.find((s) => s.id === itemId)
  if (skill) {
    const instance = generateSkillInstance(skill)
    return {
      itemId,
      itemKind: 'skill',
      op: instance.op,
      a: instance.a,
      b: instance.b,
      answer: instance.answer,
      prompt: formatSkillPrompt(instance),
    }
  }

  throw new Error(`Unknown item id: ${itemId}`)
}
