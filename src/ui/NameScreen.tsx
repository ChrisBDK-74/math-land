import { useState } from 'react'

interface Props {
  defaultName: string
  onSubmit: (name: string) => void
}

export function NameScreen({ defaultName, onSubmit }: Props) {
  const [name, setName] = useState(defaultName)

  return (
    <div className="screen-centered name-screen">
      <h2>Hi there, what's your name?</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          onSubmit(name)
        }}
      >
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="answer-input name-input"
          placeholder="Your name"
          autoFocus
        />
        <button type="submit" className="primary-button" disabled={!name.trim()}>
          Next
        </button>
      </form>
    </div>
  )
}
