import React, { useEffect, useState, useRef, useMemo } from 'react';
import { applyNodeCompletion } from '../../systems/MapGenerator.js';
import { getEvent, applyEventChoice, tickCurses } from '../../systems/EventSystem.js';
import { generateShopInventory, purchaseItem } from '../../systems/ShopSystem.js';
import { getRestOptions, getRestBlessingChoices, applyRestChoice } from '../../systems/RestSystem.js';
import { PROVISIONS, PERMANENT_TECHS, HEIRLOOMS } from '../../config/provisions.js';
import { SHOP_ITEMS } from '../../config/nodes.js';
import { formatNodeRewardLines } from '../../systems/NodeRewardSystem.js';
import { CURSES } from '../../config/curses.js';
import { BARRACKS_DEFS } from '../../config/barracks.js';
import { UNIT_TYPES } from '../../config/units.js';
import { getPlayableWaveCount } from '../../config/waves.js';
import { EventModal } from './EventModal.jsx';
import { ShopModal } from './ShopModal.jsx';
import { RestModal } from './RestModal.jsx';
import { SumiResultScreen } from './SumiResultScreen.jsx';

export function HubTestScreen({
  meta,
  setMeta,
  runState,
  setRunState,
  startRun,
  onPlayNode,
  mapNodes,
  setMapNodes,
  unlockProvision,
  equipProvision,
  tutorial,
}) {
  const [activeSidebarTab, setActiveSidebarTab] = useState('DOJO');
  const [hoveredTech, setHoveredTech] = useState(null);
  const [hoveredMapNode, setHoveredMapNode] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);

  // activeModal: null | { type: 'event'|'shop'|'rest', node, eventData?, inventory?, restOptions?, blessingChoices? }
  const [activeModal, setActiveModal] = useState(null);
  const [isLoadoutOpen, setIsLoadoutOpen] = useState(false);

  // Session tracking for SumiResultScreen
  const [nodeSessionData, setNodeSessionData] = useState(null);
  const [shopPurchases, setShopPurchases] = useState([]);
  const [cursePicker, setCursePicker] = useState(null); // null | { curses: [...] } — curse_removal picker
  const [unitPicker, setUnitPicker] = useState(null);   // null | { keys: [...] } — fresh_recruits picker

  const scrollRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };
  const handleMouseLeave = () => setIsDragging(false);
  const handleMouseUp = () => setIsDragging(false);
  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  const openLoadout = () => {
    tutorial?.pauseStep?.('map_upgrades');
    setIsLoadoutOpen(true);
  };

  const closeLoadout = () => {
    setIsLoadoutOpen(false);
    if (
      tutorial?.activeStep?.id === 'map_upgrades' ||
      (tutorial?.completed?.map_select_node && !tutorial?.completed?.map_upgrades)
    ) {
      tutorial?.completeStep?.('map_upgrades');
    }
  };

  const handleNodeClick = (node) => {
    if (node.status === 'available') {
      tutorial?.completeStep?.('map_select_node');
      setSelectedNode(node);
      tutorial?.requestStep?.('node_detail');
    }
  };

  useEffect(() => {
    if (selectedNode?.status === 'available') {
      tutorial?.requestStep?.('node_detail');
    }
  }, [selectedNode, tutorial?.completed?.map_upgrades, tutorial]);

  // Mark a node completed in the map and clear selection
  const completeNode = (nodeId) => {
    setMapNodes(prevMapNodes => applyNodeCompletion(prevMapNodes, nodeId));
    // D1: tick node-duration curses (VILLAGE_WRATH). Combat nodes tick via handleRegionVictory instead.
    setRunState(prev => prev ? { ...prev, curses: tickCurses(prev.curses, { node: true }) } : prev);
    setSelectedNode(null);
    setActiveModal(null);
  };

  // ─── Play button handler — routes by node type ────────────────────────────
  const handlePlayClick = () => {
    if (!selectedNode || selectedNode.status !== 'available') return;
    const node = selectedNode;
    tutorial?.completeStep?.('node_detail');

    if (node.type === 'combat' || node.type === 'elite' || node.type === 'boss') {
      // Navigate to combat
      onPlayNode(node);
    } else if (node.type === 'event') {
      const event = getEvent(node.variant);
      if (!event) {
        // Unknown event variant — treat as pass-through
        completeNode(node.id);
        return;
      }
      setActiveModal({ type: 'event', node, eventData: event });
    } else if (node.type === 'shop') {
      // Auto-start run if needed so we have a valid runState for the shop
      const activeRun = runState ?? startRun(meta);
      const inventory = generateShopInventory(activeRun, node.id);
      if (!runState) setRunState(activeRun);
      setActiveModal({ type: 'shop', node, inventory });
    } else if (node.type === 'rest') {
      const activeRun = runState ?? startRun(meta);
      const options = getRestOptions(activeRun);
      const blessings = getRestBlessingChoices(activeRun);
      if (!runState) setRunState(activeRun);
      setActiveModal({ type: 'rest', node, restOptions: options, blessingChoices: blessings });
    } else {
      // Fallback: just complete the node
      completeNode(node.id);
    }
  };

  // ─── Event modal callbacks ─────────────────────────────────────────────────
  const handleEventChoice = (choiceId) => {
    const { node, eventData } = activeModal;
    const activeRun = runState ?? startRun(meta);
    const prevHonor = activeRun.honorEarned ?? 0;
    const prevCommand = activeRun.baseCommand ?? 0;

    const newRunState = applyEventChoice(activeRun, eventData.id, choiceId);
    const newHonor = newRunState.honorEarned ?? 0;
    const newCommand = newRunState.baseCommand ?? 0;
    const honorDelta = newHonor - prevHonor;
    const commandDelta = newCommand - prevCommand;

    if (honorDelta !== 0) {
      setMeta(prev => ({ ...prev, honor: prev.honor + honorDelta }));
    }

    if (newRunState.pendingCombat) {
      const combatNode = {
        ...node,
        type: 'combat',
        variant: newRunState.pendingCombat.variant,
        waves: 3,
      };
      const { pendingCombat, ...cleanRunState } = newRunState;
      setRunState(cleanRunState);
      completeNode(node.id);
      onPlayNode(combatNode);
    } else {
      setRunState(newRunState);
      const choice = eventData.choices?.find(c => c.id === choiceId);
      const resources = [];
      if (commandDelta !== 0) resources.push({ name: 'Command', change: `${commandDelta >= 0 ? '+' : ''}${commandDelta}`, color: commandDelta >= 0 ? 'text-[#4a5d23]' : 'text-[#b84235]' });
      if (honorDelta !== 0) resources.push({ name: 'Honor', change: `${honorDelta >= 0 ? '+' : ''}${honorDelta}`, color: honorDelta >= 0 ? 'text-[#d4af37]' : 'text-[#b84235]' });
      
      setNodeSessionData({
        type: 'event',
        title: eventData.name ?? 'Event',
        time: null,
        resources,
        impacts: [{ description: choice?.label ?? `Chose: ${choiceId}`, color: 'text-[#483d8b]' }]
      });
      completeNode(node.id);
    }
  };

  // ─── Shop modal callbacks ──────────────────────────────────────────────────
  // Barracks not yet unlocked — permanently via meta, or this run via fresh_recruits
  const getLockableBarracks = (run) => {
    const unlocked = new Set([
      ...(meta.unlockedBarracks ?? []),
      ...((run ?? runState)?.shopBarracksUnlocks ?? []),
    ]);
    return Object.keys(BARRACKS_DEFS).filter(k => !unlocked.has(k));
  };

  const handleShopPurchase = (itemId, price) => {
    const activeRun = runState ?? startRun(meta);

    // curse_removal (Q7=A): only purchasable with curses present; opens a picker to choose which to remove
    if (SHOP_ITEMS[itemId]?.effect === 'remove_1_curse') {
      if (!activeRun.curses || activeRun.curses.length === 0) return;
      const newRunState = purchaseItem(activeRun, itemId, price);
      setRunState(newRunState);
      setShopPurchases(prev => [...prev, { itemId, price }]);
      setCursePicker({ curses: newRunState.curses });
      return;
    }

    // fresh_recruits (FR-Q=A): pick a barracks to unlock for the rest of the run
    if (SHOP_ITEMS[itemId]?.effect === 'plus_1_unit_choice') {
      const lockable = getLockableBarracks(activeRun);
      if (lockable.length === 0) return;
      const newRunState = purchaseItem(activeRun, itemId, price);
      setRunState(newRunState);
      setShopPurchases(prev => [...prev, { itemId, price }]);
      setUnitPicker({ keys: lockable });
      return;
    }

    const newRunState = purchaseItem(activeRun, itemId, price);
    setRunState(newRunState);
    setShopPurchases(prev => [...prev, { itemId, price }]);
  };

  const handleCursePick = (curseId) => {
    setRunState(prev => prev ? { ...prev, curses: prev.curses.filter(c => c.id !== curseId) } : prev);
    setCursePicker(null);
  };

  const handleUnitPick = (barracksKey) => {
    setRunState(prev => prev ? {
      ...prev,
      shopBarracksUnlocks: [...(prev.shopBarracksUnlocks ?? []), barracksKey],
    } : prev);
    setUnitPicker(null);
  };

  const handleShopLeave = () => {
    const totalSpent = shopPurchases.reduce((sum, p) => sum + p.price, 0);
    setNodeSessionData({
      type: 'shop',
      title: 'Market Visit',
      time: null,
      resources: [
        { name: 'Command Spent', change: `-${totalSpent}`, color: totalSpent > 0 ? 'text-[#b84235]' : 'text-[#8b8574]' },
        { name: 'Items Acquired', change: `${shopPurchases.length}`, color: 'text-[#4a5d23]' }
      ],
      impacts: shopPurchases.length > 0 
        ? shopPurchases.map(p => ({ description: `Purchased ${p.itemId}`, color: 'text-[#dfd4ba]/70' }))
        : [{ description: 'Left empty-handed', color: 'text-[#8b8574]' }]
    });
    completeNode(activeModal.node.id);
  };

  // ─── Rest modal callbacks ──────────────────────────────────────────────────
  const handleRestChoice = (optionId, payload) => {
    const activeRun = runState ?? startRun(meta);
    const prevHonor = activeRun.honorEarned ?? 0;
    const newRunState = applyRestChoice(activeRun, optionId, payload);
    const newHonor = newRunState.honorEarned ?? 0;
    const honorDelta = newHonor - prevHonor;
    setRunState(newRunState);

    if (honorDelta !== 0) {
      setMeta(prev => ({ ...prev, honor: prev.honor + honorDelta }));
    }

    const resources = [];
    if (honorDelta !== 0) resources.push({ name: 'Honor', change: `${honorDelta >= 0 ? '+' : ''}${honorDelta}`, color: honorDelta >= 0 ? 'text-[#d4af37]' : 'text-[#b84235]' });

    const impactDesc = getRestImpactDescription(optionId, payload, newRunState);
    setNodeSessionData({
      type: 'rest',
      title: 'War Camp',
      time: null,
      resources,
      impacts: [{ description: impactDesc, color: 'text-[#2b3d60]' }]
    });
    completeNode(activeModal.node.id);
  };

  const handleRestLeave = () => {
    setNodeSessionData({
      type: 'rest',
      title: 'War Camp',
      time: null,
      resources: [],
      impacts: [{ description: 'Resumed journey without rest', color: 'text-[#8b8574]' }]
    });
    completeNode(activeModal.node.id);
  };

  function getRestImpactDescription(optionId, payload, newRunState) {
    switch (optionId) {
      case 'heal': return 'Healed wounded towers';
      case 'honor': return 'Meditated for spiritual clarity';
      case 'blessing': return payload?.blessing ? `Received blessing: ${payload.blessing}` : 'Received a blessing';
      case 'recruit': return 'Recruited new defenders';
      default: return `Chose: ${optionId}`;
    }
  }

  // ─── Sidebar data ──────────────────────────────────────────────────────────
  const techs = useMemo(() => {
    return Object.fromEntries(
      Object.entries(PERMANENT_TECHS).map(([key, prov]) => [
        key,
        {
          name: prov.name,
          desc: prov.desc,
          cost: prov.cost,
          unlocked: meta?.unlockedProvisions?.includes(key) ?? false,
        },
      ])
    );
  }, [meta?.unlockedProvisions]);

  const heirlooms = useMemo(() => {
    const items = Object.entries(HEIRLOOMS).map(([key, prov]) => ({
      id: key,
      name: prov.name,
      desc: prov.desc,
      icon: prov.icon,
      unlocked: meta?.unlockedProvisions?.includes(key) ?? false,
    }));
    while (items.length < 6) {
      items.push({ id: `EMPTY_${items.length}`, name: 'Locked', desc: `Requires ${(items.length + 1) * 50} Honor`, icon: '', unlocked: false });
    }
    return items;
  }, [meta?.unlockedProvisions]);

  // ─── SVG connection lines ──────────────────────────────────────────────────
  const getSvgLines = () => {
    const lines = [];
    mapNodes.forEach(node => {
      if (node.next && node.next.length > 0) {
        node.next.forEach(targetId => {
          const target = mapNodes.find(n => n.id === targetId);
          if (target) {
            let stroke = '#8b8574';
            let strokeWidth = '1';
            let strokeDasharray = '2 2';
            let opacity = '0.4';

            const hasCompletedNext = node.next?.some(id => {
              const n = mapNodes.find(m => m.id === id);
              return n && n.status === 'completed';
            });

            if (node.status === 'completed' && target.status === 'completed') {
              stroke = '#d4af37';      // gold
              strokeWidth = '4';
              strokeDasharray = 'none';
              opacity = '0.9';
            } else if (node.status === 'completed' && target.status === 'available' && !hasCompletedNext) {
              stroke = '#b84235';      // red
              strokeWidth = '2';
              strokeDasharray = 'none';
              opacity = '0.9';
            } else {
              stroke = '#8b8574';      // muted, dashed
              strokeWidth = '1';
              strokeDasharray = '2 2';
              opacity = '0.4';
            }
            // locked: stays as default

            lines.push(
              <line
                key={`${node.id}-${target.id}`}
                x1={`${node.x}%`}
                y1={`${node.y}%`}
                x2={`${target.x}%`}
                y2={`${target.y}%`}
                stroke={stroke}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDasharray}
                opacity={opacity}
              />
            );
          }
        });
      }
    });
    return lines;
  };

  const getNodeIcon = (type) => {
    switch (type) {
      case 'combat': return '⚔️';
      case 'elite': return '💀';
      case 'event': return '❓';
      case 'shop': return '💰';
      case 'rest': return '⛺';
      case 'boss': return '👹';
      default: return '📍';
    }
  };

  return (
    <div className="absolute inset-0 bg-[#0a0908] z-[200] flex flex-col font-serif select-none overflow-hidden text-[#dfd4ba]">

      {/* ATMOSPHERIC BACKGROUND */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#b84235] rounded-full blur-[150px] opacity-10" />
        <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }} />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_transparent_0%,_#0a0908_120%)] opacity-80" />
      </div>

      {/* TOP HEADER */}
      <div className="relative z-40 w-full flex justify-between items-center px-4 md:px-8 py-2 md:py-3 bg-[#0a0908]/60 backdrop-blur-md border-b border-[#d4af37]/20 shadow-[0_10px_30px_rgba(0,0,0,0.8)] pointer-events-none">
        
        <div className="flex-1 flex items-center justify-start pointer-events-auto">
          <button 
            onClick={openLoadout}
            data-tutorial-target="map-upgrades"
            className="flex items-center justify-center gap-2 px-3 py-1.5 md:px-4 md:py-2 border border-[#d4af37]/30 bg-[#1a1816]/90 text-[#d4af37] font-black uppercase tracking-[0.1em] text-[10px] md:tracking-[0.2em] md:text-xs hover:bg-[#d4af37]/10 hover:border-[#d4af37] transition-all shadow-[0_0_15px_rgba(212,175,55,0.15)] rounded-sm whitespace-nowrap"
          >
            <span className="text-sm md:text-base">⛩️</span> 
            <span>Upgrades</span>
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center pointer-events-auto px-2">
          <span className="text-[7px] md:text-[8px] font-bold tracking-[0.2em] md:tracking-[0.4em] text-[#b84235] uppercase mb-0.5 flex items-center gap-2 whitespace-nowrap">
            <span className="w-2 md:w-3 h-[1px] bg-[#b84235]" /> Stronghold Hub <span className="w-2 md:w-3 h-[1px] bg-[#b84235]" />
          </span>
          <h1 className="text-xl md:text-2xl lg:text-3xl text-[#dfd4ba] font-black tracking-[0.1em] md:tracking-[0.2em] uppercase text-shadow-sm whitespace-nowrap text-center" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>
            Imperial Capital
          </h1>
        </div>

        <div className="flex-1 flex items-center justify-end pointer-events-auto">
          <div className="flex flex-col text-right whitespace-nowrap">
            <span className="font-bold text-[7px] md:text-[8px] tracking-[0.2em] md:tracking-[0.3em] uppercase text-[#8b8574]">Ancestral Honor</span>
            <div className="flex items-baseline gap-1 justify-end">
              <span className="text-xl md:text-3xl font-black text-[#d4af37] drop-shadow-[0_0_15px_rgba(212,175,55,0.4)]">{(meta?.honor ?? 0).toLocaleString()}</span>
              <span className="text-[10px] md:text-xs text-[#d4af37]/60">H</span>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN LAYOUT */}
      <div className="relative z-10 flex-1 flex items-stretch h-0 overflow-hidden w-full">

        {/* DRAWER BACKDROP */}
        {isLoadoutOpen && (
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm z-40 animate-[fade-in_0.3s_ease-out]" 
            onClick={closeLoadout} 
          />
        )}

        {/* LEFT PILLAR OVERLAY (DRAWER) */}
        <div className={`absolute top-0 bottom-0 left-0 w-[420px] bg-[#0a0908]/95 backdrop-blur-xl border-r border-[#d4af37]/30 flex flex-col shadow-[20px_0_50px_rgba(0,0,0,0.9)] z-50 transition-transform duration-300 ${isLoadoutOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="absolute top-2 right-4 z-50">
            <button onClick={closeLoadout} className="text-[#8b8574] hover:text-[#dfd4ba] text-3xl font-black transition-colors">&times;</button>
          </div>

          {/* Tabs Header */}
          <div className="flex w-full border-b border-[#d4af37]/20 bg-[#141211] shrink-0">
            <button
              className={`flex-1 py-4 text-xs font-black uppercase tracking-[0.3em] transition-all duration-300 ${activeSidebarTab === 'DOJO' ? 'text-[#d4af37] bg-gradient-to-t from-[#d4af37]/10 to-transparent border-b-2 border-[#d4af37]' : 'text-[#8b8574] hover:text-[#dfd4ba] border-b-2 border-transparent'}`}
              onClick={() => setActiveSidebarTab('DOJO')}
            >
              The Dojo
            </button>
            <button
              className={`flex-1 py-4 text-xs font-black uppercase tracking-[0.3em] transition-all duration-300 ${activeSidebarTab === 'SHRINE' ? 'text-[#d4af37] bg-gradient-to-t from-[#d4af37]/10 to-transparent border-b-2 border-[#d4af37]' : 'text-[#8b8574] hover:text-[#dfd4ba] border-b-2 border-transparent'}`}
              onClick={() => setActiveSidebarTab('SHRINE')}
            >
              The Shrine
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 relative flex flex-col">

            {activeSidebarTab === 'DOJO' && (
              <div className="flex-1 flex flex-col animate-[fade-in_0.3s_ease-out] overflow-hidden">
                <div className="mb-4 text-center shrink-0">
                  <p className="text-[9px] font-bold text-[#d4af37] tracking-[0.3em] mt-2 uppercase">Provisions</p>
                  <div className="w-12 h-[1px] bg-gradient-to-r from-transparent via-[#d4af37]/50 to-transparent mx-auto mt-4" />
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
                  {/* Items Section */}
                  <div className="mb-5">
                    <p className="text-[8px] font-bold text-[#b84235] tracking-[0.2em] uppercase mb-2 px-1">Equipment</p>
                    <div className="grid grid-cols-3 gap-2">
                      {Object.entries(PROVISIONS)
                        .filter(([, p]) => p.type === 'item')
                        .map(([key, prov]) => {
                          const isUnlocked = meta?.unlockedProvisions?.includes(key) ?? false;
                          const isEquipped = meta?.equippedItem === key;
                          return (
                            <button
                              key={key}
                              className={`aspect-square flex flex-col items-center justify-center relative p-2 transition-all duration-200
                                ${isEquipped
                                  ? 'border border-[#d4af37] bg-[#d4af37]/10 shadow-[0_0_10px_rgba(212,175,55,0.2)]'
                                  : isUnlocked
                                    ? 'border border-[#8b8574]/30 bg-[#1a1816]/50 hover:border-[#d4af37]/50 cursor-pointer'
                                    : 'border border-[#8b8574]/10 bg-[#0a0908]/30 opacity-50'
                                }`}
                              onClick={() => setHoveredTech(key)}
                            >
                              {isEquipped && <div className="absolute inset-0 bg-[#d4af37]/5 blur-md pointer-events-none" />}
                              <span className={`text-xl mb-1 ${isUnlocked ? '' : 'grayscale opacity-40'}`}>{prov.icon}</span>
                              <span className="text-[7px] font-bold uppercase text-center tracking-[0.05em] text-[#dfd4ba]/70 leading-tight">{prov.name}</span>
                            </button>
                          );
                        })}
                    </div>
                  </div>

                  {/* Starting Bonuses Section */}
                  <div className="mb-5">
                    <p className="text-[8px] font-bold text-[#4a5d23] tracking-[0.2em] uppercase mb-2 px-1">Starting Bonuses</p>
                    <div className="grid grid-cols-3 gap-2">
                      {Object.entries(PROVISIONS)
                        .filter(([, p]) => p.type === 'starting_bonus')
                        .map(([key, prov]) => {
                          const isUnlocked = meta?.unlockedProvisions?.includes(key) ?? false;
                          return (
                            <button
                              key={key}
                              className={`aspect-square flex flex-col items-center justify-center relative p-2 transition-all duration-200
                                ${isUnlocked
                                  ? 'border border-[#4a5d23]/50 bg-[#1a2816]/50 hover:border-[#4a5d23]'
                                  : 'border border-[#8b8574]/10 bg-[#0a0908]/30 opacity-50 cursor-pointer'
                                }`}
                              onClick={() => setHoveredTech(key)}
                            >
                              <span className={`text-xl mb-1 ${isUnlocked ? '' : 'grayscale opacity-40'}`}>{prov.icon}</span>
                              <span className="text-[7px] font-bold uppercase text-center tracking-[0.05em] text-[#dfd4ba]/70 leading-tight">{prov.name}</span>
                            </button>
                          );
                        })}
                    </div>
                  </div>

                  {/* Tower Upgrades Section */}
                  <div className="mb-5">
                    <p className="text-[8px] font-bold text-[#2b3d60] tracking-[0.2em] uppercase mb-2 px-1">Tower Upgrades</p>
                    <div className="grid grid-cols-3 gap-2">
                      {Object.entries(PROVISIONS)
                        .filter(([, p]) => p.type === 'tower_upgrade')
                        .map(([key, prov]) => {
                          const isUnlocked = meta?.unlockedProvisions?.includes(key) ?? false;
                          return (
                            <button
                              key={key}
                              className={`aspect-square flex flex-col items-center justify-center relative p-2 transition-all duration-200
                                ${isUnlocked
                                  ? 'border border-[#2b3d60]/50 bg-[#1a2233]/50 hover:border-[#2b3d60]'
                                  : 'border border-[#8b8574]/10 bg-[#0a0908]/30 opacity-50 cursor-pointer'
                                }`}
                              onClick={() => setHoveredTech(key)}
                            >
                              <span className={`text-xl mb-1 ${isUnlocked ? '' : 'grayscale opacity-40'}`}>{prov.icon}</span>
                              <span className="text-[7px] font-bold uppercase text-center tracking-[0.05em] text-[#dfd4ba]/70 leading-tight">{prov.name}</span>
                            </button>
                          );
                        })}
                    </div>
                  </div>

                  {/* Techniques Section */}
                  <div className="mb-4">
                    <p className="text-[8px] font-bold text-[#8b1420] tracking-[0.2em] uppercase mb-2 px-1">Techniques</p>
                    <div className="grid grid-cols-3 gap-2">
                      {Object.entries(PROVISIONS)
                        .filter(([, p]) => p.type === 'technique')
                        .map(([key, prov]) => {
                          const isUnlocked = meta?.unlockedProvisions?.includes(key) ?? false;
                          return (
                            <button
                              key={key}
                              className={`aspect-square flex flex-col items-center justify-center relative p-2 transition-all duration-200
                                ${isUnlocked
                                  ? 'border border-[#8b1420]/50 bg-[#281616]/50 hover:border-[#8b1420]'
                                  : 'border border-[#8b8574]/10 bg-[#0a0908]/30 opacity-50 cursor-pointer'
                                }`}
                              onClick={() => setHoveredTech(key)}
                            >
                              <span className={`text-xl mb-1 ${isUnlocked ? '' : 'grayscale opacity-40'}`}>{prov.icon}</span>
                              <span className="text-[7px] font-bold uppercase text-center tracking-[0.05em] text-[#dfd4ba]/70 leading-tight">{prov.name}</span>
                            </button>
                          );
                        })}
                    </div>
                  </div>
                </div>

                {/* Detail Panel */}
                <div className="shrink-0 border-t border-[#d4af37]/10 bg-gradient-to-t from-[#0a0908] to-transparent p-4">
                  {hoveredTech && PROVISIONS[hoveredTech] ? (
                    <div className="animate-[fade-in_0.2s_ease-out]">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-black tracking-[0.1em] uppercase text-xs text-[#d4af37] flex items-center gap-2">
                          <span>{PROVISIONS[hoveredTech].icon}</span>
                          {PROVISIONS[hoveredTech].name}
                        </h4>
                        <span className={`text-[8px] uppercase font-bold px-2 py-0.5 border ${meta?.unlockedProvisions?.includes(hoveredTech)
                          ? 'border-[#d4af37]/30 text-[#d4af37]'
                          : 'border-[#8b8574]/30 text-[#8b8574]'
                          }`}>
                          {meta?.unlockedProvisions?.includes(hoveredTech) ? 'UNLOCKED' : `${PROVISIONS[hoveredTech].cost} H`}
                        </span>
                      </div>
                      <p className="text-xs font-sans leading-relaxed text-[#dfd4ba]/70">{PROVISIONS[hoveredTech].desc}</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center opacity-30 my-2">
                      <div className="w-1 h-1 rounded-full bg-[#d4af37] mb-2 animate-ping" />
                      <p className="text-[9px] font-bold uppercase tracking-[0.3em]">Hover provision</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeSidebarTab === 'SHRINE' && (
              <div className="flex-1 flex flex-col animate-[fade-in_0.3s_ease-out]">
                <div className="mb-6 text-center shrink-0">
                  <p className="text-[9px] font-bold text-[#d4af37] tracking-[0.3em] mt-2 uppercase">Ancestral Vault</p>
                  <div className="w-12 h-[1px] bg-gradient-to-r from-transparent via-[#d4af37]/50 to-transparent mx-auto mt-4" />
                </div>

                <div className="flex-1 flex flex-col gap-6 mt-2 relative z-10 overflow-hidden">
                  {/* Active Slot */}
                  <div className="w-full relative p-[1px] bg-gradient-to-b from-[#d4af37]/50 to-transparent rounded-sm shadow-[0_10px_30px_rgba(0,0,0,0.8)] shrink-0">
                    <div className="bg-[#0a0908] p-4 flex items-center gap-4 w-full h-full rounded-sm">
                      <div className="w-14 h-14 bg-gradient-to-br from-[#1a1816] to-[#0a0908] border border-[#d4af37]/30 flex items-center justify-center text-2xl shrink-0 shadow-inner [box-shadow:inset_0_0_20px_rgba(0,0,0,1)]">
                        {heirlooms.find(h => h.id === meta?.equippedItem)?.icon || '❓'}
                      </div>
                      <div className="flex flex-col flex-1 overflow-hidden">
                        <span className="text-[8px] text-[#8b8574] font-bold tracking-[0.3em] uppercase mb-1">Equipped</span>
                        <span className="text-[#d4af37] font-black tracking-widest uppercase text-[10px] mb-1 truncate">{heirlooms.find(h => h.id === meta?.equippedItem)?.name || 'None'}</span>
                        <span className="text-[10px] text-[#dfd4ba]/60 font-sans leading-tight line-clamp-2">{heirlooms.find(h => h.id === meta?.equippedItem)?.desc}</span>
                      </div>
                    </div>
                  </div>

                  {/* Inventory Grid */}
                  <div className="grid grid-cols-2 gap-3 overflow-y-auto custom-scrollbar content-start pb-4 pr-1">
                    {heirlooms.map(item => {
                      const isEmpty = item.id.startsWith('EMPTY');
                      const isActive = meta?.equippedItem === item.id;
                      const isLocked = !item.unlocked && !isEmpty;

                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            if (isEmpty) return;
                            if (isLocked && meta?.honor >= 50) {
                              unlockProvision(item.id, PROVISIONS[item.id]?.cost ?? 50);
                            } else if (item.unlocked) {
                              equipProvision(item.id);
                            }
                          }}
                          className={`aspect-square flex flex-col items-center justify-center relative p-2 transition-all duration-300
                            ${isActive
                              ? 'border border-[#d4af37] bg-gradient-to-b from-[#d4af37]/10 to-transparent shadow-[0_0_15px_rgba(212,175,55,0.2)]'
                              : isEmpty
                                ? 'border border-[#8b8574]/10 bg-[#0a0908]/30 cursor-not-allowed opacity-50'
                                : isLocked
                                  ? 'border border-[#8b8574]/20 bg-[#0a0908]/50 cursor-pointer hover:border-[#d4af37]/30'
                                  : 'border border-[#8b8574]/30 bg-[#1a1816]/50 hover:border-[#d4af37]/50 hover:bg-[#1a1816] cursor-pointer'
                            }`}
                        >
                          {isActive && <div className="absolute inset-0 bg-[#d4af37]/5 blur-md pointer-events-none" />}
                          <span className={`text-2xl mb-2 drop-shadow-md ${isEmpty || isLocked ? 'opacity-20 text-[#8b8574]' : ''}`}>{item.icon || '⬛'}</span>
                          <span className="text-[8px] font-bold uppercase text-center tracking-[0.1em] text-[#dfd4ba]/80 leading-tight w-full truncate px-1">
                            {item.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PILLAR: CONQUEST MAP */}
        <div className="flex-1 w-full bg-[radial-gradient(ellipse_at_center,_#110b0a_0%,_#0a0808_100%)] flex flex-col relative overflow-hidden z-10">

          {/* Draggable scrolling map */}
          <div
            ref={scrollRef}
            className="relative z-10 flex-1 w-full overflow-x-auto overflow-y-hidden scroll-smooth active:cursor-grabbing cursor-grab"
            style={{ scrollbarWidth: 'none', paddingTop: '20px', paddingBottom: '20px' }}
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
          >
            <div className="relative h-full min-w-[1400px]">
              {/* SVG Lines */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                {getSvgLines()}
              </svg>

              {/* Nodes */}
              {mapNodes.map(node => {
                const isAvailable = node.status === 'available';
                const isCompleted = node.status === 'completed';
                const isBoss = node.type === 'boss';
                const isSelected = selectedNode?.id === node.id;
                const isLocked = !isAvailable && !isCompleted;

                const nodeTypeSizes = {
                  combat: 'w-16 h-16',
                  elite: 'w-20 h-20',
                  event: 'w-16 h-16',
                  shop: 'w-16 h-16',
                  rest: 'w-14 h-14',
                  boss: 'w-24 h-24',
                };
                
                const nodeTypeBorderClasses = {
                  combat: 'border-[#b84235]',
                  elite: 'border-[#8b1420]',
                  event: 'border-[#d4af37]',
                  shop: 'border-[#4a5d23]',
                  rest: 'border-[#2b3d60]',
                  boss: 'border-[#dfd4ba]',
                };
                
                const size = nodeTypeSizes[node.type] || 'w-16 h-16';
                const borderClass = isLocked ? 'border-[#8b8574]' : (nodeTypeBorderClasses[node.type] || 'border-[#8b8574]');

                const availableScale = isAvailable ? 'scale-110' : '';
                const selectedScale = isSelected ? 'scale-120' : '';
                const bossScale = isBoss ? 'scale-125' : '';

                return (
                  <div
                    key={node.id}
                    data-tutorial-target={isAvailable ? 'map-available-node' : undefined}
                    className="absolute translate-x-[-50%] translate-y-[-50%] flex flex-col items-center justify-center cursor-pointer z-10 group/node"
                    style={{ left: `${node.x}%`, top: `${node.y}%` }}
                    onMouseEnter={() => setHoveredMapNode(node)}
                    onMouseLeave={() => setHoveredMapNode(null)}
                    onClick={() => handleNodeClick(node)}
                  >
                    {node.threat > 0 && (
                      <div className="absolute bottom-full mb-1 flex items-center justify-center gap-0.5 pointer-events-none opacity-80 transition-all duration-300 group-hover/node:opacity-100 group-hover/node:-translate-y-1 z-20">
                        {Array.from({ length: Math.min(node.threat, 6) }).map((_, i) => (
                          <span key={i} className={`text-[10px] drop-shadow-md transition-all duration-300 ${isLocked ? 'grayscale opacity-30' : ''}`}>💀</span>
                        ))}
                      </div>
                    )}
                    <div className={`${size} rounded-full border-2 flex items-center justify-center transition-all duration-300 relative
                      ${isSelected ? `bg-[#1a0f0e] border-[#d4af37] shadow-[0_0_45px_rgba(212,175,55,0.9)] ${selectedScale}` :
                        isAvailable ? `bg-[#1a0f0e] ${borderClass} shadow-[0_0_20px_rgba(255,255,255,0.15)] ${availableScale}` :
                          isBoss && !isLocked ? `bg-[#0a0908] border-[#dfd4ba] shadow-[0_0_60px_rgba(184,66,53,0.6)] ${bossScale}` :
                            isCompleted ? 'bg-[#1a0f0e]/80 border-[#d4af37]/80' :
                              `bg-[#0a0908] border-[#8b8574]/20 hover:border-[#8b8574]/40`
                      }`}
                    >
                      {(isAvailable || isSelected) && (
                        <div className="absolute inset-[-8px] rounded-full border border-white/20 animate-ping opacity-50 pointer-events-none" />
                      )}
                      <span className={`text-4xl drop-shadow-md pointer-events-none transition-all duration-300 ${isLocked ? 'grayscale opacity-30' : ''}`}>
                        {isCompleted ? '✅' : getNodeIcon(node.type)}
                      </span>
                    </div>

                    {isBoss || isAvailable || isSelected ? (
                      <div className="absolute top-[110%] mt-2 bg-[#0a0908]/90 border border-[#d4af37]/50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#dfd4ba] whitespace-nowrap shadow-xl pointer-events-none">
                        {node.name}
                      </div>
                    ) : (
                      <div className="absolute top-[110%] mt-2 text-[8px] font-bold uppercase tracking-wider text-[#8b8574] group-hover/node:text-[#dfd4ba] group-hover/node:scale-110 transition-all bg-[#0a0908]/60 px-2 rounded backdrop-blur-sm whitespace-nowrap pointer-events-none">
                        {node.name}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* SELECTED NODE INFO CARD */}
          {selectedNode && (
            <div data-tutorial-target="node-detail-card" className="absolute bottom-8 right-8 w-[400px] bg-[#0a0908]/95 backdrop-blur-xl border border-[#d4af37]/30 shadow-[0_30px_60px_rgba(0,0,0,0.95)] z-30 flex flex-col pointer-events-auto animate-[fade-in_0.2s_ease-out] rounded-sm">
              <div className="flex justify-between items-start p-6 border-b border-[#8b8574]/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#b84235]/10 rounded-full blur-[40px] pointer-events-none" />
                <div className="flex flex-col z-10">
                  <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#d4af37] block mb-2">
                    {selectedNode.type === 'boss' ? 'Domain Boss' :
                      selectedNode.type === 'elite' ? 'Elite Threat' :
                        selectedNode.type === 'event' ? 'Mystery Event' :
                          selectedNode.type === 'shop' ? 'Traveling Merchant' :
                            selectedNode.type === 'rest' ? 'War Camp' : 'Combat Encounter'}
                  </span>
                  <h3 className="text-2xl font-black text-white tracking-widest uppercase mb-3 text-shadow-sm">{selectedNode.name}</h3>
                  <div className="flex gap-2 flex-wrap">
                    <span className={`px-2 py-0.5 uppercase tracking-widest font-bold text-[9px] border
                      ${selectedNode.status === 'completed' ? 'bg-[#d4af37]/10 border-[#d4af37]/30 text-[#d4af37]' :
                        selectedNode.status === 'available' ? 'bg-[#2b5e2b]/20 border-[#4a5d23]/50 text-[#6a9e4a]' :
                          'bg-[#8b8574]/10 border-[#8b8574]/30 text-[#8b8574]'
                      }`}
                    >
                      {selectedNode.status.replace('_', ' ')}
                    </span>
                    {selectedNode.threat > 0 && (
                      <span className={`px-2 py-0.5 uppercase font-bold text-[9px] border border-[#b84235]/30 bg-[#b84235]/10 ${selectedNode.threat >= 6 ? 'text-[#d4af37]' : 'text-[#b84235]'}`}>
                        Threat {'💀'.repeat(Math.min(selectedNode.threat, 6))}
                      </span>
                    )}
                  </div>
                </div>
                <button onClick={() => setSelectedNode(null)} className="text-[#8b8574] hover:text-white z-10 p-1 text-2xl font-black transition-colors">&times;</button>
              </div>

              <div className="p-6 flex flex-col gap-5 bg-[#141211]/50">
                <div className="flex justify-between items-center text-xs font-bold uppercase tracking-[0.2em] border-b border-[#8b8574]/10 pb-3">
                  <span className="text-[#8b8574] flex items-center gap-2"><span>⚔️</span> Encounter Phases</span>
                  <span className="text-[#dfd4ba] font-black text-sm">
                    {(() => {
                      if (selectedNode.type === 'boss') return `${getPlayableWaveCount('boss', selectedNode.waves)} + Boss`;
                      if (selectedNode.type === 'elite' || selectedNode.type === 'combat') {
                        return getPlayableWaveCount(selectedNode.type, selectedNode.waves);
                      }
                      return 'N/A';
                    })()}
                  </span>
                </div>
                <div className="flex justify-between items-start text-xs font-bold uppercase tracking-[0.2em]">
                  <span className="text-[#8b8574] mt-1 flex items-center gap-2"><span>🎁</span> Reward</span>
                  <div className="flex flex-col items-end text-right">
                    {formatNodeRewardLines(selectedNode).length > 0 ? (
                      formatNodeRewardLines(selectedNode).map((line, idx) => (
                        <span
                          key={`${line.text}-${idx}`}
                          className={line.tone === 'primary'
                            ? 'text-[#d4af37] text-xs font-black tracking-widest'
                            : 'text-[#dfd4ba]/60 text-[9px] mt-0.5'}
                        >
                          {line.text}
                        </span>
                      ))
                    ) : selectedNode.type === 'boss' ? (
                      <span className="text-[#d4af37] text-xs font-black tracking-widest">Domain Conquest</span>
                    ) : selectedNode.type === 'event' ? (
                      <span className="text-[#dfd4ba] text-xs font-black tracking-widest">Variable Outcomes</span>
                    ) : selectedNode.type === 'shop' ? (
                      <span className="text-[#dfd4ba] text-xs font-black tracking-widest">Goods & Services</span>
                    ) : selectedNode.type === 'rest' ? (
                      <span className="text-[#dfd4ba] text-xs font-black tracking-widest">Restore & Prepare</span>
                    ) : (
                      <span className="text-[#8b8574] text-[9px]">-</span>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={handlePlayClick}
                disabled={selectedNode.status !== 'available'}
                className={`relative group overflow-hidden shadow-[0_-10px_30px_rgba(0,0,0,0.5)] pointer-events-auto cursor-pointer transition-opacity w-full ${selectedNode.status === 'available' ? '' : 'opacity-40 cursor-not-allowed'}`}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#b84235] to-[#802a20] translate-x-[-100%] group-hover:translate-x-[0%] transition-transform duration-500" />
                <div className="relative z-10 px-8 py-5 border-t border-[#b84235] bg-[#1a0f0e] text-[#dfd4ba] text-sm uppercase tracking-[0.3em] font-black group-hover:text-white transition-colors group-hover:border-[#d4af37] text-center">
                  {selectedNode.type === 'event' ? `Investigate Event`
                    : selectedNode.type === 'shop' ? `Visit Merchant`
                      : selectedNode.type === 'rest' ? `Rest at Camp`
                        : `Begin Encounter`}
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MODAL OVERLAYS */}
      {activeModal?.type === 'event' && (
        <EventModal
          event={activeModal.eventData}
          runState={runState}
          onChoice={handleEventChoice}
          onClose={() => setActiveModal(null)}
        />
      )}
      {activeModal?.type === 'shop' && (
        <ShopModal
          inventory={activeModal.inventory}
          runState={runState}
          lockableBarracks={getLockableBarracks(runState)}
          onPurchase={handleShopPurchase}
          onLeave={handleShopLeave}
        />
      )}
      {activeModal?.type === 'rest' && (
        <RestModal
          options={activeModal.restOptions}
          blessingChoices={activeModal.blessingChoices}
          runState={runState}
          onChoice={handleRestChoice}
          onLeave={handleRestLeave}
        />
      )}

      {/* curse_removal picker — layers above the shop modal */}
      {cursePicker && (
        <div
          className="absolute inset-0 z-[350] flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setCursePicker(null); }}
        >
          <div className="w-[460px] bg-[#0a0908] border border-[#b84235]/50 shadow-[0_0_80px_rgba(0,0,0,0.95)] flex flex-col">
            <div className="border-b border-[#b84235]/30 px-8 py-5">
              <p className="text-[9px] font-bold text-[#b84235] tracking-[0.4em] uppercase mb-1">Purification</p>
              <h2 className="text-xl font-black tracking-[0.2em] uppercase text-[#dfd4ba]">Remove a Curse</h2>
            </div>
            <div className="px-8 py-6 flex flex-col gap-3">
              {cursePicker.curses.map((c) => {
                const def = CURSES[c.id];
                return (
                  <button
                    key={c.id}
                    onClick={() => handleCursePick(c.id)}
                    className="p-4 border border-[#b84235]/30 bg-[#141211] text-left hover:border-[#b84235] hover:bg-[#b84235]/10 transition-all"
                  >
                    <p className="text-xs font-black uppercase tracking-[0.15em] text-[#dfd4ba] mb-1">{def?.name ?? c.id}</p>
                    <p className="text-[9px] text-[#8b8574] uppercase tracking-wider">{def?.desc ?? ''}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* fresh_recruits picker — layers above the shop modal */}
      {unitPicker && (
        <div
          className="absolute inset-0 z-[350] flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setUnitPicker(null); }}
        >
          <div className="w-[460px] bg-[#0a0908] border border-[#4a5d23]/50 shadow-[0_0_80px_rgba(0,0,0,0.95)] flex flex-col">
            <div className="border-b border-[#4a5d23]/30 px-8 py-5">
              <p className="text-[9px] font-bold text-[#4a5d23] tracking-[0.4em] uppercase mb-1">Reinforcements</p>
              <h2 className="text-xl font-black tracking-[0.2em] uppercase text-[#dfd4ba]">Add a Barracks</h2>
            </div>
            <div className="px-8 py-6 flex flex-col gap-3">
              {unitPicker.keys.map((key) => {
                const def  = BARRACKS_DEFS[key];
                const unit = UNIT_TYPES[def?.unit];
                return (
                  <button
                    key={key}
                    onClick={() => handleUnitPick(key)}
                    className="p-4 border border-[#4a5d23]/30 bg-[#141211] text-left hover:border-[#4a5d23] hover:bg-[#4a5d23]/10 transition-all"
                  >
                    <p className="text-xs font-black uppercase tracking-[0.15em] text-[#dfd4ba] mb-1">{def?.name ?? key}</p>
                    <p className="text-[9px] text-[#8b8574] uppercase tracking-wider">Trains {unit?.name ?? def?.unit} for the rest of the run</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SUMI RESULT SCREEN */}
      {nodeSessionData && (
        <SumiResultScreen
          data={nodeSessionData}
          onClose={() => {
            setNodeSessionData(null);
            setShopPurchases([]);
          }}
        />
      )}

    </div>
  );
}
