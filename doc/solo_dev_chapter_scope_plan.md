# Solo Dev Chapter Scope Plan

**Date:** June 12, 2026  
**Goal:** Scope the boss/wave/chapter design for a solo developer building a web game.

---

## 1. Core Decision

Do not build all five chapters now.

The right scope is:

```text
Build 2 excellent chapters.
Add a third only if the first two feel strong.
Leave chapters 4-5 as future expansion.
```

For a web game, the first target is not a huge campaign. The target is a tight, replayable slice that proves:

- players understand the map,
- combat feels good,
- rewards feel trustworthy,
- bosses feel distinct,
- people want another run.

If players like that, more chapters become justified. If they do not, five chapters only means five times the balancing work.

---

## 2. Recommended MVP Scope

### MVP Campaign

| Scope | Recommendation |
|---|---|
| Chapters | 2 full chapters |
| Optional Stretch | 3rd chapter |
| Bosses | 2 unique bosses, 1 optional |
| Enemy Types | Existing enemies plus 1-2 new lightweight variants max |
| Node Types | Keep existing map nodes |
| Special Mechanics | 1 chapter mechanic per chapter |
| Runtime Target | 15-25 minutes per successful run |
| Platform | Browser-first, fast load, low friction |

### Why 2 Chapters First

Two chapters are enough to prove the structure:

1. Chapter 1 teaches the base game.
2. Chapter 2 proves the game can change its pressure and stay interesting.

A third chapter is useful if you want a stronger demo, but it is also where scope starts multiplying:

- more boss logic,
- more enemy composition,
- more balance,
- more UI explanation,
- more QA.

For a solo developer, 2 chapters polished beats 5 chapters thin.

---

## 3. What To Cut For Now

Cut these from the first public web version:

- all five bosses,
- full unique mechanics for every node special,
- complex boss phase systems,
- new enemy art for every mechanic,
- advanced seeded wave authoring,
- bespoke post-combat blessing choice flow,
- deep late-game meta economy,
- chapter 4-5 balance.

Keep the designs in docs, but do not build them yet.

The web game needs a strong first impression more than a complete content roadmap.

---

## 4. Chapter Selection

### Recommended Chapter 1: Sakura Riverlands / Goki

This should be the onboarding chapter.

Why Goki first:

- slow boss is easier to read,
- mines are easy to telegraph,
- teaches spacing without requiring fast reactions,
- works with existing melee/ranged combat,
- forgiving for new players.

Core mechanic:

```text
Mud Mines
```

Simple implementation target:

- warning circle appears on ground,
- after delay, mine arms,
- if a player unit enters, it explodes,
- explosion deals area damage and slow,
- player learns not to over-clump.

No need for complex boss AI yet. Goki can be a slow boss/cave phase with periodic mine drops.

### Recommended Chapter 2: Kyoto Outskirts / Kasha

This should be the first "the game changes" chapter.

Why Kasha second:

- high contrast with Goki,
- faster and more aggressive,
- fire trails are visually exciting,
- structure pressure makes defense less static,
- good for web-game spectacle.

Core mechanic:

```text
Fire Trails
```

Simple implementation target:

- Kasha or special enemies leave fire zones,
- fire zones damage units over time,
- zones expire quickly,
- player must manage frontline disruption.

Avoid complex erratic pathing initially. You can fake the fantasy with fire zones and faster waves.

### Optional Chapter 3: Tengu Peaks / Daitengu

Add only if chapters 1-2 feel good.

Why Daitengu third:

- introduces anti-air pressure,
- uses existing Tengu enemy identity,
- lightning anti-clump is a natural escalation from Goki mines,
- gives archers a spotlight.

Core mechanic:

```text
Lightning Strikes
```

Simple implementation target:

- warning circle targets the largest cluster of player units,
- after delay, lightning damages and briefly stuns/slows,
- encourages spreading and mixed army composition.

This is a good third chapter because it reuses the lesson from Goki: do not clump. But it delivers it faster and more brutally.

---

## 5. Chapter Design Matrix

| Chapter | Boss | Player Lesson | Wave Identity | Boss Mechanic | Main Counterplay |
|---|---|---|---|---|---|
| 1 | Goki | Spacing and steady economy | Rebels, heavier density | Mud mines | Spread units, ranged damage, spell timing |
| 2 | Kasha | Flexible defense | Faster pressure, Shinobi | Fire trails | Recover lanes, avoid static clumps |
| 3 optional | Daitengu | Anti-air and anti-clump | Tengu + mixed ground | Lightning strikes | Archers, spread formation, timing |

This is enough variety for a first web release.

---

## 6. Node Scope For MVP

Do not make every node special unique yet.

Use this simpler rule:

```text
Each chapter has one chapter mechanic.
Some nodes preview it.
Boss fully tests it.
```

### Chapter 1 Node Use

| Node | MVP Behavior |
|---|---|
| Bandit Camp | Basic combat |
| Peasant Swarm | More rebels |
| Caravan | Easier fight, higher command reward |
| Garrison | Slightly tougher, higher honor |
| Elite | Mine preview plus stronger enemy |
| Boss | Goki mine fight |

### Chapter 2 Node Use

| Node | MVP Behavior |
|---|---|
| Ambush | Faster first wave |
| Patrol Route | Timed reward or faster enemies |
| Night Raid | Reduced preparation time, not full darkness yet |
| Shinobi Squad | More Shinobi |
| Elite | Fire-zone preview |
| Boss | Kasha fire trail fight |

### Optional Chapter 3 Node Use

| Node | MVP Behavior |
|---|---|
| Tengu Master | More flying enemies |
| Night Raid | Mixed air/ground pressure |
| Onmyoji Ritual | Support enemies protected by flyers |
| Elite | Lightning preview |
| Boss | Daitengu lightning fight |

This keeps node identity meaningful without building 15 different mechanics.

---

## 7. Boss Scope

### Boss Fight Structure

Keep boss fights simple:

```text
Wave warmup -> boss phase -> victory
```

Do not build multi-phase cinematic bosses yet.

Each boss needs only:

- one passive identity,
- one active power,
- one clear telegraph,
- one result screen callout.

### Goki MVP

Passive:

- slow and tanky.

Active:

- drops mud mines.

Telegraph:

- brown warning circle.

Counterplay:

- spread units,
- use ranged,
- clear enemies before mines fill the field.

### Kasha MVP

Passive:

- fast pressure.

Active:

- fire zones/trails.

Telegraph:

- red/orange streak before fire appears.

Counterplay:

- avoid overcommitting to one lane,
- rebuild frontline,
- use spells when fire splits the army.

### Daitengu Optional MVP

Passive:

- flying boss or flying wave pressure.

Active:

- lightning targets clusters.

Telegraph:

- blue circle and short delay.

Counterplay:

- archers,
- spread units,
- avoid static clumps.

---

## 8. Web Game Constraints

Because this is a web game, the design should prioritize:

- fast first load,
- clear controls,
- readable combat,
- short sessions,
- immediate reward feedback,
- low tutorial burden,
- no huge asset dependency,
- replayable randomness.

Avoid:

- long campaigns before payoff,
- too much text explanation,
- mechanics that require pixel-perfect control,
- bosses that need long animations before they are fun,
- large content systems that delay launch.

The first web version should feel complete in a small box.

---

## 9. Retention Targets

Measure whether the scope is working with simple goals:

| Metric | Target Signal |
|---|---|
| First combat completion | Player understands basic combat |
| First boss attempt | Player reaches Goki without quitting |
| Second run start | Player wants to try again |
| Chapter 2 reach | Player understands map/rewards |
| Kasha defeat rate | Chapter 2 is hard but fair |
| Average session | 10-25 minutes |

If players do not reach boss 1, improve onboarding and early pacing.

If players beat chapter 1 but quit in chapter 2, Kasha pressure may be unfair or the reward loop may be weak.

If players beat chapter 2 and restart, the game has a real loop.

---

## 10. Implementation Order

### Phase 1: Stabilize Current Loop

Goal:

```text
Map -> node -> waves -> reward -> next node
```

Must be clean before more content.

Checklist:

- reward contract works,
- result screen is clear,
- waves match node count,
- boss node completes reliably,
- no misleading reward text,
- no dead node specials shown as real mechanics.

### Phase 2: Chapter 1 Goki

Build:

- Goki boss identity,
- mud mine hazard,
- chapter 1 wave tuning,
- one elite/node mine preview,
- result feedback.

Do not build:

- five bosses,
- complex mine variants,
- many new enemies.

### Phase 3: Chapter 2 Kasha

Build:

- fire trail/fire zone hazard,
- faster wave identity,
- Kasha boss fight,
- one fire preview node,
- balance against chapter 1 rewards.

### Phase 4: Polish And Test

Before chapter 3:

- play 10-20 full runs,
- tune command/honor rewards,
- check if combat is readable,
- improve result screen clarity,
- check if players understand why they lost.

### Phase 5: Optional Daitengu

Only build if the first two chapters are fun.

Build:

- flying pressure,
- lightning anti-clump,
- Daitengu boss,
- archer-focused reward payoff.

---

## 11. Practical Solo Dev Rule

Every new mechanic must answer:

```text
Can I build this with existing systems in one focused pass?
Can the player understand it without a tutorial?
Can I show a clear warning before it hurts the player?
Does it make this chapter feel different?
```

If the answer is no, cut it or defer it.

---

## 12. Final Recommendation

Build this:

```text
Chapter 1: Goki / Mud Mines / spacing lesson
Chapter 2: Kasha / Fire Trails / flexible defense lesson
Optional Chapter 3: Daitengu / Lightning / anti-air and anti-clump lesson
```

Do not build this yet:

```text
Yuki-Onna
Otakemaru
full special-node system
five fully unique boss phases
large enemy roster expansion
```

The best solo-dev path is not a smaller version of the full game. It is a polished vertical slice that makes players believe the full game is worth wanting.
