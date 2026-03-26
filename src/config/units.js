export const UNIT_TYPES = {
  BARRICADE: { name: 'Bamboo Barricade', hp: 30, maxHp: 30, damage: 0, range: 0, speed: 0, color: 'transparent', type: 'friction', radius: 20, weapon: 'none', advanceZone: 850, aggroRadius: 150 },
  YUMI:      { name: 'Yumi Archer', hp: 10, maxHp: 10, damage: 6, range: 200, speed: 40, color: '#8b8574', armor: '#dfd4ba', attackSpeed: 1.5, type: 'ranged', radius: 14, weapon: 'bow', pierce: true, advanceZone: 1000, aggroRadius: 450 },
  HOROKU:    { name: 'Horoku Siege', hp: 15, maxHp: 15, damage: 60, range: 350, speed: 20, color: '#b84235', armor: '#1b1918', attackSpeed: 3.5, type: 'siege', radius: 18, weapon: 'bomb', advanceZone: 1180, aggroRadius: 500 },
  HATAMOTO:  { name: 'Hatamoto', hp: 50, maxHp: 50, damage: 12, range: 60, speed: 60, color: '#2b3d60', armor: '#1b1918', attackSpeed: 1.2, type: 'melee', radius: 18, weapon: 'katana', taunt: true, advanceZone: 700, aggroRadius: 120 },
  CAVALRY:   { name: 'Takeda Cavalry', hp: 100, maxHp: 100, damage: 12, range: 40, speed: 180, color: '#b84235', armor: '#1b1918', attackSpeed: 0.5, type: 'cavalry', radius: 26, weapon: 'spear', momentum: 100, advanceZone: 550, aggroRadius: 150 },
  CHAMPION:  { name: 'Samurai Champion', hp: 1500, maxHp: 1500, damage: 120, range: 70, speed: 90, color: '#d4af37', armor: '#1b1918', attackSpeed: 0.8, type: 'hero', radius: 24, weapon: 'nodachi', taunt: true, advanceZone: 400, aggroRadius: 200 },

  REBEL:     { name: 'Ikki Rebel', hp: 1, maxHp: 1, damage: 1, range: 25, speed: 85, color: '#8b8574', armor: null, attackSpeed: 1.0, type: 'melee', radius: 10, weapon: 'none', aggroRadius: 400 },
  TENGU:     { name: 'Tengu Flier', hp: 30, maxHp: 30, damage: 8, range: 40, speed: 55, color: '#1b1918', armor: '#b84235', attackSpeed: 1.2, type: 'flying', radius: 16, weapon: 'claws', aggroRadius: 400 },
  ONMYOJI:   { name: 'Onmyoji', hp: 40, maxHp: 40, damage: 0, range: 300, speed: 30, color: '#4a5d23', armor: '#dfd4ba', attackSpeed: 2.0, type: 'support', radius: 14, weapon: 'staff', aggroRadius: 0 },
  SHINOBI:   { name: 'Shinobi', hp: 20, maxHp: 20, damage: 18, range: 30, speed: 120, color: '#1b1918', armor: null, attackSpeed: 0.6, type: 'assassin', radius: 12, weapon: 'kunai', aggroRadius: 180 },
  ONI:       { name: 'Great Oni', hp: 1200, maxHp: 1200, damage: 40, range: 90, speed: 18, color: '#b84235', armor: '#1b1918', attackSpeed: 3.5, type: 'boss', radius: 55, weapon: 'kanabo', telegraphTimer: 0, aggroRadius: 500, isElite: true },
};
