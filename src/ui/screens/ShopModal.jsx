import React from 'react';
import { SHOP_ITEMS } from '../../config/nodes.js';

/**
 * ShopModal — overlay on HubTestScreen for shop nodes.
 * Props:
 *   inventory  — [{ id, onSale, price: [min,max] }] from generateShopInventory
 *   runState   — current run state (to read baseCommand and shopPurchases)
 *   onPurchase — (itemId, price) => void
 *   onLeave    — () => void
 */
export function ShopModal({ inventory, runState, onPurchase, onLeave }) {
  const baseCommand = runState?.baseCommand ?? 0;

  return (
    <div
      className="absolute inset-0 z-[300] flex items-center justify-center bg-black/75 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onLeave(); }}
    >
      <div className="w-[580px] bg-[#0a0908] border border-[#4a5d23]/50 shadow-[0_0_80px_rgba(0,0,0,0.95)] flex flex-col animate-[fade-in_0.2s_ease-out]">

        {/* Header */}
        <div className="border-b border-[#4a5d23]/30 px-8 py-5 flex justify-between items-center">
          <div>
            <p className="text-[9px] font-bold text-[#4a5d23] tracking-[0.4em] uppercase mb-1">
              Traveling Merchant
            </p>
            <h2 className="text-xl font-black tracking-[0.2em] uppercase text-[#dfd4ba]">
              Supply Cache
            </h2>
          </div>
          <div className="text-right">
            <p className="text-[8px] text-[#8b8574] uppercase tracking-[0.3em] mb-1">Command</p>
            <p className="text-2xl font-black text-[#d4af37]">{baseCommand}</p>
          </div>
        </div>

        {/* Items */}
        <div className="px-8 py-6 flex flex-col gap-3">
          {inventory.map((entry) => {
            const item         = SHOP_ITEMS[entry.id];
            if (!item) return null;

            const displayPrice = Math.round((entry.price[0] + entry.price[1]) / 2);
            const canAfford    = baseCommand >= displayPrice;
            const alreadyOwned = runState?.shopPurchases?.[entry.id] ?? false;

            return (
              <div
                key={entry.id}
                className={`relative p-4 border flex items-center gap-4 transition-all
                  ${alreadyOwned
                    ? 'opacity-40 border-[#8b8574]/10 bg-[#0a0908]'
                    : entry.onSale
                      ? 'border-[#d4af37]/40 bg-[#d4af37]/5'
                      : 'border-[#8b8574]/20 bg-[#141211]'
                  }`}
              >
                {entry.onSale && !alreadyOwned && (
                  <span className="absolute top-2 right-2 text-[7px] font-black text-[#d4af37] uppercase tracking-widest border border-[#d4af37]/40 px-2 py-0.5">
                    SALE
                  </span>
                )}

                <div className="flex-1 overflow-hidden">
                  <p className="text-xs font-black uppercase tracking-[0.15em] text-[#dfd4ba] mb-1 truncate">
                    {item.desc}
                  </p>
                  <p className="text-[9px] text-[#8b8574] uppercase tracking-wider font-sans">
                    {item.duration === 'run'       ? 'Lasts entire run'
                      : item.duration === 'immediate' ? 'Immediate effect'
                      : item.duration}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className={`text-base font-black ${entry.onSale ? 'text-[#d4af37]' : 'text-[#dfd4ba]'}`}>
                    {displayPrice}
                    <span className="text-[9px] text-[#8b8574] ml-1">CMD</span>
                  </span>
                  <button
                    disabled={!canAfford || alreadyOwned}
                    onClick={() => onPurchase(entry.id, displayPrice)}
                    className={`px-4 py-1 text-[9px] font-black uppercase tracking-widest border transition-all
                      ${alreadyOwned
                        ? 'border-[#8b8574]/20 text-[#8b8574] cursor-not-allowed'
                        : !canAfford
                          ? 'border-[#8b8574]/20 text-[#8b8574]/40 cursor-not-allowed'
                          : 'border-[#b84235] text-[#dfd4ba] hover:bg-[#b84235]/20 cursor-pointer'
                      }`}
                  >
                    {alreadyOwned ? 'Owned' : 'Buy'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Leave */}
        <div className="px-8 pb-6">
          <button
            onClick={onLeave}
            className="w-full py-3 border border-[#8b8574]/30 text-xs font-black uppercase tracking-[0.3em] text-[#8b8574] hover:text-[#dfd4ba] hover:border-[#8b8574] transition-all"
          >
            Leave
          </button>
        </div>

      </div>
    </div>
  );
}
