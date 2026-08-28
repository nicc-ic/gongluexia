const ddragon = require('../../utils/ddragon')

const POPULAR = ['Yasuo', 'Ahri', 'LeeSin', 'Jinx', 'Thresh', 'Garen', 'Aatrox', 'Kaisa', 'Yone', 'Zed']

Page({
  data: {
    patch: '',
    q: '',
    popular: [],
    latest: [],
  },

  onShow() {
    const app = getApp()
    const wait = () => {
      if (!app.globalData.ready) {
        setTimeout(wait, 200)
        return
      }
      const champs = app.globalData.champions
      const popular = POPULAR.map((id) => champs.find((c) => c.id === id)).filter(Boolean)
      const latest = app.globalData.guides
        .filter((g) => g.status === 'published' && g.visibility === 'public')
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .slice(0, 6)
        .map((g) => ({
          ...g,
          champName: (champs.find((c) => c.id === g.championId) || {}).name || g.championId,
          icon: ddragon.championIcon(app.globalData.version, g.championId),
        }))
      this.setData({
        patch: app.globalData.patch,
        popular: popular.map((c) => ({
          ...c,
          icon: ddragon.championIcon(app.globalData.version, c.id),
        })),
        latest,
      })
    }
    wait()
  },

  onInput(e) {
    this.setData({ q: e.detail.value })
  },

  onSearch() {
    const q = this.data.q.trim()
    wx.switchTab({ url: '/pages/search/search' })
    if (q) {
      wx.setStorageSync('pendingQuery', q)
    }
  },

  openChamp(e) {
    wx.navigateTo({ url: '/pages/champion/champion?id=' + e.currentTarget.dataset.id })
  },

  openGuide(e) {
    wx.navigateTo({ url: '/pages/guide/guide?id=' + e.currentTarget.dataset.id })
  },
})
