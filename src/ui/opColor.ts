import type { Operation } from '../engine/types'

/**
 * The app's one color-coding rule: addition is blue, subtraction is
 * green, multiplication is orange, everywhere an operation is
 * unambiguous (a single question, a single explanation card). A
 * practice SESSION can mix operations (most stages do), so nothing
 * that represents a whole session — the Practice nav button, for
 * instance — gets locked to one of these colors; only single-operation
 * things do.
 */
export function opClassName(op: Operation): string {
  switch (op) {
    case '+':
      return 'op-add'
    case '-':
      return 'op-sub'
    case '×':
      return 'op-mult'
  }
}
