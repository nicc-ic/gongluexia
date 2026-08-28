const ddragon = require('../../utils/ddragon')

Page({
  data: { guide: null, icon: '', isOwner: false },
  onLoad(q) {
    const app = getApp()
    const guide = app.globalData.guides.find((g) => g.id === q.id && g.status === 'published')
    if (!guide) return
    const isOwner = app.globalData.user && app.globalData.user.id === guide.authorId
    if (guide.visibility === 'private' && !isOwner) {
      this.setData({ guide: null })
      return
    }
    this.setData({
      guide,
      isOwner,
      icon: ddragon.championIcon(app.globalData.version, guide.championId),
    })
  },
  async toggle() {
    const app = getApp()
    const g = this.data.guide
    if (!g) return
    if (g.visibility === 'private') {
      const ok = await new Promise((resolve) => {
        wx.showModal({
          title: '公开确认',
          content: '公开后会写入 GitHub，所有人可搜索到。',
          success: (r) => resolve(r.confirm),
        })
      })
      if (!ok) return
    }
    g.visibility = g.visibility === 'public' ? 'private' : 'public'
    g.updatedAt = new Date().toISOString()
    app.persistPrivate()
    await app.syncPublic()
    this.setData({ guide: g })
  },
})
