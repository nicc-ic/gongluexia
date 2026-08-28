import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Champion, Guide, User, Visibility } from './types'
import { fetchChampions, fetchLatestVersion, patchFromVersion } from './lib/ddragon'
import {
  fetchGithubUser,
  fetchPublicStore,
  loadGithubOwner,
  loadGithubToken,
  mergeGuides,
  putPublicStore,
  saveGithubOwner,
  saveGithubToken,
} from './lib/github'
import {
  loadFavorites,
  loadGuides,
  loadUser,
  saveFavorites,
  saveGuides,
  saveUser,
} from './lib/storage'

const FALLBACK_CHAMPS: Champion[] = [
  { id: 'Garen', name: '盖伦', title: '德玛西亚之力', tags: ['Fighter', 'Tank'], blurb: '盖伦是一名高耐久战士，擅长对线压制与团战切入。' },
  { id: 'Ahri', name: '阿狸', title: '九尾妖狐', tags: ['Mage', 'Assassin'], blurb: '阿狸是灵活的中单法师，用魅惑与灵体打出爆发。' },
  { id: 'LeeSin', name: '李青', title: '盲僧', tags: ['Fighter', 'Assassin'], blurb: '李青是高操作打野，前期 gank 与反野能力突出。' },
  { id: 'Jinx', name: '金克丝', title: '暴走萝莉', tags: ['Marksman'], blurb: '金克丝是后期射手，团战需要站位与距离。' },
  { id: 'Thresh', name: '锤石', title: '魂锁典狱长', tags: ['Support', 'Fighter'], blurb: '锤石靠钩子、灯笼和盒子掌控下路节奏。' },
]

function seedGuide(patch: string): Guide {
  const now = new Date().toISOString()
  return {
    id: 'seed-garen-top',
    title: '盖伦上单：这版对线别急着换血',
    championId: 'Garen',
    role: 'top',
    contentType: 'tactic',
    patch,
    tags: ['对线', '换血', '团战'],
    body: [
      '这版盖伦对线别一上来就Q冲脸。先用被动回血把血线撑住，等对面技能打空再沉默进场。',
      '',
      '对战战士：短换血，Q沉默接E，立刻走开叠被动。对战远程：出鞋子后找兵线掩护接近。',
      '',
      '团战等对方关键控制交掉，再从侧翼进场砍C位。没大招时不要当开团按钮。',
      '',
      '出门多兰盾；对穿刺出防御鞋，对法系出水银鞋。核心坦度装按对面阵容选荆棘或自然之力。',
    ].join('\n'),
    visibility: 'public',
    status: 'published',
    sourceType: 'user',
    authorId: 'seed-player',
    authorName: '德玛老兵',
    createdAt: now,
    updatedAt: now,
  }
}

type GuideDraft = {
  id?: string
  title: string
  championId: string
  role: Guide['role']
  contentType: Guide['contentType']
  tags: string[]
  body: string
  visibility: Visibility
}

type AppContextValue = {
  ready: boolean
  error: string
  syncError: string
  githubConnected: boolean
  version: string
  patch: string
  champions: Champion[]
  user: User | null
  guides: Guide[]
  favorites: string[]
  loginGithub: (token: string) => Promise<void>
  logout: () => void
  saveGuide: (draft: GuideDraft) => Guide
  deleteGuide: (id: string) => void
  setVisibility: (id: string, visibility: Visibility) => void
  toggleFavorite: (id: string) => void
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')
  const [syncError, setSyncError] = useState('')
  const [githubConnected, setGithubConnected] = useState(false)
  const [githubSha, setGithubSha] = useState('')
  const [version, setVersion] = useState('15.16.1')
  const [champions, setChampions] = useState<Champion[]>(FALLBACK_CHAMPS)
  const [user, setUser] = useState<User | null>(null)
  const [guides, setGuides] = useState<Guide[]>([])
  const [favorites, setFavorites] = useState<string[]>([])

  const patch = patchFromVersion(version)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      let v = '15.16.1'
      try {
        v = await fetchLatestVersion()
        const list = await fetchChampions(v)
        if (cancelled) return
        setVersion(v)
        setChampions(list)
      } catch {
        if (!cancelled) setError('英雄数据加载失败，已使用本地备用名单。')
      } finally {
        if (cancelled) return
        const stored = loadGuides()
        const token = loadGithubToken()
        const owner = loadGithubOwner()
        let remote: Guide[] = []
        let sha = ''
        if (owner) {
          try {
            const got = await fetchPublicStore(owner, token)
            remote = got.store?.guides ?? []
            sha = got.sha
            setGithubSha(sha)
          } catch {
            if (!cancelled) setSyncError('暂时读不到 GitHub 上的公开攻略，先用本地数据。')
          }
        }
        const seeded = seedGuide(patchFromVersion(v))
        const merged = mergeGuides(
          remote.length ? remote : [seeded],
          stored,
        )
        if (!cancelled) {
          setGuides(merged)
          saveGuides(merged)
          setUser(loadUser())
          setFavorites(loadFavorites())
          setGithubConnected(Boolean(token && owner))
          setReady(true)
        }
        return
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const loginGithub = useCallback(async (token: string) => {
    const ghUser = await fetchGithubUser(token)
    saveGithubToken(token)
    saveGithubOwner(ghUser.login)
    const next = {
      id: `gh_${ghUser.id}`,
      name: ghUser.name || ghUser.login,
    }
    setUser(next)
    saveUser(next)
    setGithubConnected(true)
    setSyncError('')
    const got = await fetchPublicStore(ghUser.login, token)
    setGithubSha(got.sha)
    setGuides((current) => {
      const merged = mergeGuides(got.store?.guides ?? [], current)
      saveGuides(merged)
      return merged
    })
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    saveUser(null)
    saveGithubToken('')
    setGithubConnected(false)
  }, [])

  const syncPublic = useCallback(
    async (next: Guide[]) => {
      const token = loadGithubToken()
      const owner = loadGithubOwner()
      if (!token || !owner) return
      try {
        const sha = await putPublicStore(owner, token, next, githubSha)
        if (sha) setGithubSha(sha)
        setSyncError('')
      } catch (e) {
        setSyncError(e instanceof Error ? e.message : '同步 GitHub 失败')
      }
    },
    [githubSha],
  )

  const persist = useCallback(
    (next: Guide[]) => {
      setGuides(next)
      saveGuides(next)
      void syncPublic(next)
    },
    [syncPublic],
  )

  const saveGuide = useCallback(
    (draft: GuideDraft) => {
      if (!user) throw new Error('请先登录')
      const now = new Date().toISOString()
      if (draft.id) {
        const next = guides.map((g) =>
          g.id === draft.id && g.authorId === user.id
            ? {
                ...g,
                title: draft.title,
                championId: draft.championId,
                role: draft.role,
                contentType: draft.contentType,
                tags: draft.tags,
                body: draft.body,
                visibility: draft.visibility,
                patch,
                updatedAt: now,
              }
            : g,
        )
        persist(next)
        return next.find((g) => g.id === draft.id)!
      }
      const created: Guide = {
        id: `g_${Date.now()}`,
        title: draft.title,
        championId: draft.championId,
        role: draft.role,
        contentType: draft.contentType,
        patch,
        tags: draft.tags,
        body: draft.body,
        visibility: draft.visibility,
        status: 'published',
        sourceType: 'user',
        authorId: user.id,
        authorName: user.name,
        createdAt: now,
        updatedAt: now,
      }
      persist([created, ...guides])
      return created
    },
    [guides, persist, patch, user],
  )

  const deleteGuide = useCallback(
    (id: string) => {
      if (!user) return
      persist(
        guides.map((g) =>
          g.id === id && g.authorId === user.id ? { ...g, status: 'removed' } : g,
        ),
      )
    },
    [guides, persist, user],
  )

  const setVisibility = useCallback(
    (id: string, visibility: Visibility) => {
      if (!user) return
      persist(
        guides.map((g) =>
          g.id === id && g.authorId === user.id
            ? { ...g, visibility, updatedAt: new Date().toISOString() }
            : g,
        ),
      )
    },
    [guides, persist, user],
  )

  const toggleFavorite = useCallback(
    (id: string) => {
      const next = favorites.includes(id)
        ? favorites.filter((x) => x !== id)
        : [...favorites, id]
      setFavorites(next)
      saveFavorites(next)
    },
    [favorites],
  )

  const value = useMemo(
    () => ({
      ready,
      error,
      syncError,
      githubConnected,
      version,
      patch,
      champions,
      user,
      guides,
      favorites,
      loginGithub,
      logout,
      saveGuide,
      deleteGuide,
      setVisibility,
      toggleFavorite,
    }),
    [
      ready,
      error,
      syncError,
      githubConnected,
      version,
      patch,
      champions,
      user,
      guides,
      favorites,
      loginGithub,
      logout,
      saveGuide,
      deleteGuide,
      setVisibility,
      toggleFavorite,
    ],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}

export function useChampion(id?: string) {
  const { champions } = useApp()
  return champions.find((c) => c.id === id)
}
