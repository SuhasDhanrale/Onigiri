import { BARRACKS_LAYOUT, BARRACKS_DEFS } from '../config/barracks.js';
import { UNIT_TYPES } from '../config/units.js';
import { getSquadCap, lineCircleCollide } from '../core/utils.js';
import { WALL_Y, V_WIDTH, V_HEIGHT } from '../config/constants.js';
import { addParticle } from '../systems/SpawnSystem.js';
import { COLORS } from '../config/colors.js';

export const getCanvasPos = (e, canvas, s) => {
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const physX = (e.clientX - rect.left);
    const physY = (e.clientY - rect.top);
    const scale = (s && s.canvasScale) ? s.canvasScale : 1;
    const offsetX = (s && s.canvasOffsetX) ? s.canvasOffsetX : 0;
    const offsetY = (s && s.canvasOffsetY) ? s.canvasOffsetY : 0;
    return {
        x: (physX - offsetX) / scale,
        y: (physY - offsetY) / scale
    };
};

export const createInputHandlers = (state, fgCanvasRef, setUiTick, metaRef, spawnUnit, armedSpellRef, setArmedSpell) => {

    const handlePointerDown = (e) => {
        const s = state.current;
        if (s.gameState !== 'COMBAT') return;
        const { x, y } = getCanvasPos(e, fgCanvasRef.current, s);
        if (s.feverActive > 0) { s.isSlashing = true; s.lastSlashPos = { x, y }; return; }
        
        let clickedBuilding = null;
        Object.entries(BARRACKS_LAYOUT).forEach(([key, layout]) => {
          if (Math.abs(x - layout.x) < layout.w / 1.8 && y > layout.y - layout.h && y < layout.y + 100) clickedBuilding = key;
        });

        const isImperial = metaRef.current.equippedItem === 'IMPERIAL_BANNER';
        const bannerMult = isImperial ? 1.5 : 1.0;

        if (clickedBuilding) {
           const level = s.barracks[clickedBuilding];
           if (level > 0) {
               const def = BARRACKS_DEFS[clickedBuilding];
                const cap = getSquadCap(clickedBuilding, level, metaRef.current.equippedItem, metaRef.current.conqueredRegions);
               const currentCount = s.units.filter(u => u.name === UNIT_TYPES[def.unit].name && u.team === 'player' && u.hp > 0).length;
               
               if (currentCount < cap) {
                   const maxTime = def.spawnRate * bannerMult;
                   
                   s.timers[clickedBuilding] -= (maxTime * 0.20);
                   s.visuals[clickedBuilding] = 0.6; 
                   addParticle(state.current, BARRACKS_LAYOUT[clickedBuilding].x, BARRACKS_LAYOUT[clickedBuilding].y - 50, '#facc15', 15, 300);
                   s.floatingTexts.push({ x: BARRACKS_LAYOUT[clickedBuilding].x, y: BARRACKS_LAYOUT[clickedBuilding].y - 80, text: '+20%', color: '#facc15', life: 0.8, vy: -50 });
               } else {
                   s.visuals[clickedBuilding] = 0.2; 
                   s.floatingTexts.push({ x: BARRACKS_LAYOUT[clickedBuilding].x, y: BARRACKS_LAYOUT[clickedBuilding].y - 80, text: 'FULL', color: '#b84235', life: 0.6, vy: -30 });
               }
           } else {
               s.floatingTexts.push({ x: BARRACKS_LAYOUT[clickedBuilding].x, y: BARRACKS_LAYOUT[clickedBuilding].y - 80, text: 'UNLOCK IN COMMAND', color: COLORS.ink, life: 1.0, vy: -20 });
           }
        } else {
            // The Snap (Attention Break)
            if (s.focusedBuilding !== null) {
                s.focusedBuilding = null;
                s.floatingTexts.push({ x, y, text: '[ FOCUS BROKEN ]', color: '#b84235', life: 1.5, vy: -30 });
                setUiTick(t => t + 1);
            }

            // One-Click Canvas Execution
            const armedSpell = armedSpellRef.current;
            if (armedSpell === 'BARRICADE') {
                if (y < WALL_Y + 150 && y > 100 && s.conscriptCooldown <= 0) {
                    spawnUnit('BARRICADE', 'player', x, y);
                    addParticle(state.current, x, y, COLORS.khaki, 8); 
                    s.conscriptCooldown = 0.5;
                }
            } 
            
            // Revert to Barricade after any spell/trap is deployed
            setArmedSpell('BARRICADE');
        }
    };

    const handlePointerMove = (e) => {
        const s = state.current;
        if (!s.isSlashing || s.feverActive <= 0 || s.gameState !== 'COMBAT') return;
        const { x, y } = getCanvasPos(e, fgCanvasRef.current, s);
        const prev = s.lastSlashPos;
        if (!prev) return;
        if ((x - prev.x)**2 + (y - prev.y)**2 > 600) { 
          s.slashTrails.push({ x1: prev.x, y1: prev.y, x2: x, y2: y, life: 1.0 });
          let hitAny = false;
          s.units.filter(u => u.team === 'enemy').forEach(u => {
            if (lineCircleCollide(prev.x, prev.y, x, y, u.x, u.y, u.radius + 40)) {
              u.hp -= 500; hitAny = true;
              u.burn = 6.0; 
            }
          });
          if (hitAny) s.screenShake = 0.3; 
          s.lastSlashPos = { x, y };
        }
    };

    const handlePointerUp = () => { 
        state.current.isSlashing = false; 
        state.current.lastSlashPos = null; 
    };

    return { handlePointerDown, handlePointerMove, handlePointerUp };
};
