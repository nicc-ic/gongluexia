import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Chip, EmptyHint, GuideCard, PageHeader, SourceBadge } from '../components/ui'
import { championSplash } from '../lib/ddragon'
import { inferRoles, roleLabel, ROLES, TAG_LABEL } from '../lib/roles'
import { retrieveWebGuide } from '../lib/webStrategy'
import { useApp, useChampion } from '../store'
import type { Role, WebGuide } from '../types'

export function ChampionPage() {
  const { id = '' } = useParams()
  const champ = useChampion(id)
  const { guides, version, patch } = useApp()
  const nav = useNavigate()
  const roles = champ ? inferRoles(champ) : []
  const [role, setRole] = useState<Role | ''>('')
  const [web, setWeb] = useState<WebGuide | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setRole(roles[0] ?? '')
    setWeb(null)
  }, [id])

  const playerHits = useMemo(
    () =>
      guides.filter(
        (g) =>
          g.status === 'published' &&
          g.visibility === 'public' &&
          g.championId === id &&
          (!role || g.role === role),
      ),
    [guides, id, role],
  )

  useEffect(() => {
    if (!champ || !role || playerHits.length > 0) {
      if (playerHits.length > 0) setWeb(null)
      return
    }
    let cancelled = false
    setLoading(true)
    retrieveWebGuide({ version, patch, champion: champ, role })
      .then((g) => {
        if (!cancelled) setWeb(g)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [champ, role, playerHits.length, version, patch])

  if (!champ) {
    return (
      <>
        <PageHeader title="英雄" back />
        <EmptyHint text="找不到这个英雄。" />
      </>
    )
  }

  return (
    <>
      <PageHeader
        title={champ.name}
        back
        extra={
          <button
            type="button"
            className="text-link"
            onClick={() => nav(`/publish?champion=${champ.id}&role=${role || roles[0]}`)}
          >
            写攻略
          </button>
        }
      />
      <div
        className="splash"
        style={{ backgroundImage: `url(${championSplash(champ.id)})` }}
      >
        <div className="splash-mask">
          <p className="eyebrow">{champ.title}</p>
          <p className="muted">
            {champ.tags.map((t) => TAG_LABEL[t] ?? t).join(' / ')}
          </p>
        </div>
      </div>
      <div className="page">
        <div className="chip-row">
          {ROLES.filter((r) => roles.includes(r.id)).map((r) => (
            <Chip key={r.id} active={role === r.id} onClick={() => setRole(r.id)}>
              {r.label}
            </Chip>
          ))}
        </div>

        <section>
          <div className="section-head">
            <h3>玩家分享</h3>
          </div>
          {playerHits.length ? (
            <div className="stack">
              {playerHits.map((g) => (
                <GuideCard key={g.id} guide={g} />
              ))}
            </div>
          ) : (
            <p className="empty tight">
              {role ? `${champ.name} ${roleLabel(role as Role)} ` : ''}还没有玩家公开攻略。
            </p>
          )}
        </section>

        <section>
          <div className="section-head">
            <h3>网络策略</h3>
          </div>
          {playerHits.length > 0 ? (
            <p className="empty tight">已有玩家分享，优先展示社区内容。</p>
          ) : loading ? (
            <div className="web-loading">
              <div className="pulse" />
              <p>正在检索本版本策略…</p>
            </div>
          ) : web ? (
            <Link className="card web-card" to={`/web/${encodeURIComponent(web.queryKey)}`} state={{ web }}>
              <div className="guide-card-top">
                <SourceBadge kind="web" />
                <span className="muted">{web.patch}版本</span>
              </div>
              <h3>{web.title}</h3>
              <p>{web.summary.core}</p>
            </Link>
          ) : null}
        </section>
      </div>
    </>
  )
}
