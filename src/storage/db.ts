import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { MasteryRecord, SessionRecord } from '../engine/types'
import { createId } from '../utils/uuid'

export type ImageTheme = 'rockets' | 'flowers' | 'surprise'

interface Profile {
  id: string
  name: string
  createdAt: string
  /**
   * A starting-point hint only — used once, at the very first session,
   * to pick a sensible initial stage (see engine/progress.ts'
   * stageFloorForAge). Never re-consulted after that, so there's no
   * need to keep it updated as a kid gets older.
   */
  age?: number
  /** Which image set to use once themed art exists; "surprise" mixes both. */
  theme?: ImageTheme
  /**
   * How many of the Space Mission's 7 rocket pieces have been earned
   * so far (0-7). Placeholder mechanic: a session with at least 10/15
   * correct adds one piece. Will need a per-mission shape once a
   * second mission exists; one flat counter is enough while there's
   * only Space Mission.
   */
  missionPieces?: number
}

interface MathAppDB extends DBSchema {
  profiles: {
    key: string
    value: Profile
  }
  mastery: {
    key: [string, string] // [profileId, itemId]
    value: MasteryRecord
    indexes: { 'by-profile': string }
  }
  sessions: {
    key: string
    value: SessionRecord
    indexes: { 'by-profile': string }
  }
}

let dbPromise: Promise<IDBPDatabase<MathAppDB>> | null = null

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<MathAppDB>('math-app', 1, {
      upgrade(db) {
        db.createObjectStore('profiles', { keyPath: 'id' })

        const mastery = db.createObjectStore('mastery', {
          keyPath: ['profileId', 'itemId'],
        })
        mastery.createIndex('by-profile', 'profileId')

        const sessions = db.createObjectStore('sessions', { keyPath: 'id' })
        sessions.createIndex('by-profile', 'profileId')
      },
    })
  }
  return dbPromise
}

// --- Profiles ---

export async function listProfiles(): Promise<Profile[]> {
  const db = await getDB()
  return db.getAll('profiles')
}

export async function createProfile(
  name: string,
  age?: number,
  theme?: ImageTheme,
): Promise<Profile> {
  const db = await getDB()
  const profile: Profile = {
    id: createId(),
    name,
    createdAt: new Date().toISOString(),
    age,
    theme,
  }
  await db.put('profiles', profile)
  return profile
}

export async function updateProfile(profile: Profile): Promise<Profile> {
  const db = await getDB()
  await db.put('profiles', profile)
  return profile
}

// --- Mastery records ---

export async function getMasteryRecords(profileId: string): Promise<MasteryRecord[]> {
  const db = await getDB()
  return db.getAllFromIndex('mastery', 'by-profile', profileId)
}

export async function getMasteryRecord(
  profileId: string,
  itemId: string,
): Promise<MasteryRecord | undefined> {
  const db = await getDB()
  return db.get('mastery', [profileId, itemId])
}

export async function putMasteryRecord(record: MasteryRecord): Promise<void> {
  const db = await getDB()
  await db.put('mastery', record)
}

// --- Sessions ---

export async function putSession(session: SessionRecord): Promise<void> {
  const db = await getDB()
  await db.put('sessions', session)
}

export async function getSessions(profileId: string): Promise<SessionRecord[]> {
  const db = await getDB()
  return db.getAllFromIndex('sessions', 'by-profile', profileId)
}

export type { Profile }
