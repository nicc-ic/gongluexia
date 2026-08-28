import { useLocation, useParams } from 'react-router-dom'
import { PageHeader, SourceBadge } from '../components/ui'
import { loadWebCache } from '../lib/storage'
import type { WebGuide } from '../types'

export function WebGuidePage() {
  const { queryKey = '' } = useParams()
  const loc = useLocation()
  const fromState = (loc.state as { web?: WebGuide } | null)?.web
  const cache = loadWebCache() as Record<string, WebGuide>
  const key = decodeURIComponent(queryKey)
  const web = fromState ?? cache[key]

  if (!web) {
    return (
      <>
        <PageHeader title="网络策略" back />
        <p className="empty">检索结果已过期，请返回查询页重新检索。</p>
      </>
    )
  }

  const fetched = new Date(web.fetchedAt).toLocaleString('zh-CN')

  return (
    <>
      <PageHeader title="网络策略" back />
      <div className="page">
        <div className="guide-card-top">
          <SourceBadge kind="web" />
          <span className="muted">{web.patch}版本</span>
        </div>
        <h2 className="detail-title">{web.title}</h2>
        <p className="muted">检索时间 {fetched} · 非玩家原创</p>

        <section className="block">
          <h3>核心思路</h3>
          <p>{web.summary.core}</p>
        </section>
        <section className="block">
          <h3>出装倾向</h3>
          <p>{web.summary.build}</p>
        </section>
        <section className="block">
          <h3>符文倾向</h3>
          <p>{web.summary.runes}</p>
        </section>
        <section className="block">
          <h3>技能加点</h3>
          <p>{web.summary.skills}</p>
        </section>
        <section className="block">
          <h3>对线 / 打野要点</h3>
          <p>{web.summary.laning}</p>
        </section>
        <section className="block">
          <h3>注意事项</h3>
          <p>{web.summary.notes}</p>
        </section>

        <section className="block">
          <h3>来源</h3>
          <ul className="source-list">
            {web.sources.map((s) => (
              <li key={s.url}>
                <a href={s.url} target="_blank" rel="noreferrer">
                  {s.siteName} · {s.title}
                </a>
              </li>
            ))}
          </ul>
        </section>

        <p className="disclaimer">
          内容由网络检索整理，仅供参考，版权归原作者，请以游戏内实际版本为准。禁止把本摘要转存为你的公开攻略。
        </p>
      </div>
    </>
  )
}
