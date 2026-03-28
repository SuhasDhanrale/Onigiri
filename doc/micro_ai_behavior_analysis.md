# Micro-Engagement Architecture: 1v1 and Structural Encounters

**Subject:** Rules of Engagement, Hard Counters, and Micro-AI Architectures

While macro-horde logic dictates the flow of battle, the tension of *Shogun Tower Defense* is resolved at the micro-level. Every unit in `units.js` operates under a strict, algorithmic "Rock-Paper-Scissors" hierarchy executed frame-by-frame in `CombatSystem.js`. 

Understanding these micro-architectures is critical to mastering the game's deployment strategy. Here is the deep analysis of 1v1 and 1vMany engagements, explicit AI behaviors, and how to counter them.

---

## 1. Enemy AI Behaviors & Counter-Tactics

### The Ikki Rebel (The Suicide Chaff)
- **Micro-Behavior (1v1):** The Rebel is not a traditional melee combatant. It is a biological projectile. Upon engaging a target (`closestSq <= engageDist^2`), the Rebel instantly applies `1` damage and sets its own HP to `0`. It does not stick around to swing a sword.
- **1vMany Execution:** Rebels act as a "DPS Tax" on the engine. If 40 Rebels reach your line, they instantly delete 40 HP from your frontline on the exact frame of impact. Because they instantly die, they cause zero physical clogging, ensuring all 40 can impact sequentially.
- **The Archetype Counter:** Range superiority. Yumi Archers and Horoku Siege must thin them out before impact. If they crash into Hatamotos, the player is chemically guaranteed to take damage. **Bamboo Barricades** are the ultimate counter, trading a cheap 30 HP to absorb 30 Rebels instantly.

### The Tengu (The Aerial Flanker)
- **Micro-Behavior (1v1):** The Tengu is explicitly coded to ignore the player's physical anvil. Its pathing filter reads: `if (unit.type === 'flying' && e.type === 'friction') continue;`. It completely ignores Barricades and forces Hatamotos to disengage.
- **1vMany Execution:** In a massive wave, Tengus act as the vertical bypass layer, flying directly over the gridlock below to strike the fragile backline.
- **The Archetype Counter:** Hatamotos cannot pull aggro from them. Only `ranged` units (Yumi) can target the Z-axis. Players must architect a two-stage defense: Hatamotos in the literal front, with Yumi Archers spaced `100px` behind them to shoot down the Tengu before they reach the gate.

### The Shinobi (The Edge-Pathing Assassin)
- **Micro-Behavior (1v1):** Shinobis are programmed to aggressively abandon the center lane. They immediately path to the far left or right edges (`V_WIDTH - 50` or `50`). They feature an extreme weight-bias against backlines (`distSq -= 400000` against `ranged` or `support` targets).
- **The Barricade Instakill:** If a Shinobi touches a Bamboo Barricade, `CombatSystem.js` triggers a binary execution: both the Shinobi and the Barricade instantly take `-1000 HP`. 
- **The Archetype Counter:** Putting Barricades on the extreme flanks is a catastrophic error. The player must either manually micro High-Damage Spells (Fox Fire, Thunder) on the far edges to kill them in transit, or deploy **Takeda Cavalry**, which specifically counter-target `assassin` archetypes.

### The Onmyoji (The Friction Multiplier)
- **Micro-Behavior (1v1/1vMany):** The Onmyoji deals zero damage. Instead, they park at an extreme `300px` range and pulse a 5 HP AoE heal to all enemy units within that radius every 2.0 seconds based on their `attackSpeed`.
- **1vMany Execution:** In a 30v40 clash where melee lines are gridlocked and exchanging 1-2 DPS, an Onmyoji sitting safely behind the blob makes the enemy Rebel line structurally immortal. By out-healing the player's chip damage, the Onmyoji forces an infinitely stalling frontline.
- **The Archetype Counter:** Standard infantry will never path to the Onmyoji because the enemy frontline occludes them. The player must bypass the geometric blob entirely by using **Horoku Siege** (which lob highly destructive arcs over the frontline) or dropping a massive global damage Spell exactly on their coordinates.

### The Oni Boss (The Physics Breaker)
- **Micro-Behavior (1v1):** The Oni ignores conventional attack pacing. 20% of the time, it enters a `telegraphTimer = 0.8s` state. During this time, standard combat logic is paused. When it expires, it applies an unavoidable, unblockable AoE strike dealing Double Damage (80 dmg) and knocks all player units in a `90px` radius violently airborne (`p.y += 100`).
- **1vMany Execution:** The Oni is explicitly engineered to physically destroy the "Hammer and Anvil" strategy by tossing the anvil into the sky, breaking their collision constraints and ruining their Y-sort rendering.
- **The Archetype Counter:** Standard Hatamotos cannot tank an Oni's 80 damage spike. The player must either deploy the **Samurai Champion** (1500 HP, `taunt: true`) to isolate the Oni, or actively kite the boss by casting "War Drums" (speed buff), pulling their squishy units backward while grinding its 1200 HP with focused Yumi fire.

---

## 2. Player Unit Synergies & Execution Rules

### The Taunt Anchor (Hatamoto + Barricade)
- **The Execution:** A Bamboo Barricade has 0 DPS and acts purely as friction. A Hatamoto has `taunt: true` (a massive negative integer applied to enemy target-finding distance checks) and deals 12 DPS. 
- **The Synergy Strategy:** If a barricade is placed physically *in front* of a Hatamoto array, the invading Rebels/Tengus will snap their aggro to the Hatamotos behind the wall. The enemies will press against the impenetrable friction of the Barricade, desperately trying to path to the Hatamoto, while the Hatamoto safely pokes them from exactly `60px` away. 

### The Kinetic Bowling Ball (Takeda Cavalry)
- **The Execution:** Cavalry deploy with a `chargeTimer`. While charging, their speed doubles, and unlike standard melee units, their physical attack forces the enemy violently on the Y-axis. 
- **The Synergy Strategy:** Cavalry are not meant to auto-attack in a sustained scrum. They are a *biological projectile*. When a massive blob forms and the player's frontline is failing, deploying Cavalry acts as a physical wedge. The Cavalry will violently shove the enemy frontline backward, physically ripping holes in the Gestalt Blob, allowing the player's Yumi Archers to retarget the vulnerable Onmyojis exposed in the enemy backline.

---

## 3. Critical Analysis & The Director's Verdict

As a designer, it is not enough to document how a system works; we must mercilessly evaluate *how it feels*. Here is my critical verdict on the micro-architecture of *Shogun Tower Defense*, identifying the brilliant successes, the terminal failures, and the actionable solutions.

### What is Good (The Successes)
1. **Vertical Constraint Breaking:** The Tengu explicitly ignoring Barricades (`friction`) is a brilliant piece of spatial design. In 2D tower defenses, players easily fall into the trap of building a single, horizontal "God Wall." The Tengu actively forces the player to design their defense with depth (Z-axis awareness), ensuring ranged units are protected but active.
2. **Distinct Archetypal Value:** Units do not feel like reskins. The physical shoving of Cavalry versus the taunting sinkhole of a Hatamoto means the player is making distinct tactical choices rather than just math (DPS) choices.

### What is Extremely Bad (The Critical Flaws)
1. **The Binary Insta-Kill (Shinobi vs. Barricade):** In `CombatSystem.js`, an Assassin hitting a Barricade instantly subtracts 1000 HP from both, vaporizing them. **This is fundamentally bad design.** It violates the psychological rule of "Loss Aversion." When a player invests Koku in a permanent structure, having it instantly deleted by a cheap enemy with zero active counter-play feels deeply unfair. It shatters the "God Game" illusion and feels like the engine is cheating.
2. **The Rebel Suicide Engine:** Making Rebels instantly explode and deal 1 damage to the frontline creates a massive aesthetic flaw. When 40 Rebels reach the line, they don't form a satisfying scrum—they function as an invisible, instantaneous Damage-Over-Time (DoT) field. The player does not get to enjoy the visual friction of an anvil holding against a hammer; the hammer just evaporates and the anvil bleeds.
3. **The Onmyoji Logic Gap:** Because `CombatSystem.js` relies purely on `closestSq` targeting, Player AI is fundamentally too stupid to handle an Onmyoji sitting in the backline. Hatamotos will mindlessly hack at immortal Rebels being chain-healed by the Onmyoji. This leads to mathematically infinite stalemates that the player cannot resolve without spamming Spells, creating extreme frustration.
4. **Ranged Overkill (The Leeching of DPS):** All Yumi Archers independently calculate `closestSq` and fire at the exact same target simultaneously. If 20 Yumi Archers target a Rebel with 1 HP, they simultaneously launch 20 arrows. 19 of these arrows (114 damage) are mathematically wasted. In a 30v40 auto-battler, this fundamentally breaks ranged scaling, making massed archers exponentially less efficient the more you train.
5. **The "Statue" Syndrome (Lack of Visceral Hit-Stun):** Units physically overlap and linearly subtract HP numbers without any physical recoil. It feels like two spreadsheets overlapping rather than a brutal war. Without micro hit-stun, combat lacks physical weight or momentum transfer.
6. **Brainless Tunnel Vision (Unresponsive Aggro):** In `CombatSystem.js`, aggro is evaluated strictly by distance and static boolean flags (`taunt`). If an enemy Tengu is attacking a physical Barricade, and the player's Champion Hero actively stabs it in the back, the Tengu completely ignores the sword in its spine and continues passively hacking the wood until it dies.

### The Actionable Master-Solutions (Lateral Design Revisions)

If I were sitting in the Director's chair, I would immediately mandate the following structural changes to the game's micro-logic:

#### Solution 1: "The Poison Vault" (Redesigning the Shinobi)
**The Fix:** Remove the 1000 HP instant-kill. Instead, when a Shinobi hits a Barricade, it applies a massive stacking Bleed debuff (e.g., -10 HP per second for 5 seconds), and a custom animation plays where the Shinobi physically *leaps over* the barricade.
**The Director's Reasoning:** This maintains the Shinobi's role as a flank-breaking terror, but changes the mechanic from an *unavoidable punishment* to a *tactical crisis that can be managed over time*. The player now has 5 seconds of macro-time to drop a Heal spell or re-route Cavalry to intercept the leaper before the Barricade dies to the bleed. You preserve the threat, but restore the player's agency.

#### Solution 2: "Weight Classes" (Redesigning the Rebels)
**The Fix:** Give Rebels 10 HP and a normal attack speed, preventing them from suiciding. Compensate by giving them a `weight: 0.2` multiplier in `MovementSystem.js`. 
**The Director's Reasoning:** By making them physically light but giving them actual HP, they will visually pile up against the Barricades. When Hatamotos swing, or Cavalry charge, the Rebels will be violently tossed backward like bowling pins due to their low weight. This creates a deeply visceral, highly kinetic "zombie movie" tension, allowing the player to safely watch the satisfying friction of combat rather than an invisible math tax.

#### Solution 3: Threat-Weighted AI Archery (Countering the Onmyoji)
**The Fix:** Stop letting `Yumi` and `Horoku` units target the `closestSq`. Implement a **Weighted Threat Index**. An enemy Rebel has a threat of 1, but an Onmyoji has a threat of 500. `CombatSystem` targeting should evaluate `(Distance * 1) - ThreatScore`.
**The Director's Reasoning:** A key joy of an auto-battler is watching your AI naturally execute smart decisions. A real archer targets the high-value wizard in the backline, not the peasant taking spear hits in the front. By hard-coding player Ranged units to actively drop aggro on chaff and focus-fire high-value targets, you eliminate infinite stalemates and make the player feel like they are commanding an elite, intelligent army.

#### Solution 4: Target Expected-HP Distribution Logic (Fixing Ranged Overkill)
**The Fix:** When an archer evaluates the target array and selects a target, they internally register their incoming arrow damage into a temporary `expectedHealth` object on that enemy. The next archer targets the *next* closest valid enemy if the primary target’s `expectedHealth` is mathematically less than or equal to 0.
**The Director's Reasoning:** This creates beautiful, cinematic arrow volleys that naturally spread organically across the entire enemy frontline instead of all clipping into the exact same pixel to kill a single enemy. It fully restores the DPS efficiency of a massed ranged blob.

#### Solution 5: Micro Hit-Stun Frames (Fixing Statue Syndrome)
**The Fix:** Every time a unit receives melee damage, pause their attack timer progression for exactly `0.1s` and visually flinch their sprite backward by `2px` via a CSS/canvas offset.
**The Director's Reasoning:** This adds immense physical weight to the hits. It creates a gorgeous, churning momentum at the frontline where the side landing hits faster physically bullies the slower side into micro-stunlocks. It validates the visual carnage.

#### Solution 6: Damage-Weighted Aggro Switching (Fixing Tunnel Vision)
**The Fix:** Give elite/sentient enemies an `aggroMemory` object. When they take damage from a non-primary target, they add 10x the damage value to that target's dynamic threat weight, briefly overriding `closestSq`.
**The Director's Reasoning:** Sentient enemies must defend themselves. When flanked or attacked by a Hero while hitting a static piece of wood, the AI must snap around to engage the actual threat. This turns a brainless wall-hacking bot into a deeply emergent, responsive combatant.
