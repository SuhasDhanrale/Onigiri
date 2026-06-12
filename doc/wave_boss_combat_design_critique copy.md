# Wave, Boss, And Combat Design Critique

**Date:** June 12, 2026  
**Scope:** Node waves, chapter bosses, mock boss powers, combat pacing, and retention design  
**Mode:** Design analysis only. No code changes.

---

## 1. Executive Summary

The game has the right ingredients for a strong roguelite tower-defense loop:

- a random map,
- node rewards,
- wave-based combat,
- chapter progression,
- five visually distinct chapter bosses,
- boss powers with clear themes,
- permanent campaign rewards,
- run-based buffs, curses, shops, and rest nodes.

But the current combat/wave design is still too flat for that structure.

Right now, most combat is still "waves of enemies arrive until the node ends." That works as a foundation, but it does not yet fully support what the map and boss roster are promising. The map says each node has identity. The boss mock says each chapter has a demon with a strong rule-breaking power. The combat system mostly delivers numeric scaling and enemy composition, not enough tactical pattern variety.

The best direction is:

```text
Each chapter teaches one pressure.
Each node remixes that pressure.
Each boss tests mastery of that pressure.
The final boss combines all previous pressures.
```

That is the structure used by many successful retention-heavy games: introduce, vary, escalate, then test.

---

## 2. Current State

### 2.1 Chapter Structure

Current campaign chapters:

| Chapter | Current Reward | Current Theme Signal |
|---|---|---|
| Sakura Riverlands | Command Drops +20% | Early economy / low threat |
| Kyoto Outskirts | +1 Max Squad Cap | Core army growth |
| Tengu Peaks | Archers +50% DMG | Flying/ranged pressure |
| Kurogane Mines | Hatamoto +50% HP | Heavy frontline pressure |
| Yomi Abyss | Campaign Victory | Final demonic threat |

### 2.2 Boss Mock Roster

From the mock screens:

| Boss | Title | Theme | Mock Power |
|---|---|---|---|
| Goki | The Mud Golem | Earth / Explosives | Detonation Mines |
| Kasha | The Ashen Weaver | Fire / Speed | Fireballs & Trails |
| Daitengu | The Howling Tempest | Storm / Lightning | Lightning Strikes |
| Yuki-Onna | The Glacial Maiden | Ice / Freeze | Deep Freeze |
| Otakemaru | The Calamity of Yomi | Void / Master of Elements | Eclipse & Elemental Chaos |

These are strong concepts. They are readable, visual, and mechanically distinct. The problem is that the live wave/combat design has not fully caught up to them.

---

## 3. What Is Good

### 3.1 The Boss Fantasy Is Strong

The five bosses already have clear player-facing fantasies:

- Goki is slow, heavy, and terrain-denial focused.
- Kasha is fast, erratic, and fire-zone focused.
- Daitengu is airborne/storm themed.
- Yuki-Onna is control/freeze themed.
- Otakemaru is the final exam, combining previous powers.

This is good because bosses are not just stat blocks. They imply different behavior. That is the right direction.

Real-world comparison:

- **Hades** works because bosses do not just have more HP. Megaera, Lernie, Theseus/Asterius, and Hades each ask for different movement and timing skills.
- **Slay the Spire** works because bosses change your deck priorities. Hexaghost punishes slow setup, Slime Boss punishes poor burst timing, The Guardian tests stance timing and block planning.

For this game, each boss should change what the player values in their army and spells.

### 3.2 The Map Can Support Meaningful Preparation

Because this is not a pure arcade wave game, the player has time to make strategic decisions before combat:

- choose a node,
- buy shop buffs,
- rest,
- accept curses,
- pick route rewards,
- build an army composition.

That makes bosses more valuable. If a player knows the next chapter boss is Kasha, a fire/speed boss, they can make preparation decisions before the boss fight.

Real-world comparison:

- **Darkest Dungeon** is compelling because dungeon threats influence party choice, provisions, and risk appetite.
- **Into the Breach** is compelling because enemies telegraph intent and the player prepares around visible threats.

Your map can become a strategic preparation layer, not just a level select.

### 3.3 Wave-Based Combat Fits The Genre

The current wave system is the right backbone. Tower defense needs time pressure, escalating enemy density, and moments of relief.

The existing structure already has:

- pre-wave preparation,
- spawning,
- cleanup,
- boss phase,
- reformation pauses every few waves.

That is a solid skeleton. It just needs stronger encounter design.

Real-world comparison:

- **Plants vs. Zombies** uses simple waves extremely well because each wave introduces recognizable enemy pressure.
- **Bloons TD** works because round composition matters: grouped bloons, camo, lead, MOABs, regrow, etc. The round identity is as important as the raw count.

Your current waves have count escalation, but they need more authored identity.

---

## 4. What Is Bad

### 4.1 Nodes Do Not Yet Feel Distinct Enough

The map has node variants like:

- Ambush,
- Patrol Route,
- Forward Garrison,
- Merchant Caravan,
- Peasant Swarm,
- Night Raid,
- Fortress Gate.

These names imply very different fights. But if the combat mostly varies by wave count, reward, and a few extra enemy types, the player will eventually feel the difference is cosmetic.

This is bad for retention because the player should think:

```text
I chose Caravan because I need money.
I chose Garrison because I can handle defenses.
I avoided Night Raid because my build is weak to surprise pressure.
```

Not:

```text
This is another wave fight with a different label.
```

### 4.2 Bosses Are Not Yet Chapter Final Exams

The mock bosses imply chapter-specific powers, but the live boss flow is still mostly:

```text
clear waves -> destroy cave/orb -> win
```

That can work for a generic demon cave, but it does not yet support five unique chapter bosses.

If every chapter ends with the same cave/orb interaction, the campaign loses escalation. The player sees different chapter names, but the actual combat grammar remains the same.

Real-world comparison:

- **Hades** would be much weaker if every boss was just "fight a large enemy in an arena."
- **Bloons TD** bosses work because each boss has a specific economic or tactical demand.
- **Plants vs. Zombies** boss fights work when they remix the lane/wave rules, not just add HP.

### 4.3 Specials Are Labels, Not Rules

Current node config has specials like:

- `low_visibility`,
- `timed_bonus`,
- `enemies_behind_barricades`,
- `extra_command_drops`,
- `dodge_50_arrows`,
- `target_buildings`,
- `summon_reinforcements`,
- `self_heal`,
- `duel_challenge`.

These are good ideas, but most are not real rules yet.

This is dangerous because a special label creates a design promise. If the UI or config says "Night Raid," the player expects darkness, surprise, or visibility pressure. If it plays like a normal fight, the fantasy collapses.

### 4.4 Enemy Roles Are Too Few For Long-Term Variety

Current enemy roles:

- Rebel: basic melee.
- Tengu: flying.
- Onmyoji: support/healer.
- Shinobi: assassin.
- Oni: mini boss.

That is enough for a prototype, but not enough to carry five chapters plus elites plus bosses.

The enemy roster needs more "problem shapes":

- shield bearer,
- fast runner,
- siege unit,
- summoner,
- bomber,
- aura buffer,
- ranged harasser,
- burrower/ambusher,
- curse carrier,
- boss minion.

Real-world comparison:

- **Plants vs. Zombies** succeeds because Conehead, Buckethead, Pole Vaulting Zombie, Balloon Zombie, Digger Zombie, and Football Zombie are not just different stats. They attack the player's setup differently.
- **Bloons TD** succeeds because camo, lead, ceramic, fortified, and MOAB layers force different tower answers.

This game needs enemy roles that force different player answers.

---

## 5. What Is Ugly

### 5.1 The Current Design Risks Becoming Pure Stat Inflation

If later chapters mostly increase:

- enemy HP,
- enemy damage,
- wave count,
- enemy quantity,

then the game will feel like a spreadsheet climb. Players burn out when progression becomes "same fight, bigger numbers."

Retention-heavy games need qualitative escalation, not only numeric escalation.

Bad pattern:

```text
Chapter 1: Rebels with 1x HP
Chapter 2: Rebels with 1.25x HP
Chapter 3: Rebels with 1.5x HP
Chapter 4: Rebels with 1.75x HP
Chapter 5: Rebels with 2x HP
```

Better pattern:

```text
Chapter 1: Learn lane control and economy.
Chapter 2: Learn speed and flanking.
Chapter 3: Learn anti-air and ranged timing.
Chapter 4: Learn control resistance and frontline durability.
Chapter 5: Fight combinations of all prior lessons.
```

### 5.2 Boss Powers Could Become Unfair Without Telegraphs

The mock boss powers are strong:

- mines,
- fire trails,
- lightning,
- freeze,
- deployment lockout,
- cycling powers.

These can be excellent. They can also become frustrating if they happen without warning.

Player psychology rule:

```text
Punishment is acceptable when the warning was clear.
Punishment feels unfair when the warning was invisible.
```

Real-world comparison:

- **Hades** bosses telegraph attacks clearly. The player may fail, but they understand why.
- **Into the Breach** shows enemy intentions before the player acts, making harsh outcomes feel fair.

Every boss power here needs a readable wind-up:

- ground marker,
- sound cue,
- animation pose,
- countdown,
- UI text,
- color-coded effect zone.

### 5.3 The Final Boss Could Become Noise

Otakemaru's concept is "cycles through the powers of the previous 4 bosses." That is a good final boss concept, but it can easily become visual and mechanical noise.

The final boss should not randomly spam everything. It should use structured phases:

1. Goki phase: mines and area denial.
2. Kasha phase: fire trails and movement pressure.
3. Daitengu phase: lightning and anti-clump pressure.
4. Yuki-Onna phase: freeze and tempo control.
5. Eclipse phase: short combined patterns.

The player should feel:

```text
I recognize this. I learned this before.
```

Not:

```text
Everything is happening and I cannot read the battlefield.
```

---

## 6. Recommended Chapter Combat Structure

### Chapter 1: Sakura Riverlands / Goki

**Design goal:** Teach space control and slow hazard awareness.

Boss fantasy:

- Goki is slow and durable.
- Throws mud mines.
- Mines slow and damage clustered units.

Wave identity:

- mostly rebels,
- occasional shield/heavy units later,
- low speed,
- high density.

What the player learns:

- do not over-clump,
- use ranged units to soften slow threats,
- use spells to clear dense packs,
- value command economy.

Good node specials:

- Peasant Swarm,
- Bandit Camp,
- Caravan.

Boss test:

- Can the player handle area denial while maintaining a frontline?

### Chapter 2: Kyoto Outskirts / Kasha

**Design goal:** Teach speed, flanking, and defensive flexibility.

Boss fantasy:

- Kasha moves in arcs.
- Leaves fire trails.
- Throws fireballs at structures.

Wave identity:

- faster enemies,
- more Shinobi,
- enemies that punish static defense,
- fire zones that force repositioning or timing.

What the player learns:

- do not rely only on one fixed choke point,
- cavalry/patrol and fast response matter,
- structures can be pressured,
- spells should interrupt dangerous movement.

Good node specials:

- Ambush,
- Patrol Route,
- Night Raid.

Boss test:

- Can the player protect multiple weak points while fire zones disrupt the normal defense line?

### Chapter 3: Tengu Peaks / Daitengu

**Design goal:** Teach anti-air, anti-clump, and projectile reliability.

Boss fantasy:

- Daitengu flies.
- Dodges some projectile pressure.
- Calls lightning on clustered units.

Wave identity:

- more Tengu,
- mixed air and ground waves,
- lightning punishers,
- enemies that bypass ground traps.

What the player learns:

- archers matter,
- clustering is dangerous,
- anti-air cannot be optional,
- spread formation has value.

Good node specials:

- Tengu Master,
- Night Raid,
- Patrol Route.

Boss test:

- Can the player maintain anti-air damage without clumping into lightning strikes?

### Chapter 4: Kurogane Mines / Yuki-Onna

**Design goal:** Teach tempo control and resistance to crowd control.

Boss fantasy:

- Yuki-Onna chills nearby units.
- Deep Freeze disables movement and attacks.
- Slow, oppressive fight.

Wave identity:

- fewer but stronger enemies,
- Onmyoji support,
- armored heavies,
- freeze/chill fields.

What the player learns:

- overreliance on one unit group is risky,
- cooldown timing matters,
- frontline durability matters,
- reserve units can recover a frozen lane.

Good node specials:

- Fortress Gate,
- Onmyoji Ritual,
- Yamabushi.

Boss test:

- Can the player survive tempo loss and recover after freezes?

### Chapter 5: Yomi Abyss / Otakemaru

**Design goal:** Final exam.

Boss fantasy:

- immune to crowd control,
- cycles prior boss powers,
- disables new deployments during Eclipse.

Wave identity:

- mixed elite squads,
- prior chapter mechanics return,
- short high-pressure waves,
- fewer filler enemies.

What the player learns:

- everything from prior chapters must be applied,
- reserves matter,
- build diversity matters,
- timing and recognition matter.

Boss test:

- Can the player recognize and answer every previous mechanic under pressure?

---

## 7. Better Wave Design Model

The current wave model should evolve from pure escalation to "encounter sentences."

Each wave should have a purpose:

| Wave Type | Purpose | Example |
|---|---|---|
| Scout Wave | Introduce enemy type | Small Tengu group appears |
| Pressure Wave | Test basic answer | Rebels plus two Shinobi |
| Combo Wave | Combine threats | Tengu over rebels while Onmyoji heals |
| Economy Wave | Reward efficient clearing | Weak swarm, high command drops |
| Punish Wave | Attack common strategy | Lightning against clumped units |
| Boss Setup Wave | Teaches boss mechanic | Mines appear before Goki uses many |
| Final Wave | Mastery check | Full mechanic combination |

This structure is stronger than "wave number increases budget."

### Recommended Pattern Per Node

For ordinary combat nodes:

```text
Wave 1: Teach
Wave 2: Pressure
Wave 3: Reward or twist
```

For elite nodes:

```text
Wave 1: Signature enemy
Wave 2: Signature combo
Wave 3: Elite mechanic test
```

For boss nodes:

```text
Wave 1-2: Chapter enemies
Wave 3-4: Boss mechanic preview
Wave 5: Strong combo
Boss phase: Full boss pattern
```

---

## 8. How Real Games Solve This

### Plants vs. Zombies

PvZ rarely wins by raw difficulty. It wins by enemy clarity.

Every new zombie asks a clear question:

- Can you break armor?
- Can you hit flying units?
- Can you stop a lane jumper?
- Can you handle a digger behind your line?

Lesson for this game:

Every new enemy or boss power should ask a clear question of the player's army.

### Bloons TD

Bloons TD is a masterclass in wave composition.

The game does not just increase bloon count. It introduces properties:

- camo,
- lead,
- regrow,
- ceramic,
- MOAB-class layers.

Lesson for this game:

Enemies need properties that demand counters. Tengu should require anti-air. Goki mines should require spacing. Yuki-Onna freeze should require reserves or cleanse.

### Hades

Hades bosses work because they are readable but intense.

The bosses become difficult through:

- telegraphs,
- phase changes,
- arena pressure,
- pattern combinations.

Lesson for this game:

Boss powers must have clear wind-ups and phases. The player should lose because they misread or mistimed, not because the screen became unreadable.

### Slay the Spire

Slay the Spire bosses test deck identity.

The map lets the player prepare, but the boss asks:

- Do you have scaling?
- Do you have burst?
- Do you have block?
- Can you handle status cards?

Lesson for this game:

Chapter bosses should test build identity. Goki tests spacing and sustained damage. Kasha tests flexible defense. Daitengu tests anti-air. Yuki-Onna tests recovery from control. Otakemaru tests total build completeness.

### Into the Breach

Into the Breach is harsh but fair because the player can read enemy intent.

Lesson for this game:

Boss powers should show intent before impact. If Kasha throws fireballs, mark the target building. If Daitengu calls lightning, show the strike circle. If Yuki-Onna freezes, show the frost cone.

---

## 9. What Should Be Built Next

### Priority 1: Chapter Boss Contract

Create a real design contract for each chapter boss:

- boss ID,
- chapter ID,
- core power,
- passive aura,
- active attack,
- phase thresholds,
- telegraph color,
- counterplay,
- reward.

This should exist before coding more boss mechanics.

### Priority 2: Wave Archetypes

Instead of generating all waves from one generic budget, define wave archetypes:

- swarm,
- ambush,
- flying,
- support,
- heavy,
- mixed,
- boss-preview.

Then nodes pick archetypes based on their variant and chapter.

### Priority 3: Mechanic Preview Before Boss

Each chapter should preview boss mechanics in normal nodes.

Examples:

- Before Goki, show small mud mines in a combat node.
- Before Kasha, show small fire trails in an elite node.
- Before Daitengu, show a weak lightning strike warning.
- Before Yuki-Onna, show chill zones.
- Before Otakemaru, remix all prior mechanics.

This makes bosses feel fair.

### Priority 4: Add Missing Enemy Roles

Needed enemies:

- Mud Bomber / Mine Carrier,
- Fire Runner,
- Storm Caller,
- Frost Monk,
- Shield Bearer,
- Ronin Duelist,
- Demon Summoner.

Do not add them all at once. Add them when a chapter needs them.

### Priority 5: Result Feedback

After a boss, the result screen should say what the player overcame:

```text
Goki Defeated
Mines avoided: 8
Units slowed: 12
Chapter Reward: Command Drops +20%
```

This makes the boss feel like an achievement, not just a larger encounter.

---

## 10. Final Recommendation

The current system is not bad. It is a good skeleton. The ugly risk is that it may become a generic wave escalator with beautiful boss art sitting on top.

The fix is to make each chapter mechanically teach and test a unique combat pressure.

Recommended design spine:

```text
Goki: area denial and spacing.
Kasha: speed, fire, and structure pressure.
Daitengu: anti-air and anti-clump.
Yuki-Onna: freeze, tempo loss, and recovery.
Otakemaru: final exam using all prior mechanics.
```

If the waves teach those mechanics and the bosses test them, the campaign will feel coherent. If waves remain mostly generic, the bosses will feel disconnected from the map and chapter structure.

The next serious design step should not be more numeric balancing. It should be building a chapter mechanic matrix: chapter theme, enemy roles, node specials, boss powers, counterplay, and rewards all aligned.
