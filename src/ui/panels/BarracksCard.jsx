import { UNIT_TYPES } from '../../config/units.js';
import { getBarracksUnlockChapter } from '../../config/campaign.js';
import { getCost, getSquadCap } from '../../core/utils.js';

export function BarracksCard({ bKey, def, s, meta, setUiTick, changeQuota, buildBarracks, upgradeTroopLevel, upgradeBarracksCap, hireDrill }) {
  const isImperial = meta.equippedItem === 'IMPERIAL_BANNER';
  const bannerMult = isImperial ? 1.5 : 1.0;

  const level = s.barracks[bKey] || 0;
  const cap = getSquadCap(bKey, level, meta.equippedItem, meta.conqueredRegions, meta.activeSquadCapBonus ?? 0);
  const currentCount = s.units.filter(u => u.name === UNIT_TYPES[def.unit].name && u.team === 'player' && u.hp > 0).length;

  const costCap = Math.floor(getCost(def.baseCost, def.costMult, level) * bannerMult);
  const costLvl = Math.floor(getCost(def.baseCost * 1.5, 1.7, s.troopLevel[bKey] - 1) * bannerMult);
  const isFocused = s.focusedBuilding === bKey;
  const isAtCap = currentCount >= cap;
  const canUpgradeDamage = s.command >= costLvl && s.gameState === 'COMBAT';
  const canUpgradeCap = s.command >= costCap && s.gameState === 'COMBAT';

  const isPermanentlyUnlocked = meta.unlockedBarracks?.includes(bKey);
  const isRunUnlocked = !isPermanentlyUnlocked && !!s.autoUnlocked[bKey];
  const isUnlocked = isPermanentlyUnlocked || isRunUnlocked;
  const unlockChapter = getBarracksUnlockChapter(bKey);
  const lockedText = unlockChapter ? `Clear ${unlockChapter.name}` : 'Progress campaign';

  return (
    <div
      onClick={() => {
        if (isUnlocked) {
          s.focusedBuilding = isFocused ? null : bKey;
          setUiTick(t => t + 1);
        }
      }}
      className={`relative grid min-h-[78px] grid-cols-[88px_58px_minmax(0,1fr)] overflow-hidden border-2 bg-[var(--color-ink)] text-[var(--color-parchment)] transition-all ${isUnlocked ? 'cursor-pointer hover:border-[#8b8574]' : 'opacity-60 grayscale'} ${isFocused ? 'border-[#d4af37] shadow-[0_0_15px_rgba(212,175,55,0.25)]' : 'border-[var(--color-ink-dark)]'}`}
    >
      {isFocused && <div className="pointer-events-none absolute inset-0 bg-[#d4af37]/10" />}

      <div className="relative z-10 flex min-h-[78px] flex-col items-center justify-center border-r-2 border-[var(--color-ink-dark)] bg-[#2b3d60] px-1">
        <span className="text-center text-[11px] font-black leading-none tracking-wide">{def.name}</span>
        {level > 0 && <div className="absolute left-1 top-1 bg-[#b84235] px-1 py-0.5 text-[8px] font-bold leading-none text-white">Lv.{s.troopLevel[bKey]}</div>}
      </div>

      <div className="relative z-10 flex min-w-0 flex-col items-center justify-center border-r-2 border-[var(--color-ink-dark)] px-1 py-2">
        {!isUnlocked ? (
          <div className="text-center text-[9px] font-bold leading-tight tracking-wide text-[#8b8574]">
            LOCKED
          </div>
        ) : (
          <>
            <div className={`text-[15px] font-black leading-none ${isAtCap ? 'text-[#b84235]' : (isFocused ? 'text-[#d4af37]' : 'text-[var(--color-parchment)]')}`}>{currentCount}/{cap}</div>
            <div className="mt-1 text-[8px] font-black uppercase tracking-wide text-[var(--color-khaki)]">Units</div>
          </>
        )}
      </div>

      <div className="relative z-10 flex min-h-[78px] items-center p-1.5">
        {isUnlocked ? (
          <div className="grid w-full grid-cols-2 gap-1.5">
            <button
              onClick={(e) => { e.stopPropagation(); upgradeTroopLevel(bKey, costLvl); }}
              className={`flex h-12 items-center justify-center border-2 border-[var(--color-ink)] text-center transition-colors ${canUpgradeDamage ? 'bg-[var(--color-parchment)] text-[var(--color-ink)] hover:bg-[#d4af37]' : 'bg-[#cfc4af] text-[var(--color-khaki)] cursor-not-allowed'}`}
            >
              <span className="text-[9px] font-black leading-tight tracking-normal">DMG<br/>{costLvl}K</span>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); upgradeBarracksCap(bKey, costCap); }}
              className={`flex h-12 items-center justify-center border-2 border-[var(--color-ink)] text-center transition-colors ${canUpgradeCap ? 'bg-[var(--color-parchment)] text-[var(--color-ink)] hover:bg-[#d4af37]' : 'bg-[#cfc4af] text-[var(--color-khaki)] cursor-not-allowed'}`}
            >
              <span className="text-[9px] font-black leading-tight tracking-normal">CAP<br/>{costCap}K</span>
            </button>
          </div>
        ) : (
          <div className="w-full text-center text-[9px] font-black uppercase leading-tight tracking-wide text-[#8b8574]">
            {lockedText}
          </div>
        )}
      </div>
    </div>
  );
}
