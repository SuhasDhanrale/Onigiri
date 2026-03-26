const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src', 'App.jsx');
let content = fs.readFileSync(filePath, 'utf8');

const handlers = `
  // --- Centralized UI Action Handlers ---
  const buildBarracks = useCallback((bKey, cost, maxTime) => {
    const s = state.current;
    if (s.koku >= cost && s.gameState === 'COMBAT') {
      s.koku -= cost;
      s.barracks[bKey] = 1;
      s.timers[bKey] = maxTime;
      setUiTick(t => t + 1);
    }
  }, []);

  const upgradeTroopLevel = useCallback((bKey, cost) => {
    const s = state.current;
    if (s.koku >= cost && s.gameState === 'COMBAT') {
      s.koku -= cost;
      s.troopLevel[bKey]++;
      setUiTick(t => t + 1);
    }
  }, []);

  const upgradeBarracksCap = useCallback((bKey, cost) => {
    const s = state.current;
    if (s.koku >= cost && s.gameState === 'COMBAT') {
      s.koku -= cost;
      s.barracks[bKey]++;
      setUiTick(t => t + 1);
    }
  }, []);

  const hireDrill = useCallback((bKey, cost) => {
    const s = state.current;
    if (s.koku >= cost && s.gameState === 'COMBAT') {
      s.koku -= cost;
      s.autoUnlocked[bKey] = true;
      setUiTick(t => t + 1);
    }
  }, []);

  const unlockHero = useCallback((cost) => {
    const s = state.current;
    if (s.koku >= cost && s.gameState === 'COMBAT') {
      s.koku -= cost;
      s.heroUnlocked = true;
      setUiTick(t => t + 1);
    }
  }, []);

  const unlockHeirloom = useCallback((hKey, cost) => {
    if (metaRef.current.honor >= cost) {
      setMeta(prev => ({ 
        ...prev, 
        honor: prev.honor - cost, 
        unlockedHeirlooms: [...prev.unlockedHeirlooms, hKey] 
      }));
    }
  }, []);

  const equipHeirloom = useCallback((hKey) => {
    setMeta(prev => ({ 
      ...prev, 
      equippedHeirloom: prev.equippedHeirloom === hKey ? null : hKey 
    }));
  }, []);

  const unlockTech = useCallback((tKey, cost) => {
    if (metaRef.current.honor >= cost) {
      setMeta(prev => ({ 
        ...prev, 
        honor: prev.honor - cost, 
        unlockedTechs: [...prev.unlockedTechs, tKey] 
      }));
    }
  }, []);

  const resetDynasty = useCallback(() => {
    const s = state.current;
    setMeta(prev => ({ 
      ...prev, 
      honor: prev.honor + s.earnedHonor, 
      conqueredRegions: [] 
    }));
    initRun();
  }, [initRun]);
`;

const target = 'const spawnUnit';
const idx = content.indexOf(target);
if (idx === -1) {
  console.error('Target not found');
  process.exit(1);
}

const newContent = content.slice(0, idx) + handlers + '\n  ' + content.slice(idx);
fs.writeFileSync(filePath, newContent);
console.log('Successfully updated App.jsx');
