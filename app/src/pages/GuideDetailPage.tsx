import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageHeader, SourceBadge, VisibilityBadge } from '../components/ui'
import { championIcon } from '../lib/ddragon'
import { roleLabel } from '../lib/roles'
import { useApp, useChampion } from '../store'

export function GuideDetailPage() {
  const { id = '' } = useParams()
  const nav = useNavigate()
  const { guides, user, deleteGuide, setVisibility, favorites, toggleFavorite, version } = useApp()
  const guide = guides.find((g) => g.id === id && g.status === 'published')
  const champ = useChampion(guide?.championId)
  const [msg, setMsg] = useState('')

  if (!guide) {
    return (
      <>
        <PageHeader title="攻略" back />
        <p className="empty">内容不存在或无权查看。</p>
      </>
    )
  }

  const isOwner = user?.id === guide.authorId
  const hiddenFromOthers = guide.visibility === 'private' && !isOwner
  if (hiddenFromOthers) {
    return (
      <>
        <PageHeader title="攻略" back />
        <p className="empty">内容不存在或无权查看。</p>
      </>
    )
  }

  function onDelete() {
    if (!confirm('确定删除这篇攻略？')) return
    deleteGuide(guide!.id)
    nav('/mine')
  }

  function onToggleVis() {
    if (guide!.visibility === 'private') {
      if (!confirm('公开后所有人可搜到这篇内容，并会优先于网络检索展示。确认公开？')) return
      setVisibility(guide!.id, 'public')
    } else {
      setVisibility(guide!.id, 'private')
    }
  }

  function onReport() {
    setMsg('已提交举报，我们会尽快处理。')
  }

  return (
    <>
      <PageHeader
        title="攻略详情"
        back
        extra={
          isOwner ? (
            <button type="button" className="text-link" onClick={() => nav(`/publish?id=${guide.id}`)}>
              编辑
            </button>
          ) : null
        }
      />
      <div className="page">
        <div className="detail-hero">
          <img src={championIcon(version, guide.championId)} alt="" />
          <div>
            <div className="guide-card-top">
              <SourceBadge kind="user" />
              <VisibilityBadge value={guide.visibility} />
            </div>
            <h2>{guide.title}</h2>
            <p className="muted">
              {champ?.name} · {roleLabel(guide.role)} · {guide.patch}版本 · {guide.authorName}
            </p>
          </div>
        </div>

        <div className="tag-row">
          {guide.tags.map((t) => (
            <span key={t} className="tag">
              {t}
            </span>
          ))}
          <span className="tag">{guide.contentType === 'tactic' ? '战斗策略' : '攻略'}</span>
        </div>

        <article className="article">{guide.body}</article>

        <div className="action-row">
          {guide.visibility === 'public' && user ? (
            <button type="button" className="btn btn-ghost" onClick={() => toggleFavorite(guide.id)}>
              {favorites.includes(guide.id) ? '已收藏' : '收藏'}
            </button>
          ) : null}
          {guide.visibility === 'public' && !isOwner ? (
            <button type="button" className="btn btn-ghost" onClick={onReport}>
              举报
            </button>
          ) : null}
          {isOwner ? (
            <>
              <button type="button" className="btn btn-ghost" onClick={onToggleVis}>
                {guide.visibility === 'public' ? '改为私有' : '改为公开'}
              </button>
              <button type="button" className="btn btn-danger" onClick={onDelete}>
                删除
              </button>
            </>
          ) : null}
        </div>
        {msg ? <p className="ok">{msg}</p> : null}
      </div>
    </>
  )
}
