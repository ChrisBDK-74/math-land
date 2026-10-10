// Tracks which profile is currently active on this device. This is the
// only thing that lives outside IndexedDB — it's a pointer, not data, so
// localStorage is fine for it. Everything that matters (mastery records,
// sessions) is keyed by profileId in IndexedDB, not by device, so a
// second profile is just "create another profile id", not a rebuild.

const KEY = 'math-app:active-profile-id'

export function getActiveProfileId(): string | null {
  return localStorage.getItem(KEY)
}

export function setActiveProfileId(id: string): void {
  localStorage.setItem(KEY, id)
}
