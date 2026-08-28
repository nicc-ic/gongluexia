import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useApp } from '../store'

const TABS = [
  { to: '/', label: '首页', icon: '⌂' },
  { to: '/search', label: '查询', icon: '⌕' },
  { to: '/publish', label: '投稿', icon: '✎' },
  { to: '/mine', label: '我的', icon: '○' },
]

function isTab(pathname: string) {
  return TABS.some((t) => t.to === pathname)
}

export function Shell() {
  const { ready, patch } = useApp()
  const loc = useLocation()
  const [clock, setClock] = useState('')

  useEffect(() => {
    const tick = () => {
      const d = new Date()
      setClock(
        `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`,
      )
    }
    tick()
    const id = setInterval(tick, 10000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="stage">
      <div className="phone">
        <div className="status-bar">
          <span>{clock || '12:00'}</span>
          <span className="status-title">攻略匣</span>
          <span>{patch}版本</span>
        </div>
        {ready ? (
          <div className={`app-body ${isTab(loc.pathname) ? 'has-tab' : ''}`}>
            <Outlet />
          </div>
        ) : (
          <div className="boot">
            <p className="brand">攻略匣</p>
            <p>正在同步英雄联盟数据…</p>
          </div>
        )}
        {ready && isTab(loc.pathname) && (
          <nav className="tab-bar">
            {TABS.map((t) => (
              <NavLink
                key={t.to}
                to={t.to}
                end={t.to === '/'}
                className={({ isActive }) => `tab ${isActive ? 'tab-on' : ''}`}
              >
                <span className="tab-icon">{t.icon}</span>
                <span>{t.label}</span>
              </NavLink>
            ))}
          </nav>
        )}
      </div>
    </div>
  )
}
