import type { Champion, Role } from '../types'

export const ROLES: { id: Role; label: string }[] = [
  { id: 'top', label: '上单' },
  { id: 'jungle', label: '打野' },
  { id: 'mid', label: '中单' },
  { id: 'adc', label: '下路' },
  { id: 'support', label: '辅助' },
]

export function roleLabel(role: Role) {
  return ROLES.find((r) => r.id === role)?.label ?? role
}

const JUNGLE_IDS = new Set([
  'Amumu', 'Belveth', 'Briar', 'Diana', 'Ekko', 'Elise', 'Evelynn',
  'Fiddlesticks', 'Gragas', 'Graves', 'Gwen', 'Hecarim', 'Ivern',
  'JarvanIV', 'Karthus', 'Kayn', 'Khazix', 'Kindred', 'LeeSin',
  'Lillia', 'MasterYi', 'Maokai', 'MonkeyKing', 'Nidalee', 'Nocturne',
  'Nunu', 'Poppy', 'Rammus', 'RekSai', 'Rengar', 'Sejuani', 'Shaco',
  'Shyvana', 'Skarner', 'Taliyah', 'Trundle', 'Udyr', 'Vi', 'Viego',
  'Volibear', 'Warwick', 'XinZhao', 'Zac', 'Zyra', 'JarvanIV', 'Wukong',
])

export function inferRoles(champion: Champion): Role[] {
  const roles: Role[] = []
  if (JUNGLE_IDS.has(champion.id)) roles.push('jungle')
  if (champion.tags.includes('Marksman')) roles.push('adc')
  if (champion.tags.includes('Support')) roles.push('support')
  if (champion.tags.includes('Mage') || champion.tags.includes('Assassin')) {
    roles.push('mid')
  }
  if (champion.tags.includes('Tank') || champion.tags.includes('Fighter')) {
    roles.push('top')
  }
  if (roles.length === 0) roles.push('mid')
  return [...new Set(roles)]
}

export const POPULAR_IDS = [
  'Yasuo', 'Ahri', 'LeeSin', 'Jinx', 'Thresh', 'Garen', 'Aatrox',
  'Kaisa', 'Yone', 'Zed', 'Lux', 'Jhin', 'MissFortune', 'Sett',
  'Vayne', 'Akali', 'Ezreal', 'Leona', 'Caitlyn', 'Sylas',
]

export const TAG_LABEL: Record<string, string> = {
  Fighter: '战士',
  Tank: '坦克',
  Mage: '法师',
  Assassin: '刺客',
  Support: '辅助',
  Marksman: '射手',
}
