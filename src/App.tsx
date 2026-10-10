import { useEffect, useState } from 'react'
import { PracticeScreen } from './ui/PracticeScreen'
import { ResourceScreen } from './ui/ResourceScreen'
import { TableMatchScreen } from './ui/TableMatchScreen'
import { LandingScreen } from './ui/LandingScreen'
import { NameScreen } from './ui/NameScreen'
import { DetailsScreen } from './ui/DetailsScreen'
import { createProfile, listProfiles, updateProfile, type ImageTheme, type Profile } from './storage/db'
import { getActiveProfileId, setActiveProfileId } from './storage/activeProfile'
import './App.css'

type View = 'practice' | 'tables' | 'resources'
type Stage = 'landing' | 'name' | 'details' | 'main'

const NAV_ITEMS: { id: View; label: string }[] = [
  { id: 'practice', label: 'Practice' },
  { id: 'tables', label: 'Tables' },
  { id: 'resources', label: 'Resources' },
]

function App() {
  const [stage, setStage] = useState<Stage>('landing')
  const [profile, setProfile] = useState<Profile | null>(null)
  const [defaultName, setDefaultName] = useState('')
  const [pendingName, setPendingName] = useState('')
  const [defaultAge, setDefaultAge] = useState<number | null>(null)
  const [defaultTheme, setDefaultTheme] = useState<ImageTheme>('surprise')
  const [view, setView] = useState<View>('practice')

  // Pre-fill the name screen with whoever played most recently, so
  // playing again is just a couple of taps rather than retyping
  // everything every time. Doesn't skip the screens entirely, since
  // that's also how a second kid trying the app gets their own name,
  // age, and style in.
  useEffect(() => {
    async function loadDefaultName() {
      const existingId = getActiveProfileId()
      if (!existingId) return
      const profiles = await listProfiles()
      const existing = profiles.find((p) => p.id === existingId)
      if (existing) setDefaultName(existing.name)
    }
    loadDefaultName()
  }, [])

  // Name screen just moves on to the details screen — nothing is saved
  // yet. Along the way, pull up this name's existing age/theme (if any)
  // so flipping back to a name already used doesn't make him re-answer
  // from scratch.
  async function handleNameNext(name: string) {
    const trimmed = name.trim()
    if (!trimmed) return
    setPendingName(trimmed)
    const profiles = await listProfiles()
    const existing = profiles.find((p) => p.name.toLowerCase() === trimmed.toLowerCase())
    setDefaultAge(existing?.age ?? null)
    setDefaultTheme(existing?.theme ?? 'surprise')
    setStage('details')
  }

  // A name maps to a profile: an existing profile with that name
  // (case-insensitive) is reused (its age/theme updated to whatever
  // was just entered), a new name gets a fresh profile — so this
  // doubles as how a second kid gets their own separate progress
  // without any sign-up step.
  async function handleDetailsSubmit(age: number, theme: ImageTheme) {
    const profiles = await listProfiles()
    const existing = profiles.find((p) => p.name.toLowerCase() === pendingName.toLowerCase())
    const resolved = existing
      ? await updateProfile({ ...existing, age, theme })
      : await createProfile(pendingName, age, theme)
    setActiveProfileId(resolved.id)
    setProfile(resolved)
    setView('practice')
    setStage('main')
  }

  if (stage === 'landing') {
    return (
      <div className="page-backdrop">
        <div className="app-device">
          <main className="app-main">
            <LandingScreen onStart={() => setStage('name')} />
          </main>
        </div>
      </div>
    )
  }

  if (stage === 'name') {
    return (
      <div className="page-backdrop">
        <div className="app-device">
          <main className="app-main">
            <NameScreen defaultName={defaultName} onSubmit={handleNameNext} />
          </main>
        </div>
      </div>
    )
  }

  if (stage === 'details') {
    return (
      <div className="page-backdrop">
        <div className="app-device">
          <main className="app-main">
            <DetailsScreen
              defaultAge={defaultAge}
              defaultTheme={defaultTheme}
              onSubmit={handleDetailsSubmit}
            />
          </main>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="page-backdrop">
        <div className="screen-centered">Setting up…</div>
      </div>
    )
  }

  return (
    <div className="page-backdrop">
      <div className="app-device">
        {/* Same markup serves both layouts — a left sidebar on tablet/desktop,
            a top bar on narrow phone widths — the CSS media query handles the
            reflow, so there's nothing to branch on here. */}
        <nav className="side-nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              className={
                'nav-button' +
                (view === item.id ? ' active' : '') +
                (item.id === 'tables' ? ' nav-button-mult' : '')
              }
              onClick={() => setView(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <main className="app-main">
          {view === 'practice' && (
            <PracticeScreen profileId={profile.id} profileName={profile.name} profileAge={profile.age} />
          )}
          {view === 'tables' && <TableMatchScreen />}
          {view === 'resources' && <ResourceScreen />}
        </main>
      </div>
    </div>
  )
}

export default App
