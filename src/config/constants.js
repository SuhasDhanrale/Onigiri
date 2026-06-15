// --- GAME CONSTANTS ---
export const V_WIDTH = 1200;
export const V_HEIGHT = 1600;
export const WALL_Y = 1320;
export const BATTLE_LINE_Y = 800;

export const SLOT_OFFSETS = [0, -1, 1, -2, 2, -3, 3, -4, 4];

// Defensive Arrow Tower — two fixed build slots on the flanks, lifted clear above the
// wall art (clears even the tallest Castle tier) so the build markers stay visible.
export const TOWER_COST = 50;
export const TOWER_SLOTS = [
  { x: 90,           y: WALL_Y - 200 },
  { x: V_WIDTH - 90, y: WALL_Y - 200 },
];
