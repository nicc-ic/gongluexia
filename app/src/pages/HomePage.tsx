import { type FormEvent, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChampionTile, GuideCard, PageHeader } from '../components/ui'
import { POPULAR_IDS } from '../lib/roles'
import { useApp } from '../store'

export function HomePage() {
  const { champions, version, guides, patch, error } = useApp()
  const [q, setQ] = useState('')
  const nav = useNavigate()

  const popular = useMemo(() => {
    const map = new Map(champions.map((c) => [c.id, c]))
    const picked = POPULAR_IDS.map((id) => map.get(id)).filter(Boolean)
    return (picked.length ? picked : champions.slice(0, 20)) as typeof champions
  }, [champions])

  const latest = useMemo(
    () =>
      guides
        .filter((g) => g.status === 'published' && g.visibility === 'public')
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .slice(0, 6),
    [guides],
  )

  function onSearch(e: FormEvent) {
    e.preventDefault()
    const query = q.trim()
    nav(query ? `/search?q=${encodeURIComponent(query)}` : '/search')
  }

  return (
    <>
      <PageHeader title="首页" />
      <div className="page">
        <section className="hero-block">
          <p className="eyebrow">英雄联盟 · {patch}</p>
          <h2>先看玩家实战，没有就联网检索。</h2>
          <p className="muted">
            冷启动也不会空白。查盖伦能看到玩家分享；查阿狸会自动去网上找本版本策略。
          </p>
          <form className="search-form" onSubmit={onSearch}>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="搜英雄、对线、克制、出装…"
            />
            <button type="submit" className="btn btn-gold">
              查询
            </button>
          </form>
          {error ? <p className="warn">{error}</p> : null}
        </section>

        <section>
          <div className="section-head">
            <h3>热门英雄</h3>
            <button type="button" className="text-link" onClick={() => nav('/search')}>
              全部
            </button>
          </div>
          <div className="champ-grid">
            {popular.map((c) => (
              <ChampionTile key={c.id} champion={c} version={version} />
            ))}
          </div>
        </section>

        <section>
          <div className="section-head">
            <h3>最新公开分享</h3>
          </div>
          {latest.length ? (
            <div className="stack">
              {latest.map((g) => (
                <GuideCard key={g.id} guide={g} />
              ))}
            </div>
          ) : (
            <p className="empty">还没有玩家公开攻略。去查询页试试联网检索，或登录后投稿。</p>
          )}
        </section>
      </div>
    </>
  )
}
