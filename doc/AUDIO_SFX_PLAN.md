# Audio / Music / SFX Plan

Status: **planning doc** — catalog + architecture for the upcoming `AudioManager`
(music, SFX, ambience). Implementation will follow this doc step by step, phase
by phase. Nothing here is wired up yet.

## 1. Current state

- [src/systems/SoundManager.js](../src/systems/SoundManager.js) exists but only
  handles **ad-break muting** (`setExternalMuted` / `isExternalMuted`), used by
  `ads/adapters/CrazyGamesAdapter.js` and `PlaygamaAdapter.js`. This stays — the
  new AudioManager must respect `SoundManager.isExternalMuted()`.
- [src/mocks/screens/MusicMock.jsx](../src/mocks/screens/MusicMock.jsx) is a
  **procedural Web Audio "music engine"** — 9 tracks (Taiko/Koto/Shakuhachi
  synths), no MP3s. This is the "mob/music engine" referenced for track numbers:
  - TRACK 1: Ambient Menu (60 BPM)
  - TRACK 2: Battle March (120 BPM)
  - TRACK 3: Boss Encounter (90 BPM)
  - TRACK 4: Cavalry Charge — Aggressive (160 BPM)
  - TRACK 5: Oni's Rage — Heavy Metal Taiko (140 BPM)
  - TRACK 6: Heroic Strike — Upbeat Victory (150 BPM)
  - TRACK 7: Warlord's Approach (30 BPM Heavy)
  - TRACK 8: Steady Advance — Enhanced Harmony & Melody (60 BPM)
  - TRACK 9: Distant Battlefield — War Background (80 BPM)
- Asset folders already scaffolded (currently just `.gitkeep`):
  `public/assets/music/`, `public/assets/sfx/{ambient,combat,ui}/`.

## 2. Music track assignment (as requested)

| Slot | Track | Role | Trigger |
|---|---|---|---|
| **Track 7** — *Warlord's Approach* | Menu / Start Screen loop | Plays on `HomeScreen` and `MAP_SCREEN` (idle/menu state) |
| **Track 8** — *Steady Advance* | Battle / Combat loop | Plays when `gameState` becomes `COMBAT` (battle starts) |
| **Track 9** — *Distant Battlefield* | Chapter-boss battle theme | Takes over (loops) when the chapter boss fight begins (`WAVE_CHANGED` → `BOSS_PHASE`, i.e. the boss node's final phase / `CaveSystem` boss "APPEARS"), replacing Track 8 for the duration of the boss fight. A separate per-wave `enemy_alert` **SFX** still fires on each `SPAWNING`. |

Tracks 1–6 remain available as a future pool (victory fanfare, boss themes,
rage/low-HP variants, etc.) — not required for this phase but the AudioManager
should be built generically enough to add them later without rework.

**Open question:** should these 9 tracks stay **procedural** (AudioManager
reuses the Web Audio synthesis code straight from `MusicMock.jsx` — zero asset
files, instant, but CPU-driven and less "produced") or should they be **rendered
to MP3** and dropped into `public/assets/music/` (`track_07_menu.mp3`,
`track_08_battle.mp3`, `track_09_enemy_alert.mp3`)? Architecture differs
significantly (Web Audio scheduler vs. `<audio>`/buffer playback + looping +
crossfade). Recommendation: keep the procedural engine as the **Phase 1
fallback** (it already works, zero asset risk) and make the loader pluggable so
real MP3s can drop in later and take priority if present.

## 3. SFX catalog

Naming convention: lowercase `snake_case`, **singular** nouns (no trailing "s"
pluralization — `sword_hit.mp3` not `sword_hits.mp3`), `.mp3`. Folder layout:

```
public/assets/sfx/
  combat/   — weapon swings, impacts, projectiles, deaths
  spell/    — Onmyoji Shrine + Tactical Command abilities
  ambient/  — cave hazards, drones, reinforcement horns
  ui/       — menus, purchases, upgrades, transitions
```

### 3.1 Combat — melee / sword

| File | Trigger | Source |
|---|---|---|
| `sword_swing.mp3` | Melee unit lands an attack (`unit.swingPhase = 1.0`) | [CombatSystem.js:252](../src/systems/CombatSystem.js#L252) |
| `sword_hit.mp3` | Melee impact landing (pairs with slash/spark FX) | [CombatSystem.js:22-31](../src/systems/CombatSystem.js#L22) `emitMeleeImpact` |
| `cavalry_charge_impact.mp3` | Cavalry charge shove (heavy, `chargeTimer > 0`) | [CombatSystem.js:271-277](../src/systems/CombatSystem.js#L271) |
| `shield_block.mp3` | Cavalry hits a `shield`/`boss` unit (no shove) | [CombatSystem.js:266-269](../src/systems/CombatSystem.js#L266) |
| `ikki_kamikaze.mp3` | Ikki Rebel suicide-hit (instant self-destruct) | [CombatSystem.js:230-236](../src/systems/CombatSystem.js#L230) |

### 3.2 Combat — ranged / arrow / siege

| File | Trigger | Source |
|---|---|---|
| `arrow_release.mp3` | Yumi Archer / Arrow Tower fires | [CombatSystem.js:241-246](../src/systems/CombatSystem.js#L241), [:294-302](../src/systems/CombatSystem.js#L294) |
| `arrow_impact.mp3` | Arrow projectile hits a unit | [ProjectileSystem.js:74-84](../src/systems/ProjectileSystem.js#L74) |
| `arrow_impact_fire.mp3` | Flaming arrow hit (FLAMING_ARROWS provision) | [ProjectileSystem.js:79-87](../src/systems/ProjectileSystem.js#L79) |
| `siege_launch.mp3` | Horoku Siege lobs a bomb | [CombatSystem.js:248](../src/systems/CombatSystem.js#L248) |
| `siege_impact.mp3` | Lobbed projectile lands | [ProjectileSystem.js:21-31](../src/systems/ProjectileSystem.js#L21) |
| `orb_hit.mp3` | Projectile/lob damages the cave orb | [ProjectileSystem.js:33-34,57-64](../src/systems/ProjectileSystem.js#L33) |

### 3.3 Combat — parry / defense / status

| File | Trigger | Source |
|---|---|---|
| `parry_cripple.mp3` | Shinobi cripples Bamboo Barricade ("CRIPPLED") | [CombatSystem.js:254-259](../src/systems/CombatSystem.js#L254) |
| `reflect_hit.mp3` | SPIKED_CALTROPS reflects damage ("REFLECT") | [CombatSystem.js:260-264](../src/systems/CombatSystem.js#L260) |
| `burn_tick.mp3` (optional, looped/low-priority) | Burning unit takes DOT | [CombatSystem.js:59](../src/systems/CombatSystem.js#L59) |

### 3.4 Death / defeat

| File | Trigger | Source |
|---|---|---|
| `unit_death.mp3` | Any unit dies (regular) | [RewardSystem.js:80](../src/systems/RewardSystem.js#L80) `UNIT_DIED` |
| `elite_death.mp3` | Elite enemy dies | [RewardSystem.js:39-51](../src/systems/RewardSystem.js#L39) `ELITE_KILLED` |
| `boss_death.mp3` | Chapter boss dies | [RewardSystem.js:25-28](../src/systems/RewardSystem.js#L25) `isChapterBoss` |
| `gameover_stinger.mp3` | Wall breached → `GAMEOVER` | [CombatSystem.js:321-324](../src/systems/CombatSystem.js#L321) |

### 3.5 Boss / wave events ("enemy comes")

| File | Trigger | Source |
|---|---|---|
| `enemy_alert.mp3` | New wave begins spawning (Track 9 stinger candidate) | [WaveSystem.js:148-166](../src/systems/WaveSystem.js#L148) `WAVE_CHANGED` |
| `boss_appear.mp3` | Chapter boss "APPEARS" + screen shake | [CaveSystem.js](../src/systems/CaveSystem.js) `ensureVisibleBoss` |
| `boss_telegraph.mp3` | Boss telegraphs a heavy attack | [CombatSystem.js:82-91](../src/systems/CombatSystem.js#L82) |
| `reinforcement_horn.mp3` | Boss-phase reinforcement wave streams in (WIP feature) | [CaveSystem.js](../src/systems/CaveSystem.js) `tickBossReinforcements` (uncommitted) |
| `region_victory_fanfare.mp3` | Node/region cleared → `REGION_VICTORY` | [WaveSystem.js:211](../src/systems/WaveSystem.js#L211), [CaveSystem.js](../src/systems/CaveSystem.js) |
| `campaign_victory_fanfare.mp3` | Final chapter cleared → `CAMPAIGN_OVER` | [App.jsx:378](../src/App.jsx#L378) |

### 3.6 Spells & special abilities (Onmyoji Shrine + Tactical Command)

| File | Trigger | Source |
|---|---|---|
| `thunder_cast.mp3` | Lightning Shower cast (cost paid) | [SpellSystem.js:78-100](../src/systems/SpellSystem.js#L78) `triggerThunder` |
| `lightning_strike.mp3` | Each of the 8 staggered bolt impacts | [SpellSystem.js:87-94](../src/systems/SpellSystem.js#L87) (per `strikeDelay`) |
| `foxfire_cast.mp3` | Fox Fire cast | [SpellSystem.js:102-112](../src/systems/SpellSystem.js#L102) `triggerFoxFire` |
| `foxfire_burn_loop.mp3` (looped while active) | Fox Fire wall burning enemies | [SpellSystem.js:12-32](../src/systems/SpellSystem.js#L12) `tickFoxFires` |
| `dragonwave_cast.mp3` | Dragon Wave cast | [SpellSystem.js:114-125](../src/systems/SpellSystem.js#L114) `triggerDragonWave` |
| `dragonwave_impact.mp3` | Dragon wave damages enemies in its path | [SpellSystem.js:39-53](../src/systems/SpellSystem.js#L39) `tickDragonWaves` |
| `wardrums_activate.mp3` | War Drums buff activated | [SpellSystem.js:127-135](../src/systems/SpellSystem.js#L127) `triggerWarDrums` |
| `harvest_activate.mp3` | Bountiful Harvest activated | [SpellSystem.js:137-145](../src/systems/SpellSystem.js#L137) `triggerHarvest` |
| `resolve_heal.mp3` | Shogun's Resolve heals Hatamoto/Barricade | [SpellSystem.js:147-166](../src/systems/SpellSystem.js#L147) `triggerResolve` |
| `hero_unlock.mp3` | Champion hero unlocked (500K) | [SpellShrine.jsx:10-20](../src/ui/panels/SpellShrine.jsx#L10) |

### 3.7 Ambient / cave hazards

| File | Trigger | Source |
|---|---|---|
| `mine_explode.mp3` | Goki mine hazard detonates | [CaveSystem.js](../src/systems/CaveSystem.js) `GOKI_MINE_INTERVAL` |
| `fire_burst.mp3` | Kasha fire hazard burst | [CaveSystem.js](../src/systems/CaveSystem.js) `KASHA_FIRE_INTERVAL` |
| `cave_drone_loop.mp3` (looped) | Ambient bed during boss/cave phase | [CaveSystem.js](../src/systems/CaveSystem.js) `tickVisibleBossPhase` |

### 3.8 UI — menus, buttons, purchases, power-ups, upgrades

| File | Trigger | Source |
|---|---|---|
| `ui_click.mp3` | Generic button press (Home, Result screens, modals) | [HomeScreen.jsx](../src/ui/screens/HomeScreen.jsx), [ResultScreens.jsx](../src/ui/screens/ResultScreens.jsx) |
| `ui_hover.mp3` (optional, throttled) | Hover on spell/tactical buttons w/ tooltips | [SpellShrine.jsx](../src/ui/panels/SpellShrine.jsx), [TacticalCommand.jsx](../src/ui/panels/TacticalCommand.jsx) |
| `purchase_success.mp3` | Affordable upgrade/purchase confirmed | [BarracksCard.jsx:60-70](../src/ui/panels/BarracksCard.jsx#L60) `upgradeTroopLevel` / `upgradeBarracksCap`, `ShopModal.jsx` |
| `purchase_deny.mp3` | Click on disabled/unaffordable button | Same buttons, `disabled` branch |
| `barracks_build.mp3` | New barracks built/unlocked | `buildBarracks` |
| `level_up.mp3` | Troop level or squad cap upgraded | [BarracksCard.jsx:60-70](../src/ui/panels/BarracksCard.jsx#L60) |
| `node_select.mp3` | Map node selected on conquest map | `MapArea.jsx` |
| `chapter_select.mp3` | Chapter chosen on Home screen | [HomeScreen.jsx:21-26](../src/ui/screens/HomeScreen.jsx#L21) |
| `screen_transition.mp3` | Modal open/close, screen swap (Shop/Rest/Event modals) | `ShopModal.jsx`, `RestModal.jsx`, `EventModal.jsx` |

## 4. AudioManager architecture

Extend [src/systems/SoundManager.js](../src/systems/SoundManager.js) (keep the
existing export name/singleton — ad adapters already import it) rather than
creating a parallel system.

**Core responsibilities:**
- Single shared `AudioContext`, created lazily on first user gesture (autoplay
  policy).
- **Music sub-engine**: `playMusic(trackId, { loop, fadeMs })`,
  `crossfadeTo(trackId, fadeMs)`, `stopMusic(fadeMs)`. Phase 1 backs onto the
  procedural composer ported from `MusicMock.jsx`; pluggable so an MP3-backed
  loader can override per track later.
- **SFX sub-engine**: `playSfx(id, { volume, pitch, pan })` via pooled
  `AudioBufferSourceNode`s; per-id concurrency cap to avoid spam (e.g. 20 arrow
  impacts in one frame → max 3-4 voices).
- **Mute/volume**: master/music/sfx gain nodes; honors
  `SoundManager.isExternalMuted()` (ad breaks) by zeroing the master gain;
  master/music/sfx levels persisted via `useMeta`.
- **Event wiring**: a thin module (e.g. `src/systems/AudioEvents.js`)
  subscribes to `bus` (`UNIT_DIED`, `ELITE_KILLED`, `WAVE_CHANGED`,
  `GAME_STATE_CHANGED`, `SCREEN_SHAKE`) and maps them to SFX/music
  transitions — keeping systems decoupled per the existing
  event-bus convention. High-frequency combat/spell SFX (melee hits, arrow
  impacts, spell casts) are called directly from
  `CombatSystem`/`ProjectileSystem`/`SpellSystem` at the same sites as their
  existing `pushFx`/`bumpShake` calls.

## 5. Phased implementation plan

1. **Phase 1 — Core engine**: `SoundManager` gains AudioContext, gain graph,
   mute/volume persistence, `playMusic`/`playSfx`/`stopMusic` API, procedural
   music ported from `MusicMock.jsx` (tracks 7/8/9 wired, others available).
2. **Phase 2 — Music transitions**: wire Track 7 (menu/`MAP_SCREEN`/Home),
   Track 8 (`COMBAT` start), Track 9 (chapter-boss theme on `WAVE_CHANGED` →
   `BOSS_PHASE`) via `GAME_STATE_CHANGED` / `WAVE_CHANGED`.
3. **Phase 3 — Combat SFX**: melee/ranged/siege/death sounds in
   `CombatSystem`, `ProjectileSystem`, `RewardSystem`.
4. **Phase 4 — Spell SFX**: Thunder/Fox Fire/Dragon Wave/War Drums/Harvest/
   Resolve in `SpellSystem` + hero unlock.
5. **Phase 5 — UI SFX**: Home, BarracksCard, SpellShrine, TacticalCommand,
   ResultScreens, Shop/Rest/Event modals, map nodes.
6. **Phase 6 — Ambient/polish**: cave hazard loops, reinforcement horn (ties
   into the in-progress boss-reinforcement work in `CaveSystem.js`), voice
   pooling/throttle tuning, mobile autoplay unlock.

## 6. Open decisions before Phase 1

- **Music asset source**: procedural (port `MusicMock.jsx` synths — no files
  needed) vs. MP3 files dropped into `public/assets/music/`? Recommendation:
  start procedural, make MP3 override pluggable.
- **SFX asset source**: will MP3s be supplied/placed into
  `public/assets/sfx/**` per the filenames above, or should SFX also be
  synthesized procedurally (consistent with the music engine, zero asset
  size)?
