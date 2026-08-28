import type { Guide } from '../types'

const GUIDES_KEY = 'gongluexia.guides'
const USER_KEY = 'gongluexia.user'
const FAV_KEY = 'gongluexia.favorites'
const WEB_KEY = 'gongluexia.web-cache.v2'

export function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export function saveJson(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value))
}

export function loadGuides(): Guide[] {
  return loadJson<Guide[]>(GUIDES_KEY, [])
}

export function saveGuides(guides: Guide[]) {
  saveJson(GUIDES_KEY, guides)
}

export function loadUser() {
  return loadJson<{ id: string; name: string } | null>(USER_KEY, null)
}

export function saveUser(user: { id: string; name: string } | null) {
  if (!user) localStorage.removeItem(USER_KEY)
  else saveJson(USER_KEY, user)
}

export function loadFavorites() {
  return loadJson<string[]>(FAV_KEY, [])
}

export function saveFavorites(ids: string[]) {
  saveJson(FAV_KEY, ids)
}

export function loadWebCache() {
  return loadJson<Record<string, unknown>>(WEB_KEY, {})
}

export function saveWebCache(cache: Record<string, unknown>) {
  saveJson(WEB_KEY, cache)
}

export { GUIDES_KEY, USER_KEY, FAV_KEY, WEB_KEY }
