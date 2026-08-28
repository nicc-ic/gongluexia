Page({
  data: { user: null, token: '', mine: [], githubConnected: false, syncError: '' },

  onShow() {
    const app = getApp()
    const user = app.globalData.user
    const mine = user
      ? app.globalData.guides.filter((g) => g.authorId === user.id && g.status === 'published')
      : []
    this.setData({
      user,
      githubConnected: Boolean(app.globalData.token && app.globalData.owner),
      syncError: app.globalData.syncError,
      mine,
    })
  },

  onToken(e) {
    this.setData({ token: e.detail.value })
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
      app.globalData.guides = github.mergeGuides(
        (got.store && got.store.guides) || [],
        app.globalData.guides,
      )
      app.globalData.sha = got.sha
      this.onShow()
      wx.showToast({ title: '已连接 GitHub' })
    } catch (e) {
      wx.showToast({ title: 'Token 无效', icon: 'none' })
    }
  },

  logout() {
    const app = getApp()
    app.globalData.user = null
    app.globalData.token = ''
    wx.removeStorageSync('githubToken')
    wx.removeStorageSync('user')
    this.onShow()
  },

  openGuide(e) {
    wx.navigateTo({ url: '/pages/guide/guide?id=' + e.currentTarget.dataset.id })
  },
})
