const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src', 'App.jsx');
let content = fs.readFileSync(filePath, 'utf8');

const mapScreenTarget = '<MapScreen s={s} meta={meta} setMeta={setMeta} initRun={initRun} startCombat={startCombat} />';
const mapScreenReplacement = `<MapScreen 
        s={s} 
        meta={meta} 
        setMeta={setMeta} 
        initRun={initRun} 
        startCombat={startCombat} 
        unlockHeirloom={unlockHeirloom}
        equipHeirloom={equipHeirloom}
        unlockTech={unlockTech}
        resetDynasty={resetDynasty}
      />`;

const commandPanelTarget = '<CommandPanel \r\n        s={s} \r\n        activeTroops={activeTroops} \r\n        maxTroops={maxTroops} \r\n        meta={meta} \r\n        setMeta={setMeta} \r\n        setUiTick={setUiTick} \r\n        changeQuota={changeQuota} \r\n        triggerWarDrums={triggerWarDrums} \r\n        triggerHarvest={triggerHarvest} \r\n        triggerResolve={triggerResolve} \r\n        triggerThunder={triggerThunder} \r\n        triggerFoxFire={triggerFoxFire} \r\n        triggerDragonWave={triggerDragonWave} \r\n      />';

// The command panel target might have different line endings or whitespace. 
// Let's use a regex that is more forgiving.
const commandPanelRegex = /<CommandPanel[\s\S]*?\/>/;
const commandPanelReplacement = `<CommandPanel 
        s={s} 
        activeTroops={activeTroops} 
        maxTroops={maxTroops} 
        meta={meta} 
        setMeta={setMeta} 
        setUiTick={setUiTick} 
        changeQuota={changeQuota} 
        triggerWarDrums={triggerWarDrums} 
        triggerHarvest={triggerHarvest} 
        triggerResolve={triggerResolve} 
        triggerThunder={triggerThunder} 
        triggerFoxFire={triggerFoxFire} 
        triggerDragonWave={triggerDragonWave}
        buildBarracks={buildBarracks}
        upgradeTroopLevel={upgradeTroopLevel}
        upgradeBarracksCap={upgradeBarracksCap}
        hireDrill={hireDrill}
        unlockHero={unlockHero}
      />`;

content = content.replace(mapScreenTarget, mapScreenReplacement);
content = content.replace(commandPanelRegex, commandPanelReplacement);

fs.writeFileSync(filePath, content);
console.log('Successfully updated App.jsx return statement');
