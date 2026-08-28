import type { Guide } from '../types'

export const GITHUB_REPO_NAME = 'gongluexia'
export const GITHUB_DATA_FILE = 'data/public-guides.json'

const TOKEN_KEY = 'gongluexia.github-token'
const OWNER_KEY = 'gongluexia.github-owner'

export type GithubUser = {
  id: number
  login: string
  name: string | null
  avatar_url: string
}

export type PublicStore = {
  updatedAt: string
  guides: Guide[]
}

function toBase64(text: string) {
  const bytes = new TextEncoder().encode(text)
  let binary = ''
  bytes.forEach((b) => {
    binary += String.fromCharCode(b)
  })
  return btoa(binary)
}

function fromBase64(b64: string) {
  const bin = atob(b64.replace(/\n/g, ''))
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

export function loadGithubToken() {
  return localStorage.getItem(TOKEN_KEY) || ''
}

export function saveGithubToken(token: string) {
  if (!token) localStorage.removeItem(TOKEN_KEY)
  else localStorage.setItem(TOKEN_KEY, token)
}

export function loadGithubOwner() {
  return (
    localStorage.getItem(OWNER_KEY) ||
    (import.meta.env.VITE_GITHUB_OWNER as string | undefined) ||
    'nicc-ic'
  )
}

export function saveGithubOwner(owner: string) {
  if (!owner) localStorage.removeItem(OWNER_KEY)
  else localStorage.setItem(OWNER_KEY, owner)
}

function headers(token?: string): HeadersInit {
  const h: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }
  if (token) h.Authorization = `Bearer ${token}`
  return h
}

export async function fetchGithubUser(token: string): Promise<GithubUser> {
  const res = await fetch('https://api.github.com/user', { headers: headers(token) })
  if (!res.ok) throw new Error('GitHub 登录失败，请检查 Token 权限。')
  return res.json()
}

export async function fetchPublicStore(owner: string, token?: string) {
  if (!owner) return { store: null as PublicStore | null, sha: '' }
  const url = `https://api.github.com/repos/${owner}/${GITHUB_REPO_NAME}/contents/${GITHUB_DATA_FILE}`
  const res = await fetch(url, { headers: headers(token) })
  if (res.status === 404) return { store: null, sha: '' }
  if (!res.ok) throw new Error('读取 GitHub 攻略失败。')
  const json = await res.json()
  const parsed = JSON.parse(fromBase64(json.content)) as PublicStore
  return { store: parsed, sha: json.sha as string }
}

export async function putPublicStore(
  owner: string,
  token: string,
  guides: Guide[],
  sha?: string,
) {
  const publicGuides = guides.filter(
    (g) => g.visibility === 'public' && g.status === 'published',
  )
  const body: PublicStore = {
    updatedAt: new Date().toISOString(),
    guides: publicGuides,
  }
  const url = `https://api.github.com/repos/${owner}/${GITHUB_REPO_NAME}/contents/${GITHUB_DATA_FILE}`
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      ...headers(token),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: `sync public guides (${publicGuides.length})`,
      content: toBase64(JSON.stringify(body, null, 2) + '\n'),
      sha: sha || undefined,
    }),
  })
  if (res.status === 409 || res.status === 422) {
    const latest = await fetchPublicStore(owner, token)
    return putPublicStore(owner, token, guides, latest.sha)
  }
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`同步 GitHub 失败：${res.status} ${err.slice(0, 180)}`)
  }
  const json = await res.json()
  return json.content?.sha as string
}

export function mergeGuides(remote: Guide[], local: Guide[]) {
  const map = new Map<string, Guide>()
  remote.forEach((g) => map.set(g.id, g))
  local.forEach((g) => {
    if (g.visibility === 'private' || g.status === 'removed') {
      map.set(g.id, g)
      return
    }
    if (!map.has(g.id)) map.set(g.id, g)
  })
  return [...map.values()]
}
