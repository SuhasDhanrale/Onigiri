import { UNIT_TYPES } from '../../config/units.js';
import { getCost, getSquadCap } from '../../core/utils.js';

export function BarracksCard({ bKey, def, s, meta, setUiTick, changeQuota, buildBarracks, upgradeTroopLevel, upgradeBarracksCap, hireDrill }) {
  const isImperial = meta.equippedHeirloom === 'IMPERIAL_BANNER';
  const bannerMult = isImperial ? 1.5 : 1.0;

  const level = s.barracks[bKey] || 0;
  const isAuto = s.autoUnlocked[bKey];
  const cap = getSquadCap(bKey, level, meta.equippedHeirloom, meta.conqueredRegions);
  const currentCount = s.units.filter(u => u.name === UNIT_TYPES[def.unit].name && u.team === 'player' && u.hp > 0).length;
  
  const maxTime = def.spawnRate * bannerMult;
  const pct = level > 0 ? Math.max(0, Math.min(1, 1 - (s.timers[bKey] / maxTime))) : 0;
  
  const baseCost = Math.floor(def.baseCost * bannerMult);
  const autoCost = Math.floor(def.autoCost * bannerMult);
  const costCap = Math.floor(getCost(def.baseCost, def.costMult, level) * bannerMult);
  const costLvl = Math.floor(getCost(def.baseCost * 1.5, 1.7, s.troopLevel[bKey] - 1) * bannerMult);
  const isFocused = s.focusedBuilding === bKey;

  return (
    <div 
      onClick={() => { s.focusedBuilding = isFocused ? null : bKey; setUiTick(t => t + 1); }}
      className={`bg-[var(--color-ink)] border-2 flex flex-col text-[var(--color-parchment)] transition-all cursor-pointer overflow-hidden ${isFocused ? 'border-[#d4af37] shadow-[0_0_15px_rgba(212,175,55,0.25)]' : 'border-[var(--color-ink-dark)] hover:border-[#8b8574]'}`}
    >
      <div className="flex items-center h-14 px-2 relative">
        {isFocused && <div className="absolute inset-0 bg-[#d4af37]/10 animate-pulse pointer-events-none" />}
        
        <div className="w-16 flex flex-col items-center justify-center shrink-0 relative z-10 border-r-2 border-[var(--color-ink-dark)] h-full bg-[#2b3d60] mr-2">
          <span className="text-[10px] font-black tracking-widest leading-none text-center px-1">{def.name}</span>
          {level > 0 && <div className="absolute -top-1 -left-1 bg-[#b84235] text-white text-[8px] font-bold px-1 py-0.5 border border-[var(--color-ink)]">Lv.{s.troopLevel[bKey]}</div>}
        </div>

        <div className="flex-1 flex flex-col justify-center relative z-10 pr-1">
          {level === 0 ? (
            <div className="text-[10px] font-bold text-[var(--color-khaki)] text-center tracking-widest">TAP TO BUILD</div>
          ) : (
            <>
              <div className="flex justify-between text-[8px] font-bold tracking-widest text-[var(--color-khaki)] mb-1">
                <span>{isAuto ? 'AUTO' : 'MANUAL'}</span>
                <span className={currentCount >= cap ? 'text-[#b84235]' : (isFocused ? 'text-[#d4af37]' : '')}>{currentCount}/{cap}</span>
              </div>
              <div className="w-full h-2 bg-[var(--color-parchment)]/20 relative border border-[var(--color-ink)]">
                <div className={`h-full transition-all ${currentCount >= cap ? 'bg-[#b84235]' : (isFocused ? 'bg-[#d4af37]' : 'bg-[#4a5d23]')}`} style={{ width: `${currentCount >= cap ? 100 : pct * 100}%` }} />
              </div>
            </>
          )}
        </div>
      </div>

      {isFocused && (
        <div className="flex flex-col border-t-2 border-[var(--color-ink)] bg-[var(--color-parchment)] text-[var(--color-ink)] p-1.5 gap-1.5">
          {level === 0 ? (
            <button onClick={(e) => { e.stopPropagation(); buildBarracks(bKey, baseCost, maxTime); }} className={`w-full py-2 text-[10px] font-black transition-colors border-2 border-[var(--color-ink)] ${s.koku >= baseCost && s.gameState === 'COMBAT' ? 'bg-[var(--color-ink)] text-[#d4af37] hover:bg-[#2b3d60]' : 'bg-[#cfc4af] text-[var(--color-khaki)] cursor-not-allowed'}`}>BUILD ({baseCost} K)</button>
          ) : (
            <>
              {!isAuto && (
                <button onClick={(e) => { e.stopPropagation(); hireDrill(bKey, autoCost); }} className={`w-full py-1.5 text-[10px] font-black transition-colors border-2 border-[var(--color-ink)] ${s.koku >= autoCost && s.gameState === 'COMBAT' ? 'bg-[var(--color-ink)] text-[#d4af37] hover:bg-[#2b3d60]' : 'bg-[#cfc4af] text-[var(--color-khaki)] cursor-not-allowed'}`}>HIRE DRILL ({autoCost} K)</button>
              )}
              <div className="flex gap-1.5">
                <button onClick={(e) => { e.stopPropagation(); upgradeTroopLevel(bKey, costLvl); }} className={`flex-1 py-1.5 flex items-center justify-center transition-colors border-2 border-[var(--color-ink)] ${s.koku >= costLvl && s.gameState === 'COMBAT' ? 'bg-[var(--color-ink)] text-[var(--color-parchment)] hover:bg-[#d4af37] hover:text-[var(--color-ink)]' : 'bg-[#cfc4af] text-[var(--color-khaki)] cursor-not-allowed'}`}>
                  <span className="text-[8px] font-black tracking-tighter leading-tight text-center">UPG DMG<br/>{costLvl} K</span>
                </button>
                <button onClick={(e) => { e.stopPropagation(); upgradeBarracksCap(bKey, costCap); }} className={`flex-1 py-1.5 flex items-center justify-center transition-colors border-2 border-[var(--color-ink)] ${s.koku >= costCap && s.gameState === 'COMBAT' ? 'bg-[var(--color-ink)] text-[var(--color-parchment)] hover:bg-[#d4af37] hover:text-[var(--color-ink)]' : 'bg-[#cfc4af] text-[var(--color-khaki)] cursor-not-allowed'}`}>
                  <span className="text-[8px] font-black tracking-tighter leading-tight text-center">+1 CAP<br/>{costCap} K</span>
                </button>
              </div>
              
              <div className="flex justify-between items-center mt-1 border-t-2 border-[var(--color-ink)] pt-1.5 px-1">
                <span className="text-[9px] font-black tracking-widest text-[var(--color-khaki)]">GUARD QUOTA</span>
                <div className="flex items-center gap-2 bg-[var(--color-ink)] px-2 py-0.5 border border-[#4a5d23]">
                  <button onClick={(e) => { e.stopPropagation(); changeQuota(bKey, -1); }} className="hover:text-[#d4af37] text-lg leading-none cursor-pointer text-[var(--color-parchment)] px-1 font-bold">-</button>
                  <span className="text-[var(--color-parchment)] min-w-[2ch] text-center font-mono text-[10px] font-bold">{s.guardQuotas[bKey] || 0}</span>
                  <button onClick={(e) => { e.stopPropagation(); changeQuota(bKey, 1); }} className="hover:text-[#d4af37] text-lg leading-none cursor-pointer text-[var(--color-parchment)] px-1 font-bold">+</button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
