import { useMemo, useState } from 'react'
import { Chip, EmptyHint, GuideCard, LoginGate, PageHeader } from '../components/ui'
import { useApp } from '../store'

type Filter = 'all' | 'public' | 'private' | 'fav'

export function MinePage() {
  const { user, logout, guides, favorites, githubConnected, syncError } = useApp()
  const [filter, setFilter] = useState<Filter>('all')

  const mine = useMemo(
    () =>
      guides
        .filter((g) => g.authorId === user?.id && g.status === 'published')
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [guides, user],
  )

  const favGuides = useMemo(
    () =>
      guides.filter(
        (g) =>
          favorites.includes(g.id) &&
          g.status === 'published' &&
          g.visibility === 'public',
      ),
    [guides, favorites],
  )

  const list =
    filter === 'fav'
      ? favGuides
      : mine.filter((g) => {
          if (filter === 'public') return g.visibility === 'public'
          if (filter === 'private') return g.visibility === 'private'
          return true
        })

  if (!user) {
    return (
      <>
        <PageHeader title="我的" />
        <LoginGate hint="用 GitHub 登录后，公开攻略会写进仓库 data/public-guides.json。私有笔记只留在本机，不会上传。" />
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="我的"
        extra={
          <button type="button" className="text-link" onClick={logout}>
            退出
          </button>
        }
      />
      <div className="page">
        <div className="profile">
          <div className="avatar">{user.name.slice(0, 1)}</div>
          <div>
            <h2>{user.name}</h2>
            <p className="muted">
              {githubConnected ? '已连接 GitHub' : '未连接 GitHub'}
              {' · '}公开 {mine.filter((g) => g.visibility === 'public').length}
              {' · '}私有 {mine.filter((g) => g.visibility === 'private').length}
            </p>
            {syncError ? <p className="warn">{syncError}</p> : null}
          </div>
        </div>

        <div className="chip-row">
          <Chip active={filter === 'all'} onClick={() => setFilter('all')}>
            全部
          </Chip>
          <Chip active={filter === 'public'} onClick={() => setFilter('public')}>
            公开
          </Chip>
          <Chip active={filter === 'private'} onClick={() => setFilter('private')}>
            私有
          </Chip>
          <Chip active={filter === 'fav'} onClick={() => setFilter('fav')}>
            收藏
          </Chip>
        </div>

        {list.length ? (
          <div className="stack">
            {list.map((g) => (
              <GuideCard key={g.id} guide={g} />
            ))}
          </div>
        ) : (
          <EmptyHint
            text={
              filter === 'fav'
                ? '还没有收藏公开攻略。'
                : '还没有攻略。去投稿页写下第一篇，默认仅自己可见。'
            }
          />
        )}
      </div>
    </>
  )
}
