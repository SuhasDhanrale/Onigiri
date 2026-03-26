import { WarCampPanel } from '../map/WarCampPanel.jsx';
import { MapArea } from '../map/MapArea.jsx';

export function MapScreen({ s, meta, setMeta, initRun, startCombat, unlockHeirloom, equipHeirloom, unlockTech, resetDynasty }) {
  if (s.gameState !== 'MAP_SCREEN') return null;

  return (
    <div className="absolute inset-0 bg-[#dfd4ba] z-[100] flex pointer-events-auto overflow-hidden">
      <WarCampPanel 
        s={s} 
        meta={meta} 
        setMeta={setMeta} 
        initRun={initRun} 
        unlockHeirloom={unlockHeirloom}
        equipHeirloom={equipHeirloom}
        unlockTech={unlockTech}
        resetDynasty={resetDynasty}
      />
      <MapArea meta={meta} startCombat={startCombat} />
    </div>
  );
}
