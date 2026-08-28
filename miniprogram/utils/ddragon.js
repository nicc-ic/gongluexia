function request(url) {
  return new Promise((resolve, reject) => {
    wx.request({
      url,
      success: (res) => {
        if (res.statusCode === 200) resolve(res.data)
        else reject(new Error('ddragon ' + res.statusCode))
      },
      fail: reject,
    })
  })
}

function fetchLatestVersion() {
  return request('https://ddragon.leagueoflegends.com/api/versions.json').then((list) => list[0])
}

function fetchChampions(version) {
  return request(
    `https://ddragon.leagueoflegends.com/cdn/${version}/data/zh_CN/champion.json`,
  ).then((json) => {
    return Object.keys(json.data)
      .map((id) => {
        const c = json.data[id]
        const swapped = c.title.length <= 4 && c.name.length > c.title.length
        return {
          id: c.id,
          name: swapped ? c.title : c.name,
          title: swapped ? c.name : c.title,
          tags: c.tags,
        }
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))
  })
}

function championIcon(version, id) {
  return `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${id}.png`
}

function patchFromVersion(version) {
  const p = version.split('.')
  return p[0] + '.' + p[1]
}

module.exports = {
  fetchLatestVersion,
  fetchChampions,
  championIcon,
  patchFromVersion,
}
