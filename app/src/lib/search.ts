import type { Champion, Guide, QueryInput } from '../types'

export function matchPublicGuides(
  guides: Guide[],
  query: QueryInput,
  champions: Champion[],
) {
  const q = query.q.trim().toLowerCase()
  const champByName = q
    ? champions.find(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.id.toLowerCase() === q ||
          c.name === query.q.trim(),
      )
    : undefined

  const championId = query.championId || champByName?.id || ''

  return guides
    .filter((g) => g.status === 'published' && g.visibility === 'public')
    .filter((g) => {
      if (championId && g.championId !== championId) return false
      if (query.role && g.role !== query.role) return false
      if (!q) return true
      if (champByName && g.championId === champByName.id) return true
      const hay = `${g.title} ${g.tags.join(' ')} ${g.body}`.toLowerCase()
      return hay.includes(q)
    })
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export function resolveChampionFromQuery(
  query: QueryInput,
  champions: Champion[],
) {
  if (query.championId) {
    return champions.find((c) => c.id === query.championId)
  }
  const q = query.q.trim()
  if (!q) return undefined
  return champions.find(
    (c) => c.name === q || c.name.includes(q) || c.id.toLowerCase() === q.toLowerCase(),
  )
}

export function shouldAutoWebSearch(playerHits: Guide[]) {
  return playerHits.length === 0
}
