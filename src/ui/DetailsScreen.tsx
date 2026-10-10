import { useState } from 'react'
import type { ImageTheme } from '../storage/db'

interface Props {
  defaultAge: number | null
  defaultTheme: ImageTheme
  onSubmit: (age: number, theme: ImageTheme) => void
}

const THEME_OPTIONS: { key: ImageTheme; emoji: string; label: string }[] = [
  { key: 'rockets', emoji: '🚀', label: 'Rockets' },
  { key: 'flowers', emoji: '🌸', label: 'Flowers' },
  { key: 'surprise', emoji: '🎲', label: 'Surprise me' },
]

const MIN_AGE = 3
const MAX_AGE = 18

export function DetailsScreen({ defaultAge, defaultTheme, onSubmit }: Props) {
  const [age, setAge] = useState(defaultAge !== null ? String(defaultAge) : '')
  const [theme, setTheme] = useState<ImageTheme>(defaultTheme)

  const ageNumber = Number(age)
  const ageValid = age.trim() !== '' && Number.isInteger(ageNumber) && ageNumber >= MIN_AGE && ageNumber <= MAX_AGE

  return (
    <div className="screen-centered name-screen">
      <h2>How old are you?</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (ageValid) onSubmit(ageNumber, theme)
        }}
      >
        <input
          type="number"
          inputMode="numeric"
          value={age}
          onChange={(e) => setAge(e.target.value)}
          className="answer-input name-input"
          placeholder="Your age"
          min={MIN_AGE}
          max={MAX_AGE}
          autoFocus
        />

        <p className="theme-prompt">Pick your style</p>
        <div className="theme-picker">
          {THEME_OPTIONS.map((option) => (
            <button
              key={option.key}
              type="button"
              className={`theme-option ${option.key} ${theme === option.key ? 'active' : ''}`}
              onClick={() => setTheme(option.key)}
            >
              <span className="theme-emoji">{option.emoji}</span>
              {option.label}
            </button>
          ))}
        </div>

        <button type="submit" className="primary-button" disabled={!ageValid}>
          Let's go
        </button>
      </form>
    </div>
  )
}
