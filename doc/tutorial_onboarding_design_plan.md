# Tutorial Onboarding Design And Implementation Plan

**Branch:** `tutorial-onboarding-plan`  
**Goal:** Add a guided first-run tutorial that teaches the player how to read and command the game without changing combat balance or breaking the current map -> combat -> reward loop.

**Current direction:** prototype and assess the entire tutorial in the Mock Lab first. Do not wire tutorial behavior into the real game until the mock has been reviewed and approved.

---

## 1. Game Nature

Onigiri is best treated as a **map-based roguelite tower defense / auto-battler**.

The player is not a direct unit controller. The player acts as a battlefield commander:

- choose a route on the conquest map,
- spend Command during combat,
- build and upgrade barracks,
- keep a readable frontline,
- use spells when the battle becomes dangerous,
- collect rewards, curses, and upgrades between nodes,
- prepare for the boss.

Because combat can become visually dense, the tutorial must teach **battle reading** more than button memorization.

---

## 2. Tutorial Strategy

Use a **short guided first run with contextual overlays**, backed by an optional **Tutorial Book**.

Do not use a long standalone tutorial page. That would teach the rules away from the moment where the player needs them. The right design is a small coach overlay that appears only when a system first matters.

Core rules:

- Keep each tutorial card short.
- Let the player continue playing normally.
- Prefer highlights around existing UI over new tutorial-only screens.
- Move obvious or reference-heavy material into the Tutorial Book.
- Save completed steps so tips do not repeat forever.
- Always include a Skip Tutorial option.
- Do not alter combat math, rewards, wave generation, or unit stats for the first pass.

---

## 3. First-Run Tutorial Flow

### Step 1: Opening Monologue

**Screen:** opening story overlay / monologue screen  
**Trigger:** first launch before the home screen  
**Teaches:** premise and motivation

Message direction:

```text
The shrines are silent. Demon roads are opening. You command the last loyal garrison.
```

Design notes:

- keep under 20 seconds,
- make it skippable,
- allow replay from the Tutorial Book.

---

### Step 2: Home Screen

**Screen:** `HomeScreen`  
**Trigger:** first launch or no completed tutorial flag  
**Teaches:** campaign goal

Message:

```text
Choose a chapter, clear nodes, and defeat the demon boss.
```

Player action:

- press Play or open Chapter Select.

---

### Step 3: Conquest Map

**Screen:** `HubTestScreen`  
**Trigger:** first time map appears  
**Teaches:** node selection

Message:

```text
Each node is a choice. Check threat, waves, and rewards before beginning an encounter.
```

Player action:

- select an available node.

---

### Step 4: Map Upgrades

**Screen:** `HubTestScreen` upgrades/loadout area  
**Trigger:** first time map appears, after node selection explanation  
**Teaches:** long-term progression

Message:

```text
The map screen is also where you spend Honor, equip heirlooms, and prepare long-term upgrades.
```

Player action:

- inspect Upgrades or continue to the first node.

---

### Step 5: Node Detail

**Screen:** `HubTestScreen` selected node card  
**Trigger:** first selected available node  
**Teaches:** encounter commitment

Message:

```text
The node card shows what the next choice asks of you. Detailed node types live in the Tutorial Book.
```

Player action:

- click Begin Encounter.

---

### Step 6: Combat Preparation

**Screen:** `CombatScreen` + `CommandPanel`  
**Trigger:** first combat enters `PRE_WAVE`  
**Teaches:** Command economy

Message:

```text
Command is your battle currency. Spend it to strengthen your army before enemies arrive.
```

Player action:

- build, upgrade, or wait for the first wave.

---

### Step 7: Army Roles

**Screen:** `CommandPanel`, `BarracksCard` area  
**Trigger:** first combat, after Step 4  
**Teaches:** basic composition

Message:

```text
Hatamoto hold the front. Yumi attack from behind. A balanced army is easier to keep alive.
```

Player action:

- inspect or use barracks controls.

---

### Step 8: Battle Reading

**Screen:** `CombatScreen` battlefield  
**Trigger:** first wave enters `SPAWNING` or `CLEANUP`  
**Teaches:** reading pressure

Message:

```text
Watch the frontline. If enemies cluster or break through, use a spell or reinforce.
```

Player action:

- continue the fight.

---

### Step 9: Spell Crisis

**Screen:** `SpellShrine` / battlefield  
**Trigger:** first meaningful danger condition  
**Teaches:** spells as intervention tools

Suggested low-risk trigger:

- enemy count above a threshold, or
- any player frontline unit below 40% HP, or
- enemies within a danger distance of the stronghold.

Message:

```text
Spells are emergency tools. Use them when the enemy group becomes too dense or your line is failing.
```

Player action:

- cast a spell or dismiss the tip.

Implementation note:

- Do not auto-cast.
- Do not pause the simulation in the first implementation.

---

## 4. Tutorial Book

The Tutorial Book holds useful information that does not need to interrupt first play.

Keep these out of the guided step flow:

- result screen explanation,
- shop explanation,
- rest explanation,
- event explanation,
- enemy compendium,
- boss explanation,
- deeper upgrade details.

Recommended book sections:

### Story

- premise,
- replay opening monologue,
- campaign objective.

### Upgrades

- Honor,
- heirlooms,
- permanent techniques,
- barracks unlocks.

### Map Nodes

- Combat,
- Elite,
- Shop,
- Rest,
- Event,
- Boss.

### Enemies

- Ikki Rebel,
- Tengu Flier,
- Onmyoji,
- Shinobi,
- Great Oni / boss enemies.

### Bosses

- what bosses are,
- chapter boss identity,
- warning markers,
- general counterplay.

---

## 5. Data Model

Add tutorial state outside combat simulation state.

Recommended shape:

```js
tutorial: {
  enabled: true,
  bookSeen: false,
  completed: {
    opening_monologue: false,
    home_start: false,
    map_select_node: false,
    map_upgrades: false,
    node_detail: false,
    combat_command: false,
    combat_army_roles: false,
    combat_battle_reading: false,
    combat_spell_crisis: false,
  }
}
```

Storage options:

1. `meta.tutorial` for in-session integration with existing hooks.
2. `localStorage` for persistence across refreshes.

Recommended first pass:

- store in `meta.tutorial`,
- mirror to `localStorage` after the UI behavior is stable.

---

## 6. Component Design

### Mock-First Rule

All tutorial design work starts in:

```text
src/mocks/screens/TutorialOnboardingMock.jsx
src/mocks/registry.jsx
```

The real game should not be touched during tutorial assessment. In particular, do not modify:

```text
src/App.jsx
src/ui/screens/HomeScreen.jsx
src/ui/screens/HubTestScreen.jsx
src/ui/screens/CombatScreen.jsx
src/ui/panels/CommandPanel.jsx
src/systems/*
src/config/units.js
src/config/nodes.js
src/config/curses.js
src/config/provisions.js
```

The mock exists to evaluate:

- tutorial order,
- copy length,
- overlay placement,
- highlight clarity,
- Tutorial Book contents,
- whether the player understands the game loop,
- which steps should become real implementation later.

Only after approval should we promote the chosen pieces into production components.

### New Files

```text
src/config/tutorial.js
src/hooks/useTutorial.js
src/ui/components/TutorialOverlay.jsx
src/ui/components/TutorialBook.jsx
```

### `src/config/tutorial.js`

Contains tutorial copy and placement metadata.

Example:

```js
export const TUTORIAL_STEPS = {
  combat_command: {
    title: 'Command',
    body: 'Command is your battle currency. Spend it to strengthen your army before enemies arrive.',
    placement: 'right',
  },
};
```

### `src/hooks/useTutorial.js`

Owns:

- current active step,
- completed step map,
- `showStep(stepId)`,
- `completeStep(stepId)`,
- `skipTutorial()`.

### `src/ui/components/TutorialOverlay.jsx`

Renders:

- small coach panel,
- optional target highlight,
- Next / Got It button,
- Skip Tutorial button.

Design constraints:

- no full-screen blocking except the first home/map explanations if needed,
- high z-index above map and combat UI,
- readable on desktop and mobile,
- no nested cards,
- no large walls of text.

---

## 7. Integration Points

### `src/App.jsx`

Add tutorial hook and pass tutorial controls down to screens.

Low-risk approach:

- keep tutorial state separate from `state.current`,
- do not mutate combat state for tutorial progression,
- derive triggers from current screen and existing state fields.

### `src/ui/screens/HomeScreen.jsx`

Trigger:

- `opening_monologue` before or on first home screen entry,
- `home_start` when the home screen mounts.

### `src/ui/screens/HubTestScreen.jsx`

Triggers:

- `map_select_node` when map first renders,
- `map_upgrades` for the Upgrades/loadout affordance,
- `node_detail` when a node is first selected.

### `src/ui/screens/CombatScreen.jsx`

Triggers:

- `combat_command` when `s.waveState === 'PRE_WAVE'`,
- `combat_battle_reading` when enemies begin spawning.

### `src/ui/panels/CommandPanel.jsx`

Trigger support:

- expose stable target areas for command, spells, and barracks.

Suggested attributes:

```jsx
data-tutorial-target="command-panel"
data-tutorial-target="spell-shrine"
data-tutorial-target="barracks-list"
```

---

## 8. Implementation Phases

### Phase 1: Documentation And Targets

Risk: very low

Tasks:

- add this plan,
- add an isolated Mock Lab tutorial prototype,
- register the mock screen,
- do not add tutorial targets to real UI yet.

Validation:

- build succeeds,
- no visual changes in the real game.
- mock appears in `npm run dev:mocks`.

---

### Phase 2: Mock Assessment

Risk: low

Tasks:

- review all first-run tutorial steps in the mock,
- tune text and placement,
- test phone, compact, tall, wide, and fullscreen mock viewports,
- decide whether the tutorial should pause combat or remain non-blocking.

Validation:

- steps can be navigated forward/back,
- Skip and Restart work,
- target highlights are understandable,
- real game files remain untouched.

---

### Phase 3: Promotion Plan

Risk: low-medium

Tasks:

- extract approved step copy into `src/config/tutorial.js`,
- create the real `TutorialOverlay` component,
- create tutorial state hook,
- add production integration in small reviewable patches.

Validation:

- production build succeeds,
- each promotion patch has one clear screen/system boundary.

---

### Phase 4: Map Tutorial

Risk: low

Tasks:

- trigger `map_select_node`,
- trigger `node_detail`,
- highlight selected node card if possible.

Validation:

- node selection still works,
- event/shop/rest/combat routing unchanged.

---

### Phase 5: Combat Tutorial

Risk: medium

Tasks:

- trigger `combat_command`,
- trigger `combat_army_roles`,
- trigger `combat_battle_reading`,
- trigger `combat_spell_crisis`.

Guardrails:

- no auto-pause unless approved from mock assessment,
- no auto-spend,
- no changes to `CombatSystem`, `WaveSystem`, `SpawnSystem`, or unit configs.

Validation:

- first combat can be won or lost normally,
- spells and barracks buttons still work,
- wave state progression unchanged.

---

### Phase 6: Tutorial Book

Risk: low

Tasks:

- add the optional Tutorial Book,
- include story, upgrades, map nodes, enemies, and bosses,
- keep shop/rest/event/result/boss explanations out of the guided overlay flow.

Validation:

- book can open and close from the map or tutorial UI,
- guided tutorial continues without needing the book,
- book text does not block combat or node selection.

---

### Phase 7: Persistence And Polish

Risk: low

Tasks:

- persist tutorial completion to `localStorage`,
- add reset tutorial option if needed,
- tune mobile placement,
- reduce repeated prompts.

Validation:

- refresh does not restart completed tutorial,
- Skip Tutorial persists,
- mobile layout does not cover primary controls.

---

## 9. Safety Checklist

Before merging any implementation:

- `npm run build` passes.
- First chapter can start from Home.
- First available node can be selected.
- Combat starts from the selected node.
- Wave timer advances normally.
- Barracks controls still spend Command correctly.
- Spells still cast correctly.
- Victory result closes and returns to map.
- Defeat result closes and returns to home/reset flow.
- Event, shop, rest, result, and boss systems are unchanged by tutorial work.

Manual playtest minimum:

1. start a fresh session,
2. play one combat node,
3. open and close the Tutorial Book,
4. skip tutorial and verify it stays skipped.

---

## 10. What Not To Do In The Tutorial Pass

Do not:

- rebalance units,
- change Command rewards,
- change curse effects,
- change boss mechanics,
- change map generation,
- add forced scripted combat,
- pause combat without a deliberate later design pass,
- add a long encyclopedia screen as the primary tutorial.
- add result/shop/rest/event/boss popups to the guided flow without a new review decision.

Those are separate design and balance tasks.

---

## 11. Recommended First Implementation Target

Start with the smallest useful slice:

```text
Opening monologue -> home tip -> map tip -> upgrades tip -> node detail tip -> combat command tip
```

This teaches the core loop without touching the riskiest combat timing logic.

After that works, add:

```text
army roles -> battle reading -> spell crisis -> Tutorial Book
```

This order keeps the project stable while building toward a complete onboarding experience.
