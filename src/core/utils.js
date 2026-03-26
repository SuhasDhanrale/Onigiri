/**
 * Generates a short random ID string.
 */
export const generateId = () => Math.random().toString(36).substr(2, 9);

/**
 * Exponential cost formula for upgrades.
 * @param {number} base   - base cost
 * @param {number} mult   - cost multiplier per level
 * @param {number} count  - current level/count
 */
export const getCost = (base, mult, count) => Math.floor(base * Math.pow(mult, count));

/**
 * Returns the maximum squad cap for a given barracks key and level,
 * accounting for heirloom and conquered region bonuses.
 *
 * @param {string} key                - barracks key e.g. 'HATAMOTO'
 * @param {number} level              - current barracks level
 * @param {string|null} equippedHeirloom
 * @param {string[]} conqueredRegions
 */
export const getSquadCap = (key, level, equippedHeirloom, conqueredRegions = []) => {
  if (level === 0) return 0;
  let cap = 0;
  if (key === 'HATAMOTO') cap = 4 + (level * 2);
  if (key === 'YUMI')     cap = 4 + (level * 2);
  if (key === 'CAVALRY')  cap = 2 + (level * 1);
  if (key === 'HOROKU')   cap = 2 + (level * 1);

  if (conqueredRegions.includes('OUTSKIRTS')) cap += 1;
  if (equippedHeirloom === 'IMPERIAL_BANNER') cap *= 2;
  return cap;
};

/**
 * Returns true if a line segment (x1,y1)→(x2,y2) intersects a circle at (cx,cy) with radius r.
 */
export const lineCircleCollide = (x1, y1, x2, y2, cx, cy, r) => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return (cx - x1) ** 2 + (cy - y1) ** 2 < r * r;
  const t = Math.max(0, Math.min(1, ((cx - x1) * dx + (cy - y1) * dy) / lenSq));
  return (cx - (x1 + t * dx)) ** 2 + (cy - (y1 + t * dy)) ** 2 < r * r;
};
