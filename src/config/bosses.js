// Single source of truth for chapter-boss COMBAT data: stats + the signature hazard
// pattern each boss runs during BOSS_PHASE. Pairs with CAMPAIGN_MAP in campaign.js,
// which owns the map-facing bossId / bossName / bossPower. The `hazard` id here is
// dispatched in CaveSystem.tickBossHazards; bespoke boss-body visuals (where they
// exist) live in renderer/drawBossVisuals.js, hazard visuals in renderer/drawSumiFx.js.
//
// Bosses must read as bosses: every radius is well above the regular ONI (55), and HP
// is a real damage check to bring down. Stats below are migrated verbatim from the
// former BOSS_DEFS in CaveSystem.js — no balance change, only consolidation.
export const BOSS_REGISTRY = {
  goki:      { name: 'Goki',      hp: 3000, damage: 32, speed: 20, radius: 80, color: '#8b7355', armor: '#1b1918', attackSpeed: 2.8, hazard: 'mud_mines',         power: 'Mud Mines' },
  kasha:     { name: 'Kasha',     hp: 2300, damage: 26, speed: 46, radius: 76, color: '#b84235', armor: '#1b1918', attackSpeed: 1.5, hazard: 'fire_trails',       power: 'Fire Trails' },
  daitengu:  { name: 'Daitengu',  hp: 2700, damage: 30, speed: 58, radius: 74, color: '#4a90e2', armor: '#1b1918', attackSpeed: 1.3, hazard: 'lightning_strikes', power: 'Lightning Strikes' },
  yukionna:  { name: 'Yuki-Onna', hp: 3000, damage: 34, speed: 32, radius: 76, color: '#a0c4ff', armor: '#1b1918', attackSpeed: 1.8, hazard: 'freeze_zones',      power: 'Deep Freeze' },
  otakemaru: { name: 'Otakemaru', hp: 3800, damage: 42, speed: 36, radius: 88, color: '#9b59b6', armor: '#1b1918', attackSpeed: 1.6, hazard: 'elemental_chaos',   power: 'Elemental Chaos' },
};

// Defensive lookup with a goki fallback — only used on the visible-boss spawn path,
// where bossId is always a valid chapter boss. The hazard dispatch deliberately does
// NOT use this (it must skip unknown bossIds rather than fall back to a hazard).
export function getBossDef(bossId) {
  return BOSS_REGISTRY[bossId] ?? BOSS_REGISTRY.goki;
}
