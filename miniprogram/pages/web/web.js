Page({
  data: { web: null },
  onLoad() {
    this.setData({ web: wx.getStorageSync('webGuide') || null })
  },
})
