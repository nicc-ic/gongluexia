import type { ReactNode } from 'react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { Champion, Guide, Visibility } from '../types'
import { championIcon } from '../lib/ddragon'
import { roleLabel } from '../lib/roles'
import { useApp } from '../store'

export function PageHeader({
  title,
  back,
  extra,
}: {
  title: string
  back?: boolean
  extra?: ReactNode
}) {
  const nav = useNavigate()
  return (
    <header className="nav-bar">
      {back ? (
        <button type="button" className="nav-back" onClick={() => nav(-1)} aria-label="返回">
          ‹
        </button>
      ) : (
        <span className="nav-back spacer" />
      )}
      <h1>{title}</h1>
      <div className="nav-extra">{extra}</div>
    </header>
  )
}

export function VisibilityBadge({ value }: { value: Visibility }) {
  return (
    <span className={`badge ${value === 'public' ? 'badge-public' : 'badge-private'}`}>
      {value === 'public' ? '公开' : '私有'}
    </span>
  )
}

export function SourceBadge({ kind }: { kind: 'user' | 'web' }) {
  return (
    <span className={`badge ${kind === 'user' ? 'badge-user' : 'badge-web'}`}>
      {kind === 'user' ? '玩家分享' : '网络策略'}
    </span>
  )
}

export function ChampionTile({
  champion,
  version,
  onClick,
}: {
  champion: Champion
  version: string
  onClick?: () => void
}) {
  const inner = (
    <>
      <img src={championIcon(version, champion.id)} alt="" />
      <span>{champion.name}</span>
    </>
  )
  if (onClick) {
    return (
      <button type="button" className="champ-tile" onClick={onClick}>
        {inner}
      </button>
    )
  }
  return (
    <Link className="champ-tile" to={`/champion/${champion.id}`}>
      {inner}
    </Link>
  )
}

export function GuideCard({ guide }: { guide: Guide }) {
  const { champions, version } = useApp()
  const champ = champions.find((c) => c.id === guide.championId)
  return (
    <Link className="card guide-card" to={`/guide/${guide.id}`}>
      <img
        className="guide-card-icon"
        src={championIcon(version, guide.championId)}
        alt=""
      />
      <div className="guide-card-body">
        <div className="guide-card-top">
          <SourceBadge kind="user" />
          <VisibilityBadge value={guide.visibility} />
        </div>
        <h3>{guide.title}</h3>
        <p>
          {champ?.name ?? guide.championId} · {roleLabel(guide.role)} · {guide.patch}版本
          {' · '}
          {guide.authorName}
        </p>
      </div>
    </Link>
  )
}

export function EmptyHint({ text }: { text: string }) {
  return <p className="empty">{text}</p>
}

export function LoginGate({ hint }: { hint: string }) {
  const { loginGithub, syncError } = useApp()
  const [token, setToken] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  async function onConnect() {
    setErr('')
    setBusy(true)
    try {
      await loginGithub(token.trim())
    } catch (e) {
      setErr(e instanceof Error ? e.message : '连接失败')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="login-gate">
      <p>{hint}</p>
      <input
        type="password"
        value={token}
        onChange={(e) => setToken(e.target.value)}
        placeholder="粘贴 GitHub Token（contents 读写）"
      />
      <button type="button" className="btn btn-wechat" disabled={busy || !token.trim()} onClick={onConnect}>
        {busy ? '连接中…' : '连接 GitHub'}
      </button>
      <p className="muted">
        在 GitHub → Settings → Developer settings → Fine-grained tokens 创建，只授权仓库
        gongluexia 的 Contents 读写。Token 只存在本机，不会提交进仓库。
      </p>
      {err || syncError ? <p className="warn">{err || syncError}</p> : null}
    </div>
  )
}

export function Chip({
  active,
  children,
  onClick,
}: {
  active?: boolean
  children: ReactNode
  onClick: () => void
}) {
  return (
    <button type="button" className={`chip ${active ? 'chip-on' : ''}`} onClick={onClick}>
      {children}
    </button>
  )
}
