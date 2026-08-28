const REPO = 'gongluexia'
const FILE = 'data/public-guides.json'

function headers(token) {
  const h = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }
  if (token) h.Authorization = 'Bearer ' + token
  return h
}

function request(options) {
  return new Promise((resolve, reject) => {
    wx.request({
      ...options,
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) resolve(res.data)
        else reject(new Error('HTTP ' + res.statusCode))
      },
      fail: reject,
    })
  })
}

function fromBase64(b64) {
  const bin = wx.base64ToArrayBuffer(b64.replace(/\n/g, ''))
  const bytes = new Uint8Array(bin)
  let out = ''
  for (let i = 0; i < bytes.length; i++) out += String.fromCharCode(bytes[i])
  try {
    return decodeURIComponent(escape(out))
  } catch (e) {
    return out
  }
}

function toBase64(text) {
  const utf8 = unescape(encodeURIComponent(text))
  const buf = new ArrayBuffer(utf8.length)
  const view = new Uint8Array(buf)
  for (let i = 0; i < utf8.length; i++) view[i] = utf8.charCodeAt(i)
  return wx.arrayBufferToBase64(buf)
}

function fetchGithubUser(token) {
  return request({
    url: 'https://api.github.com/user',
    header: headers(token),
  })
}

function fetchPublicStore(owner, token) {
  if (!owner) return Promise.resolve({ store: null, sha: '' })
  return request({
    url: `https://api.github.com/repos/${owner}/${REPO}/contents/${FILE}`,
    header: headers(token),
  })
    .then((json) => ({
      store: JSON.parse(fromBase64(json.content)),
      sha: json.sha,
    }))
    .catch((err) => {
      if (String(err.message).indexOf('404') !== -1) return { store: null, sha: '' }
      throw err
    })
}

function putPublicStore(owner, token, guides, sha) {
  const publicGuides = guides.filter((g) => g.visibility === 'public' && g.status === 'published')
  const body = {
    updatedAt: new Date().toISOString(),
    guides: publicGuides,
  }
  return request({
    url: `https://api.github.com/repos/${owner}/${REPO}/contents/${FILE}`,
    method: 'PUT',
    header: Object.assign({ 'Content-Type': 'application/json' }, headers(token)),
    data: {
      message: 'sync public guides (' + publicGuides.length + ')',
      content: toBase64(JSON.stringify(body, null, 2) + '\n'),
      sha: sha || undefined,
    },
  }).then((json) => json.content && json.content.sha)
}

function mergeGuides(remote, local) {
  const map = {}
  ;(remote || []).forEach((g) => {
    map[g.id] = g
  })
  ;(local || []).forEach((g) => {
    if (g.visibility === 'private' || g.status === 'removed') map[g.id] = g
    else if (!map[g.id]) map[g.id] = g
  })
  return Object.keys(map).map((k) => map[k])
}

module.exports = {
  REPO,
  FILE,
  fetchGithubUser,
  fetchPublicStore,
  putPublicStore,
  mergeGuides,
}
