import { type FormEvent, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Chip, LoginGate, PageHeader } from '../components/ui'
import { championIcon } from '../lib/ddragon'
import { inferRoles, ROLES } from '../lib/roles'
import { useApp } from '../store'
import type { ContentType, Role, Visibility } from '../types'

export function PublishPage() {
  const { user, champions, version, guides, saveGuide } = useApp()
  const [params] = useSearchParams()
  const nav = useNavigate()
  const editing = guides.find(
    (g) => g.id === params.get('id') && g.authorId === user?.id && g.status === 'published',
  )

  const [title, setTitle] = useState(editing?.title ?? '')
  const [championId, setChampionId] = useState(
    editing?.championId || params.get('champion') || '',
  )
  const [role, setRole] = useState<Role | ''>(
    editing?.role || (params.get('role') as Role) || '',
  )
  const [contentType, setContentType] = useState<ContentType>(
    editing?.contentType ?? 'tactic',
  )
  const [tagText, setTagText] = useState(editing?.tags.join(' ') ?? '')
  const [body, setBody] = useState(editing?.body ?? '')
  const [visibility, setVis] = useState<Visibility>(editing?.visibility ?? 'private')
  const [champQ, setChampQ] = useState('')
  const [err, setErr] = useState('')

  const champ = champions.find((c) => c.id === championId)
  const suggestedRoles = champ ? inferRoles(champ) : ROLES.map((r) => r.id)

  const champList = useMemo(() => {
    const t = champQ.trim()
    const list = t
      ? champions.filter((c) => c.name.includes(t) || c.id.toLowerCase().includes(t.toLowerCase()))
      : champions
    return list.slice(0, 16)
  }, [champQ, champions])

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    setErr('')
    if (!title.trim() || title.trim().length < 2 || title.trim().length > 40) {
      setErr('标题需要 2–40 个字。')
      return
    }
    if (!championId || !role) {
      setErr('请选择英雄和分路。')
      return
    }
    if (!body.trim()) {
      setErr('请填写正文。')
      return
    }
    if (visibility === 'public' && !confirm('公开后所有人可搜到这篇内容，并会优先于网络检索展示。确认公开？')) {
      return
    }
    const tags = tagText
      .split(/[,，\s]+/)
      .map((x) => x.trim())
      .filter(Boolean)
      .slice(0, 5)
    const saved = saveGuide({
      id: editing?.id,
      title: title.trim(),
      championId,
      role,
      contentType,
      tags,
      body: body.trim(),
      visibility,
    })
    nav(`/guide/${saved.id}`)
  }

  if (!user) {
    return (
      <>
        <PageHeader title="投稿" />
        <LoginGate hint="连接 GitHub 后才能投稿。公开内容会同步到仓库；私有默认只留在本机。" />
      </>
    )
  }

  return (
    <>
      <PageHeader title={editing ? '编辑攻略' : '投稿'} />
      <form className="page form" onSubmit={onSubmit}>
        <label>
          标题
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="例如：这版芮尔辅助怎么开团" />
        </label>

        <label>
          搜索英雄
          <input value={champQ} onChange={(e) => setChampQ(e.target.value)} placeholder="输入中文名" />
        </label>
        <div className="champ-row wrap">
          {champList.map((c) => (
            <button
              type="button"
              key={c.id}
              className={`mini-champ ${championId === c.id ? 'on' : ''}`}
              onClick={() => {
                setChampionId(c.id)
                const roles = inferRoles(c)
                if (!role || !roles.includes(role as Role)) setRole(roles[0])
              }}
            >
              <img src={championIcon(version, c.id)} alt="" />
              {c.name}
            </button>
          ))}
        </div>

        <p className="label">分路</p>
        <div className="chip-row">
          {ROLES.filter((r) => suggestedRoles.includes(r.id)).map((r) => (
            <Chip key={r.id} active={role === r.id} onClick={() => setRole(r.id)}>
              {r.label}
            </Chip>
          ))}
        </div>

        <p className="label">类型</p>
        <div className="chip-row">
          <Chip active={contentType === 'tactic'} onClick={() => setContentType('tactic')}>
            战斗策略
          </Chip>
          <Chip active={contentType === 'guide'} onClick={() => setContentType('guide')}>
            攻略
          </Chip>
        </div>

        <label>
          标签（空格分隔，最多 5 个）
          <input value={tagText} onChange={(e) => setTagText(e.target.value)} placeholder="对线 克制 开局 团战" />
        </label>

        <label>
          正文
          <textarea
            rows={8}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="写出装、符文、换血、打野路线或团战站位。请用自己的话写，不要整篇搬运。"
          />
        </label>

        <div className="vis-row">
          <div>
            <p className="label">可见性</p>
            <p className="muted">默认私有，避免误公开个人笔记。</p>
          </div>
          <button
            type="button"
            className={`switch ${visibility === 'public' ? 'on' : ''}`}
            onClick={() => setVis(visibility === 'public' ? 'private' : 'public')}
          >
            {visibility === 'public' ? '公开共享' : '仅自己可见'}
          </button>
        </div>

        {err ? <p className="warn">{err}</p> : null}
        <button type="submit" className="btn btn-gold block">
          {editing ? '保存' : '发布'}
        </button>
      </form>
    </>
  )
}
