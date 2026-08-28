export type Role = 'top' | 'jungle' | 'mid' | 'adc' | 'support'
export type ContentType = 'guide' | 'tactic'
export type Visibility = 'public' | 'private'

export type Champion = {
  id: string
  name: string
  title: string
  tags: string[]
  blurb: string
}

export type User = {
  id: string
  name: string
}

export type Guide = {
  id: string
  title: string
  championId: string
  role: Role
  contentType: ContentType
  patch: string
  tags: string[]
  body: string
  visibility: Visibility
  status: 'published' | 'removed'
  sourceType: 'user'
  authorId: string
  authorName: string
  createdAt: string
  updatedAt: string
}

export type WebSource = {
  title: string
  siteName: string
  url: string
}

export type WebGuide = {
  queryKey: string
  championId?: string
  role?: Role
  keyword?: string
  patch: string
  title: string
  summary: {
    core: string
    build: string
    runes: string
    skills: string
    laning: string
    notes: string
  }
  sources: WebSource[]
  fetchedAt: string
  sourceType: 'web'
}

export type QueryInput = {
  q: string
  championId: string
  role: Role | ''
}
