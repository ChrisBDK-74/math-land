import type { FactSetConfig, FactSpec, Operation } from './types'

export function computeAnswer(op: Operation, a: number, b: number): number {
  switch (op) {
    case '+':
      return a + b
    case '-':
      return a - b
    case '×':
      return a * b
  }
}

export function factId(op: Operation, a: number, b: number): string {
  const opChar = op === '×' ? 'x' : op
  return `${a}${opChar}${b}`
}

/** Enumerate every fact in a fact set (the cross product of its ranges). */
export function expandFactSet(set: FactSetConfig): FactSpec[] {
  const facts: FactSpec[] = []
  const [aMin, aMax] = set.aRange
  const [bMin, bMax] = set.bRange
  for (let a = aMin; a <= aMax; a++) {
    for (let b = bMin; b <= bMax; b++) {
      // For subtraction fact sets, aRange/bRange are expressed so a >= b
      // always holds (e.g. subtraction within 20: a in [10,20], b in [1,10]).
      // Skip any pair that would go negative.
      if (set.op === '-' && a < b) continue
      facts.push({ id: factId(set.op, a, b), op: set.op, a, b })
    }
  }
  return facts
}

export function formatPrompt(op: Operation, a: number, b: number): string {
  return `${a} ${op} ${b}`
}
