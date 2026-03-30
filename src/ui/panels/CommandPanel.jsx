import { EconomyHeader } from './EconomyHeader.jsx';
import { BarracksCard } from './BarracksCard.jsx';
import { TacticalCommand } from './TacticalCommand.jsx';
import { SpellShrine } from './SpellShrine.jsx';
import { BARRACKS_DEFS } from '../../config/barracks.js';

export function CommandPanel({ 
  s, activeTroops, maxTroops, meta, setMeta, setUiTick, changeQuota, 
  triggerWarDrums, triggerHarvest, triggerResolve, triggerThunder, triggerFoxFire, triggerDragonWave,
  buildBarracks, upgradeTroopLevel, upgradeBarracksCap, hireDrill, unlockHero
}) {
  return (
    <div className={`flex-[3] min-w-[340px] max-w-[400px] h-full bg-[var(--color-parchment)] flex flex-col shrink-0 overflow-y-auto custom-scrollbar relative z-40 border-l-4 border-[var(--color-ink-dark)] ${s.gameState === 'MAP_SCREEN' ? 'hidden' : ''}`}>
      
      <EconomyHeader state={s} activeTroops={activeTroops} maxTroops={maxTroops} />
      
      <div className="px-4 py-3 bg-[var(--color-parchment)] border-b-2 border-[var(--color-ink-dark)]">
        <SpellShrine 
          s={s} 
          setUiTick={setUiTick} 
          triggerThunder={triggerThunder} 
          triggerFoxFire={triggerFoxFire} 
          triggerDragonWave={triggerDragonWave}
          unlockHero={unlockHero}
        />
      </div>

      <div className="p-4 flex flex-col gap-3 bg-[var(--color-parchment)] border-b-4 border-[var(--color-ink-dark)]">
        <h3 className="text-[var(--color-ink-dark)] font-black text-[10px] uppercase tracking-[0.2em] border-b-2 border-[var(--color-ink-dark)] pb-1">Military Forces</h3>
        {Object.entries(BARRACKS_DEFS).map(([key, def]) => (
          <BarracksCard 
            key={key} 
            bKey={key} 
            def={def} 
            s={s} 
            meta={meta} 
            setUiTick={setUiTick} 
            changeQuota={changeQuota}
            buildBarracks={buildBarracks}
            upgradeTroopLevel={upgradeTroopLevel}
            upgradeBarracksCap={upgradeBarracksCap}
            hireDrill={hireDrill}
          />
        ))}
      </div>

      <div className="p-4 flex flex-col gap-4 bg-[var(--color-parchment)]">
        <TacticalCommand s={s} triggerWarDrums={triggerWarDrums} triggerHarvest={triggerHarvest} triggerResolve={triggerResolve} />
      </div>
      
    </div>
  );
}
