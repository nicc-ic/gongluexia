const github = require('./utils/github')
const ddragon = require('./utils/ddragon')

App({
  globalData: {
    ready: false,
    user: null,
    token: '',
    owner: '',
    sha: '',
    guides: [],
    champions: [],
    version: '16.17.1',
    patch: '16.17',
    syncError: '',
  },

  onLaunch() {
    this.boot()
  },

  async boot() {
    const token = wx.getStorageSync('githubToken') || ''
    const owner = wx.getStorageSync('githubOwner') || ''
    this.globalData.token = token
    this.globalData.owner = owner
    this.globalData.user = wx.getStorageSync('user') || null
    try {
      const v = await ddragon.fetchLatestVersion()
      this.globalData.version = v
      this.globalData.patch = ddragon.patchFromVersion(v)
      this.globalData.champions = await ddragon.fetchChampions(v)
    } catch (e) {
      this.globalData.syncError = '英雄数据加载失败'
    }
    if (owner) {
      try {
        const got = await github.fetchPublicStore(owner, token)
        this.globalData.guides = (got.store && got.store.guides) || []
        this.globalData.sha = got.sha
      } catch (e) {
        this.globalData.syncError = '暂时读不到 GitHub 公开攻略'
      }
    }
    const privateGuides = wx.getStorageSync('privateGuides') || []
    this.globalData.guides = github.mergeGuides(this.globalData.guides, privateGuides)
    this.globalData.ready = true
  },

  persistPrivate() {
    const priv = this.globalData.guides.filter(
      (g) => g.visibility === 'private' && g.status === 'published',
    )
    wx.setStorageSync('privateGuides', priv)
  },

  async syncPublic() {
    const { token, owner, guides, sha } = this.globalData
    if (!token || !owner) return
    try {
      const nextSha = await github.putPublicStore(owner, token, guides, sha)
      if (nextSha) this.globalData.sha = nextSha
      this.globalData.syncError = ''
    } catch (e) {
      this.globalData.syncError = '同步 GitHub 失败'
    }
  },
})
