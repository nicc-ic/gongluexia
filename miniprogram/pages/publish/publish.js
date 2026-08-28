Page({
  data: {
    token: '',
    user: null,
    title: '',
    champQ: '',
    championId: '',
    champs: [],
    role: 'mid',
    body: '',
    public: false,
  },

  onShow() {
    const app = getApp()
    this.setData({
      user: app.globalData.user,
      champs: (app.globalData.champions || []).slice(0, 16),
    })
  },

  onToken(e) { this.setData({ token: e.detail.value }) },
  onTitle(e) { this.setData({ title: e.detail.value }) },
  onBody(e) { this.setData({ body: e.detail.value }) },
  onChampQ(e) {
    const q = e.detail.value
    const app = getApp()
    const champs = (app.globalData.champions || []).filter(
      (c) => !q || c.name.indexOf(q) !== -1,
    ).slice(0, 16)
    this.setData({ champQ: q, champs })
  },
  pickChamp(e) {
    this.setData({ championId: e.currentTarget.dataset.id })
  },
  togglePublic() {
    this.setData({ public: !this.data.public })
  },

  async connect() {
    const github = require('../../utils/github')
    try {
      const user = await github.fetchGithubUser(this.data.token.trim())
      const next = { id: 'gh_' + user.id, name: user.name || user.login }
      const app = getApp()
      app.globalData.token = this.data.token.trim()
      app.globalData.owner = user.login
      app.globalData.user = next
      wx.setStorageSync('githubToken', this.data.token.trim())
      wx.setStorageSync('githubOwner', user.login)
      wx.setStorageSync('user', next)
      const got = await github.fetchPublicStore(user.login, this.data.token.trim())
      app.globalData.guides = github.mergeGuides((got.store && got.store.guides) || [], app.globalData.guides)
      app.globalData.sha = got.sha
      this.setData({ user: next })
      wx.showToast({ title: '已连接 GitHub' })
    } catch (e) {
      wx.showToast({ title: 'Token 无效', icon: 'none' })
    }
  },

  async submit() {
    const app = getApp()
    if (!app.globalData.user) {
      wx.showToast({ title: '请先连接 GitHub', icon: 'none' })
      return
    }
    if (!this.data.title.trim() || !this.data.championId || !this.data.body.trim()) {
      wx.showToast({ title: '请填标题、英雄和正文', icon: 'none' })
      return
    }
    if (this.data.public) {
      const ok = await new Promise((resolve) => {
        wx.showModal({
          title: '公开确认',
          content: '公开后会写入 GitHub 仓库，所有人可搜索到。',
          success: (r) => resolve(r.confirm),
        })
      })
      if (!ok) return
    }
    const now = new Date().toISOString()
    const guide = {
      id: 'g_' + Date.now(),
      title: this.data.title.trim(),
      championId: this.data.championId,
      role: this.data.role,
      contentType: 'tactic',
      patch: app.globalData.patch,
      tags: [],
      body: this.data.body.trim(),
      visibility: this.data.public ? 'public' : 'private',
      status: 'published',
      sourceType: 'user',
      authorId: app.globalData.user.id,
      authorName: app.globalData.user.name,
      createdAt: now,
      updatedAt: now,
    }
    app.globalData.guides = [guide, ...app.globalData.guides]
    app.persistPrivate()
    if (guide.visibility === 'public') await app.syncPublic()
    wx.redirectTo({ url: '/pages/guide/guide?id=' + guide.id })
  },
})
