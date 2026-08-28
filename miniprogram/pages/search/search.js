const ddragon = require('../../utils/ddragon')

const ROLES = [
  { id: '', label: '全部分路' },
  { id: 'top', label: '上单' },
  { id: 'jungle', label: '打野' },
  { id: 'mid', label: '中单' },
  { id: 'adc', label: '下路' },
  { id: 'support', label: '辅助' },
]

Page({
  data: {
    q: '',
    role: '',
    roles: ROLES,
    playerHits: [],
    web: null,
    loadingWeb: false,
  },

  onShow() {
    const pending = wx.getStorageSync('pendingQuery')
    if (pending) {
      wx.removeStorageSync('pendingQuery')
      this.setData({ q: pending })
    }
    this.refresh()
  },

  onInput(e) {
    this.setData({ q: e.detail.value })
    this.refresh()
  },

  setRole(e) {
    this.setData({ role: e.currentTarget.dataset.id })
    this.refresh()
  },

  refresh() {
    const app = getApp()
    const q = this.data.q.trim()
    const role = this.data.role
    const champs = app.globalData.champions || []
    const resolved = champs.find((c) => c.name === q || (q && c.name.indexOf(q) !== -1))
    const hits = app.globalData.guides.filter((g) => {
      if (g.status !== 'published' || g.visibility !== 'public') return false
      if (resolved && g.championId !== resolved.id) return false
      if (role && g.role !== role) return false
      if (!q) return true
      if (resolved) return true
      return (g.title + g.body + (g.tags || []).join(' ')).indexOf(q) !== -1
    })
    const playerHits = hits.map((g) => ({
      ...g,
      champName: (champs.find((c) => c.id === g.championId) || {}).name || g.championId,
      icon: ddragon.championIcon(app.globalData.version, g.championId),
    }))
    this.setData({ playerHits })
    if (q && playerHits.length === 0) this.loadWeb(resolved)
    else this.setData({ web: null, loadingWeb: false })
  },

  loadWeb(champ) {
    const app = getApp()
    const name = champ ? champ.name : this.data.q
    this.setData({ loadingWeb: true })
    const web = {
      title: name + ' · 本版本策略',
      patch: app.globalData.patch,
      core: '先保证补刀和视野，再找打团窗口。没有玩家公开分享时，系统用联网检索思路做兜底摘要。',
      build: '按对位选择防御或伤害核心装，两件套后再考虑功能装。',
      runes: '主系按对线强度选征服者或电刑；副系带生存。',
      notes: '内容由检索整理，仅供参考，版权归原作者。',
    }
    setTimeout(() => this.setData({ web, loadingWeb: false }), 600)
  },

  openGuide(e) {
    wx.navigateTo({ url: '/pages/guide/guide?id=' + e.currentTarget.dataset.id })
  },

  openWeb() {
    wx.setStorageSync('webGuide', this.data.web)
    wx.navigateTo({ url: '/pages/web/web' })
  },
})
