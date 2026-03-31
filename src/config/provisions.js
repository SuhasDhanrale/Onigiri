export const PROVISIONS = {
  DEMON_MASK:      { id: 'DEMON_MASK',      type: 'item',          name: 'Demon Mask',             cost: 150, desc: '+25% damage, -10% max HP', icon: '👹' },
  IMPERIAL_BANNER: { id: 'IMPERIAL_BANNER', type: 'item',          name: 'Imperial Banner',        cost: 200, desc: '+20% unit attack speed',   icon: '🎌' },
  BLOOD_KATANA:    { id: 'BLOOD_KATANA',    type: 'item',          name: 'Blood Katana',           cost: 175, desc: '+15% crit chance',          icon: '🗡️' },
  SPIKED_CALTROPS: { id: 'SPIKED_CALTROPS', type: 'item',          name: 'Spiked Caltrops',        cost: 125, desc: 'Enemies take damage when attacking barricades', icon: '⚙️' },
  COMMANDERS_SEAL: { id: 'COMMANDERS_SEAL', type: 'starting_bonus', name: "Commander's Seal",      cost: 100, desc: '+15 Starting Command per run', icon: '📜' },
  WAR_CHEST:       { id: 'WAR_CHEST',       type: 'starting_bonus', name: 'War Chest',             cost: 150, desc: '+25 Starting Command per run', icon: '🪙' },
  SHOGUNS_DECREE:  { id: 'SHOGUNS_DECREE',  type: 'starting_bonus', name: "Shogun's Decree",       cost: 250, desc: '+40 Starting Command per run', icon: '👑' },
  REINFORCED_FOUNDATIONS: { id: 'REINFORCED_FOUNDATIONS', type: 'tower_upgrade', name: 'Reinforced Foundations', cost: 175, desc: 'Starting towers have +20% HP',    icon: '🏯' },
  VETERAN_ENGINEERS:      { id: 'VETERAN_ENGINEERS',      type: 'tower_upgrade', name: 'Veteran Engineers',      cost: 200, desc: 'Starting towers deal +10% damage', icon: '⚒️' },
  FORTIFIED_POSITIONS:    { id: 'FORTIFIED_POSITIONS',    type: 'tower_upgrade', name: 'Fortified Positions',    cost: 225, desc: 'Starting towers have +15% range',  icon: '🏹' },
  TAKEDA_CHARGE:   { id: 'TAKEDA_CHARGE',   type: 'technique', name: 'Takeda Charge',   cost: 120, desc: 'Cavalry spawn with a 2s massive speed & knockback boost', icon: '🐎' },
  FLAMING_ARROWS:  { id: 'FLAMING_ARROWS',  type: 'technique', name: 'Flaming Arrows',  cost: 100, desc: 'Archers have 25% chance to ignite enemies',               icon: '🏹' },
};

export const PERMANENT_TECHS = {
  SPIKED_CALTROPS: PROVISIONS.SPIKED_CALTROPS,
  FLAMING_ARROWS:  PROVISIONS.FLAMING_ARROWS,
  TAKEDA_CHARGE:   PROVISIONS.TAKEDA_CHARGE,
};
export const HEIRLOOMS = {
  DEMON_MASK:      PROVISIONS.DEMON_MASK,
  IMPERIAL_BANNER: PROVISIONS.IMPERIAL_BANNER,
  BLOOD_KATANA:    PROVISIONS.BLOOD_KATANA,
};
