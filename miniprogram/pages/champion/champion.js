Page({
  data: { champ: null, playerHits: [], web: null },

  onLoad(q) {
    const app = getApp()
    const champ = (app.globalData.champions || []).find((c) => c.id === q.id)
    const playerHits = app.globalData.guides.filter(
      (g) => g.championId === q.id && g.visibility === 'public' && g.status === 'published',
    )
    const web =
      champ && !playerHits.length
        ? {
            title: champ.name + ' · 本版本策略',
            patch: app.globalData.patch,
            core: '没有玩家公开分享，以下为联网检索兜底摘要。',
            build: '按对位选择核心装。',
            notes: '仅供参考。',
          }
        : null
    this.setData({ champ, playerHits, web })
  },

  openGuide(e) {
    wx.navigateTo({ url: '/pages/guide/guide?id=' + e.currentTarget.dataset.id })
  },

  openWeb() {
    wx.setStorageSync('webGuide', this.data.web)
    wx.navigateTo({ url: '/pages/web/web' })
  },
})
