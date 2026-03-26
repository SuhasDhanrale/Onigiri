import { useEffect, useState } from 'react';
import { bus } from '../../core/EventBus.js';

export function EconomyHeader({ state, activeTroops, maxTroops }) {
  const [koku, setKoku] = useState(state.koku);

  // 1. Listen to high-frequency KOKU updates via event bus
  useEffect(() => {
    const handleKokuChanged = (newKoku) => setKoku(newKoku);
    bus.on('KOKU_CHANGED', handleKokuChanged);
    return () => bus.off('KOKU_CHANGED', handleKokuChanged);
  }, []);

  // 2. Initial sync & structural re-renders
  useEffect(() => {
    setKoku(state.koku);
  }, [state.koku]);

  // But we also want to catch structural updates (when state resets)
  // We'll rely on the parent (App) passing a fresh `state.koku` prop or `uiTick` when needed,
  // but let's just use the bus for real-time visual updates.

  return (
    <div className="px-4 py-3 bg-[#1b1918] text-[#dfd4ba] sticky top-0 z-50 shadow-md border-b-4 border-[#b84235]">
      <div className="flex justify-between items-end mb-2">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold tracking-widest text-[#8b8574] uppercase">Treasury</span>
          <span className="text-3xl font-black leading-none text-[#d4af37]">
            {Math.floor(koku).toLocaleString()} <span className="text-sm">K</span>
          </span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-bold tracking-widest text-[#8b8574] uppercase">Army Size</span>
          <span className="text-xl font-black leading-none">
            {activeTroops} <span className="text-xs text-[#8b8574]">/ {maxTroops}</span>
          </span>
        </div>
      </div>
      <div className="w-full h-1.5 bg-[#dfd4ba]/20 overflow-hidden">
        <div 
          className="h-full bg-[#d4af37] transition-all duration-300" 
          style={{ width: `${maxTroops > 0 ? (activeTroops / maxTroops) * 100 : 0}%` }} 
        />
      </div>
    </div>
  );
}
