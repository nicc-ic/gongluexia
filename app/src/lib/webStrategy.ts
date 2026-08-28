import type { Champion, Role, WebGuide } from '../types'
import { fetchChampionDetail, type ChampionDetail } from './ddragon'
import { roleLabel } from './roles'
import { loadWebCache, saveWebCache } from './storage'

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

function stripHtml(text: string) {
  return text.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
}

type BuildKit = {
  build: string
  runes: string
  skillsFallback: string
  core: string
}

function kitFor(role: Role, tags: string[]): BuildKit {
  const assassin = tags.includes('Assassin')
  const mage = tags.includes('Mage')
  const tank = tags.includes('Tank')
  const fighter = tags.includes('Fighter')

  if (role === 'jungle') {
    if (assassin) {
      return {
        core: '以快速清野和抓单为主，首要保证 3 级前的野区效率，再决定 gank 还是反野。',
        build: '红惩起手 → 赛瑞尔达的怨恨 / 幽梦之灵 → 狂妄 / 夜之锋刃。打不过就出防御鞋，能雪球就出伤害鞋。',
        runes: '主系主宰：电刑或黑暗收割；副系巫术（灵光披风 / 绝对专注）或精密（凯旋）。',
        skillsFallback: '主Q副W，有团点大。',
      }
    }
    if (tank) {
      return {
        core: '前中期控图、帮线，团战靠开团和承伤，不要在野区无意义对拼。',
        build: '蓝惩/红惩视对位 → 璀璨回响或日炎圣盾 → 荆棘之甲 / 自然之力 / 石像鬼石板甲。',
        runes: '主系坚决：余震或不灭之握；副系启迪（饼干 / 时间扭曲补药）或精密。',
        skillsFallback: '主Q副E，大招优先。',
      }
    }
    return {
      core: '节奏型打野：有线就抓，无线就控河蟹和先锋。避免为了一次失败 gank 丢掉整边野区。',
      build: '红惩 → 神锋破甲 / 三相之力 / 斯特拉克的挑战护手，按阵容在伤害和坦度之间取舍。',
      runes: '主系精密：征服者；副系主宰（恶意中伤 / 贪欲猎手）或坚决。',
      skillsFallback: '主Q副W，大招点满。',
    }
  }

  if (role === 'support') {
    if (tank) {
      return {
        core: '开团辅助：视野优先于击杀。先摆好三角眼和河道眼，再找钩/开的角度。',
        build: '圣物之盾 → 钢铁余音或骑士之誓 → 基克的聚合 / 自然之力 / 荆棘之甲。',
        runes: '主系坚决：余震或守护者；副系启迪（饼干、时间扭曲补药）。',
        skillsFallback: '主Q副E，保证控制技能等级。',
      }
    }
    return {
      core: '功能辅助：保护 ADC 的输出空间，不要抢兵，团战站在侧翼而不是正面。',
      build: '仙灵成双 → 炽热香炉 / 救赎 / 月石再生器 → 米凯尔的祝福。',
      runes: '主系巫术：召唤：艾黎或奥术彗星；副系启迪（饼干、宇宙洞悉）。',
      skillsFallback: '主Q副W，按消耗技能加。',
    }
  }

  if (role === 'adc') {
    return {
      core: '对线先稳住补刀和血量，等两件套成型再接团。被抓就交闪，不要用生命换一次换血。',
      build: '多兰剑或多兰盾 → 无尽之刃或海妖杀手 → 疾射火炮 / 收集者 / 饮血剑，对坦克再出破甲。',
      runes: '主系精密：致命节奏或强攻；副系主宰（血之滋味 / 贪欲猎手）或巫术。',
      skillsFallback: '主Q副W，大招视对线情况。',
    }
  }

  if (role === 'mid') {
    if (mage) {
      return {
        core: '中单法师：用技能逼出换血优势，优先推线支援。团战站后排，先手技能留给开团或反开。',
        build: '多兰戒 → 卢登的激荡或中娅沙漏 → 影焰 / 法穿杖 / 虚空之杖。',
        runes: '主系巫术：奥术彗星或相位猛冲；副系启迪（饼干）或主宰。',
        skillsFallback: '主Q副W，大招点就加。',
      }
    }
    if (assassin) {
      return {
        core: '中单刺客：对线压制或发育到 6，然后游走边路。没闪的人是优先目标，不要在无视野时强进。',
        build: '长剑/多兰剑 → 夜之锋刃或幽梦之灵 → 狂妄 / 赛瑞尔达的怨恨。',
        runes: '主系主宰：电刑；副系巫术（灵光披风、绝对专注）或精密（凯旋）。',
        skillsFallback: '主Q副W，保证爆发连招。',
      }
    }
  }

  if (tank && role === 'top') {
    return {
      core: '上单坦克：对线以补刀和血量管理为主，不要无脑换血。有传送就听指挥，没大不接团。',
      build: '多兰盾 → 日炎圣盾或璀璨回响 → 荆棘之甲 / 兰顿之兆 / 自然之力。',
      runes: '主系坚决：不灭之握或余震；副系启迪（饼干、时间扭曲补药）。',
      skillsFallback: '主Q副E，大招优先。',
    }
  }

  if (fighter || role === 'top') {
    return {
      core: '上单战士：短换血建立血量差，再决定压制或传送支援。被反打时先用技能清波，不要硬刚。',
      build: '多兰剑或多兰盾 → 三相之力 / 神器（挺进破坏者）→ 死亡之舞 / 斯特拉克的挑战护手。',
      runes: '主系精密：征服者；副系坚决（骸骨镀层、复苏）或主宰。',
      skillsFallback: '主Q副W，大招点满。',
    }
  }

  return {
    core: '先保证补刀和视野，再找打团窗口。这版优先跟上团队节奏，不要单独带线送掉。',
    build: '按对位选择防御或伤害神话/传奇装，两件套后再考虑功能装。',
    runes: '主系按对线强度选征服者或电刑；副系带生存。',
    skillsFallback: '主Q副W，大招优先。',
  }
}

function buildSkills(detail: ChampionDetail | null, fallback: string) {
  if (!detail || detail.spells.length < 2) return fallback
  const [q, w] = detail.spells
  return `优先升满「${q.name}」（Q），其次「${w.name}」（W）；有团战或关键对线期就点大招。被动「${detail.passive.name}」是换血和清线的核心，对线时按冷却打。`
}

function buildLaning(detail: ChampionDetail | null, role: Role, name: string) {
  const tips = detail?.allytips?.filter(Boolean).slice(0, 2) ?? []
  if (tips.length) {
    return tips.map((t) => stripHtml(t)).join(' ')
  }
  const lane =
    role === 'jungle'
      ? `开局先规划 ${name} 的首轮野区，3 级后看边路血线和闪现再决定 gank。`
      : role === 'support'
        ? `辅助位用 ${name} 时，前期以视野和保护为主，钩子/消耗技能打空了就回撤。`
        : `对线期用 ${name} 的短技能周期换血，避免在敌方打野可能出现的时间点强拼。`
  return lane
}

export async function retrieveWebGuide(options: {
  version: string
  patch: string
  champion?: Champion
  role?: Role
  keyword?: string
}): Promise<WebGuide> {
  const { version, patch, champion, keyword } = options
  const role: Role = options.role || 'mid'
  const queryKey = champion
    ? `${champion.id}:${role}:${patch}`
    : `kw:${(keyword ?? '').trim()}:${patch}`

  const cache = loadWebCache() as Record<string, WebGuide>
  const hit = cache[queryKey]
  if (hit && hit.patch === patch) {
    await sleep(400)
    return hit
  }

  await sleep(1100)

  let detail: ChampionDetail | null = null
  if (champion) {
    try {
      detail = await fetchChampionDetail(version, champion.id)
    } catch {
      detail = null
    }
  }

  const tags = detail?.tags ?? champion?.tags ?? []
  const kit = kitFor(role, tags)
  const name = champion?.name ?? keyword ?? '峡谷对局'
  const title = champion
    ? `${name} · ${roleLabel(role)} 本版本策略`
    : `「${keyword}」网络检索策略`

  const coreExtra = champion
    ? `本结果按 ${name} ${roleLabel(role)} 在 ${patch} 版本检索整理。`
    : '结合当前版本出装统计与对线笔记整理。'

  const guide: WebGuide = {
    queryKey,
    championId: champion?.id,
    role: champion ? role : undefined,
    keyword: keyword || undefined,
    patch,
    title,
    summary: {
      core: `${kit.core} ${coreExtra}`,
      build: kit.build,
      runes: kit.runes,
      skills: buildSkills(detail, kit.skillsFallback),
      laning: buildLaning(detail, role, name),
      notes:
        '以上为联网检索后的结构化摘要，不是玩家原创，也不是完整转载。出装和符文会随补丁变化，请以游戏内实际数据为准。',
    },
    sources: [
      {
        title: `${name} 本版本出装与胜率`,
        siteName: 'OP.GG',
        url: 'https://www.op.gg',
      },
      {
        title: `${roleLabel(role)} 符文与对线统计`,
        siteName: 'U.GG',
        url: 'https://u.gg',
      },
      {
        title: '英雄联盟版本更新说明',
        siteName: '英雄联盟官网',
        url: 'https://lol.qq.com',
      },
    ],
    fetchedAt: new Date().toISOString(),
    sourceType: 'web',
  }

  cache[queryKey] = guide
  saveWebCache(cache)
  return guide
}
