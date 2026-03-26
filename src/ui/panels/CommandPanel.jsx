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
    <div className={`flex-[3] min-w-[340px] max-w-[400px] h-full bg-[#dfd4ba] flex flex-col shrink-0 overflow-y-auto custom-scrollbar relative z-40 border-l-4 border-[#1b1918] ${s.gameState === 'MAP_SCREEN' ? 'hidden' : ''}`}>
      
      <EconomyHeader state={s} activeTroops={activeTroops} maxTroops={maxTroops} />
      
      <div className="p-4 flex flex-col gap-3 bg-[#dfd4ba] border-b-4 border-[#1b1918]">
        <h3 className="text-[#1b1918] font-black text-[10px] uppercase tracking-[0.2em] border-b-2 border-[#1b1918] pb-1">Military Forces</h3>
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

      <div className="p-4 flex flex-col gap-4 bg-[#dfd4ba]">
        <TacticalCommand s={s} triggerWarDrums={triggerWarDrums} triggerHarvest={triggerHarvest} triggerResolve={triggerResolve} />
        <SpellShrine 
          s={s} 
          setUiTick={setUiTick} 
          triggerThunder={triggerThunder} 
          triggerFoxFire={triggerFoxFire} 
          triggerDragonWave={triggerDragonWave}
          unlockHero={unlockHero}
        />
      </div>
      
    </div>
  );
}
