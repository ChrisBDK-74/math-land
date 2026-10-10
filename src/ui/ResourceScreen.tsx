import { useState } from 'react'
import type { Operation } from '../engine/types'
import { opClassName } from './opColor'

type Tab = 'tables' | 'howto'

const explanations: { id: string; op: Operation; title: string; body: string; examples: string[] }[] = [
  {
    id: 'addition',
    op: '+',
    title: 'Addition (+)',
    body: 'Addition means putting two groups together to find out how many there are in total.',
    examples: ['3 + 4 = 7  (3 apples and 4 more apples is 7 apples)', '25 + 8 = 33', '47 + 36 = 83  (carry the 1: 7+6=13, write 3 carry 1; 4+3+1=8)'],
  },
  {
    id: 'subtraction',
    op: '-',
    title: 'Subtraction (−)',
    body: "Subtraction means taking some away from a group to find out how many are left.",
    examples: ['7 − 2 = 5  (7 apples, give away 2, 5 left)', '38 − 15 = 23', '52 − 27 = 25  (borrow: can\'t do 2−7, so borrow 1 ten: 12−7=5; 4−2=2)'],
  },
  {
    id: 'multiplication',
    op: '×',
    title: 'Multiplication (×)',
    body: 'Multiplication is a fast way to add the same number over and over — "groups of" something.',
    examples: ['3 × 4 = 12  (3 groups of 4 is the same as 4+4+4)', '6 × 7 = 42', '9 × 5 = 45'],
  },
]

export function ResourceScreen() {
  const [tab, setTab] = useState<Tab>('tables')

  return (
    <div className="resource-screen">
      <div className="tab-row">
        <button className={tab === 'tables' ? 'tab active' : 'tab'} onClick={() => setTab('tables')}>
          Times tables
        </button>
        <button className={tab === 'howto' ? 'tab active' : 'tab'} onClick={() => setTab('howto')}>
          How it works
        </button>
      </div>

      {tab === 'tables' && (
        <div className="tables-grid-wrap op-mult">
          <table className="tables-grid">
            <thead>
              <tr>
                <th></th>
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                  <th key={n}>{n}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 10 }, (_, i) => i + 1).map((a) => (
                <tr key={a}>
                  <th>{a}</th>
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((b) => (
                    <td key={b}>{a * b}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'howto' && (
        <div className="howto-list">
          {explanations.map((e) => (
            <div key={e.id} className={`howto-card ${opClassName(e.op)}`}>
              <h3>{e.title}</h3>
              <p>{e.body}</p>
              <ul>
                {e.examples.map((ex) => (
                  <li key={ex}>{ex}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
