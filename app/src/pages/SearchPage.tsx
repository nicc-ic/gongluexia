import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Chip, EmptyHint, GuideCard, PageHeader, SourceBadge } from '../components/ui'
import { retrieveWebGuide } from '../lib/webStrategy'
import { matchPublicGuides, resolveChampionFromQuery, shouldAutoWebSearch } from '../lib/search'
import { inferRoles, ROLES } from '../lib/roles'
import { useApp } from '../store'
import type { Role, WebGuide } from '../types'
import { championIcon } from '../lib/ddragon'

export function SearchPage() {
  const { champions, guides, version, patch } = useApp()
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState(params.get('q') ?? '')
  const [championId, setChampionId] = useState(params.get('champion') ?? '')
  const [role, setRole] = useState<Role | ''>((params.get('role') as Role) || '')
  const [web, setWeb] = useState<WebGuide | null>(null)
  const [webLoading, setWebLoading] = useState(false)
  const [webError, setWebError] = useState('')
  const [forceWeb, setForceWeb] = useState(false)

  const query = { q, championId, role }

  const playerHits = useMemo(
    () => matchPublicGuides(guides, query, champions),
    [guides, q, championId, role, champions],
  )

  const resolved = useMemo(
    () => resolveChampionFromQuery(query, champions),
    [q, championId, champions],
  )

  const champOptions = useMemo(() => {
    const text = q.trim()
    if (!text) return champions.slice(0, 24)
    return champions
      .filter(
        (c) =>
          c.name.includes(text) ||
          c.id.toLowerCase().includes(text.toLowerCase()),
      )
      .slice(0, 24)
  }, [champions, q])

  const autoWeb = shouldAutoWebSearch(playerHits) || forceWeb
  const hasQuery = Boolean(q.trim() || championId)


  useEffect(() => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (q) next.set('q', q)
        else next.delete('q')
        if (championId) next.set('champion', championId)
        else next.delete('champion')
        if (role) next.set('role', role)
        else next.delete('role')
        return next
      },
      { replace: true },
    )
  }, [q, championId, role, setParams])

  useEffect(() => {
    if (!hasQuery || !autoWeb) {
      if (!forceWeb) setWeb(null)
      setWebLoading(false)
      return
    }
    let cancelled = false
    setWebLoading(true)
    setWebError('')
    retrieveWebGuide({
      version,
      patch,
      champion: resolved,
      role: (role || (resolved ? inferRoles(resolved)[0] : 'mid')) as Role,
      keyword: q.trim() || undefined,
    })
      .then((g) => {
        if (!cancelled) setWeb(g)
      })
      .catch(() => {
        if (!cancelled) setWebError('检索超时，请重试。')
      })
      .finally(() => {
        if (!cancelled) setWebLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [autoWeb, hasQuery, version, patch, resolved, role, q, forceWeb])

  return (
    <>
      <PageHeader title="查询" />
      <div className="page">
        <input
          className="search-input"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="英雄名、对线、克制、出装…"
        />

        <div className="chip-row">
          <Chip active={!role} onClick={() => setRole('')}>
            全部分路
          </Chip>
          {ROLES.map((r) => (
            <Chip key={r.id} active={role === r.id} onClick={() => setRole(r.id)}>
              {r.label}
            </Chip>
          ))}
        </div>

        <div className="champ-row">
          <button
            type="button"
            className={`mini-champ ${!championId ? 'on' : ''}`}
            onClick={() => setChampionId('')}
          >
            全部
          </button>
          {champOptions.map((c) => (
            <button
              type="button"
              key={c.id}
              className={`mini-champ ${championId === c.id ? 'on' : ''}`}
              onClick={() => setChampionId(c.id === championId ? '' : c.id)}
            >
              <img src={championIcon(version, c.id)} alt="" />
              {c.name}
            </button>
          ))}
        </div>

        {!hasQuery ? (
          <EmptyHint text="选择英雄或输入关键词。没有玩家分享时，会自动检索网络策略。" />
        ) : (
          <>
            <section>
              <div className="section-head">
                <h3>玩家分享</h3>
                <span className="count">{playerHits.length}</span>
              </div>
              {playerHits.length ? (
                <div className="stack">
                  {playerHits.map((g) => (
                    <GuideCard key={g.id} guide={g} />
                  ))}
                </div>
              ) : (
                <p className="empty tight">
                  还没有玩家公开这篇。正在走联网兜底。
                </p>
              )}
            </section>

            <section>
              <div className="section-head">
                <h3>网络策略</h3>
                {playerHits.length > 0 && !forceWeb ? (
                  <button
                    type="button"
                    className="text-link"
                    onClick={() => setForceWeb(true)}
                  >
                    再查网络策略
                  </button>
                ) : null}
              </div>

              {webLoading ? (
                <div className="web-loading">
                  <div className="pulse" />
                  <p>正在检索本版本策略…</p>
                </div>
              ) : webError ? (
                <p className="warn">{webError}</p>
              ) : web ? (
                <Link className="card web-card" to={`/web/${encodeURIComponent(web.queryKey)}`} state={{ web }}>
                  <div className="guide-card-top">
                    <SourceBadge kind="web" />
                    <span className="muted">{web.patch}版本</span>
                  </div>
                  <h3>{web.title}</h3>
                  <p>{web.summary.core}</p>
                  <p className="source-line">
                    来源 {web.sources.map((s) => s.siteName).join(' / ')}
                  </p>
                </Link>
              ) : playerHits.length > 0 ? (
                <p className="empty tight">玩家攻略已优先展示。需要时再查网络补充。</p>
              ) : null}
            </section>
          </>
        )}
      </div>
    </>
  )
}
