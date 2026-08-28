import type { Champion } from '../types'

const VERSION_URL = 'https://ddragon.leagueoflegends.com/api/versions.json'

export function patchFromVersion(version: string) {
  const [a, b] = version.split('.')
  return `${a}.${b}`
}

export function championIcon(version: string, id: string) {
  return `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${id}.png`
}

export function championSplash(id: string) {
  return `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${id}_0.jpg`
}

export function championLoading(id: string) {
  return `https://ddragon.leagueoflegends.com/cdn/img/champion/loading/${id}_0.jpg`
}

export async function fetchLatestVersion() {
  const res = await fetch(VERSION_URL)
  if (!res.ok) throw new Error('无法获取游戏版本')
  const versions: string[] = await res.json()
  return versions[0]
}

export async function fetchChampions(version: string): Promise<Champion[]> {
  const res = await fetch(
    `https://ddragon.leagueoflegends.com/cdn/${version}/data/zh_CN/champion.json`,
  )
  if (!res.ok) throw new Error('无法获取英雄列表')
  const json = await res.json()
  const list = Object.values(json.data as Record<string, {
    id: string
    name: string
    title: string
    tags: string[]
    blurb: string
  }>)
  return list
    .map((c) => {
      // 部分中文版本把「亚索 / 疾风剑豪」的 name、title 对调了
      const swapped = c.title.length <= 4 && c.name.length > c.title.length
      return {
        id: c.id,
        name: swapped ? c.title : c.name,
        title: swapped ? c.name : c.title,
        tags: c.tags,
        blurb: c.blurb,
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))
}

export type ChampionDetail = {
  id: string
  name: string
  title: string
  tags: string[]
  blurb: string
  allytips: string[]
  enemytips: string[]
  spells: { id: string; name: string; description: string }[]
  passive: { name: string; description: string }
}

export async function fetchChampionDetail(version: string, id: string) {
  const res = await fetch(
    `https://ddragon.leagueoflegends.com/cdn/${version}/data/zh_CN/champion/${id}.json`,
  )
  if (!res.ok) throw new Error('无法获取英雄详情')
  const json = await res.json()
  const c = json.data[id]
  return {
    id: c.id as string,
    name: c.name as string,
    title: c.title as string,
    tags: c.tags as string[],
    blurb: c.blurb as string,
    allytips: (c.allytips as string[]) ?? [],
    enemytips: (c.enemytips as string[]) ?? [],
    spells: (c.spells as { id: string; name: string; description: string }[]).map(
      (s) => ({ id: s.id, name: s.name, description: s.description }),
    ),
    passive: {
      name: c.passive?.name ?? '被动',
      description: c.passive?.description ?? '',
    },
  } satisfies ChampionDetail
}
