export const CAMPAIGN_MAP = {
  RIVERLANDS:  { id: 'RIVERLANDS',  name: 'Sakura Riverlands', threatLevel: 1, waves: 5,  reward: 'Command Drops +20%', bossId: 'goki',       bossName: 'Goki',       bossPower: 'Mud Mines' },
  OUTSKIRTS:   { id: 'OUTSKIRTS',   name: 'Kyoto Outskirts',   threatLevel: 2, waves: 6,  reward: '+1 Max Squad Cap',   bossId: 'kasha',      bossName: 'Kasha',      bossPower: 'Fire Trails' },
  TENGU_PEAKS: { id: 'TENGU_PEAKS', name: 'Tengu Peaks',       threatLevel: 3, waves: 7,  reward: 'Archers +50% DMG',   bossId: 'daitengu',   bossName: 'Daitengu',   bossPower: 'Lightning Strikes' },
  IRON_MINES:  { id: 'IRON_MINES',  name: 'Kurogane Mines',    threatLevel: 3, waves: 7,  reward: 'Hatamoto +50% HP',   bossId: 'yukionna',   bossName: 'Yuki-Onna',  bossPower: 'Deep Freeze' },
  THE_ABYSS:   { id: 'THE_ABYSS',   name: 'Yomi Abyss',        threatLevel: 5, waves: 10, reward: 'Campaign Victory',   bossId: 'otakemaru',  bossName: 'Otakemaru',  bossPower: 'Elemental Chaos' }
};

export const CAMPAIGN_CHAPTER_IDS = Object.freeze([
  'RIVERLANDS',
  'OUTSKIRTS',
  'TENGU_PEAKS',
  'IRON_MINES',
  'THE_ABYSS',
]);

export const VISIBLE_BOSS_IDS = Object.freeze(
  Object.values(CAMPAIGN_MAP).map(chapter => chapter.bossId)
);

export const CHAPTER_ENEMY_STAT_THREAT_STEP = 0.25;

export function getCampaignChapter(chapterId) {
  return CAMPAIGN_MAP[chapterId] ?? CAMPAIGN_MAP[CAMPAIGN_CHAPTER_IDS[0]];
}

export function getChapterBossId(chapterId) {
  return getCampaignChapter(chapterId).bossId ?? 'goki';
}

export function isVisibleBossId(bossId) {
  return VISIBLE_BOSS_IDS.includes(bossId);
}

export function getCampaignChapterIndex(chapterId) {
  const index = CAMPAIGN_CHAPTER_IDS.indexOf(chapterId);
  return index >= 0 ? index : 0;
}

export function getCampaignChapterNumber(chapterId) {
  return getCampaignChapterIndex(chapterId) + 1;
}

export function getCurrentCampaignChapterId(conqueredRegions = []) {
  return CAMPAIGN_CHAPTER_IDS.find(id => !conqueredRegions.includes(id)) ?? CAMPAIGN_CHAPTER_IDS[CAMPAIGN_CHAPTER_IDS.length - 1];
}

export function getCampaignChapterStatus(chapterId, conqueredRegions = []) {
  if (conqueredRegions.includes(chapterId)) return 'completed';
  return chapterId === getCurrentCampaignChapterId(conqueredRegions) ? 'current' : 'locked';
}

export function getChapterEnemyStatMultiplier(chapterId) {
  const threatLevel = getCampaignChapter(chapterId).threatLevel ?? 1;
  return 1 + ((threatLevel - 1) * CHAPTER_ENEMY_STAT_THREAT_STEP);
}

export function getCampaignChapters(conqueredRegions = []) {
  return CAMPAIGN_CHAPTER_IDS.map((id, index) => ({
    ...getCampaignChapter(id),
    chapterNumber: index + 1,
    status: getCampaignChapterStatus(id, conqueredRegions),
    enemyStatMult: getChapterEnemyStatMultiplier(id),
  }));
}

export const ENEMY_COSTS = {
  REBEL:   1,
  TENGU:   8,
  ONMYOJI: 20,
  SHINOBI: 18,
  ONI:     150
};
