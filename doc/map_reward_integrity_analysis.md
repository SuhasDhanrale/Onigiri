# Map Reward Integrity Analysis

**Date:** June 12, 2026  
**Scope:** Hub test map rewards, combat win payout, elite guarantees, and chapter conquest rewards  
**Status:** Analysis only. No source code changes made.

---

## 1. Executive Summary

The current hub reward display creates a player-facing promise that the game does not consistently fulfill.

In `HubTestScreen.jsx`, combat nodes show fixed reward ranges such as `15-25 Command` and `+1-2 Honor`. Elite nodes show guaranteed rewards such as `25 Honor`. However, the combat win flow does not grant these node rewards as completion rewards. Instead, the game gives:

- command from enemy kill drops during combat,
- honor from killing enemies marked `isElite`,
- leftover command carried back into the run wallet,
- chapter completion passives only when the boss/chapter is cleared.

This means the map UI is not lying intentionally, but it is using a reward model that the actual game loop does not execute.

From a retention-heavy game design perspective, this is a serious trust problem. The map is the player's planning screen. If it advertises a reward, the player treats that reward as the basis for route choice, risk assessment, shop planning, and long-term progression. When the result screen and wallet do not match the promise, the player learns that the map cannot be trusted. In a roguelite map game, that damages the core loop more than a simple balance issue.

The best approach is not to patch the UI text. The best approach is to create a single reward contract that both the UI preview and the win flow use. The player should see the same reward object that the game will grant.

---

## 2. What The UI Currently Promises

### 2.1 Combat Nodes

`HubTestScreen.jsx` reconstructs combat reward text from `COMBAT_VARIANTS`:

```jsx
COMBAT_VARIANTS[selectedNode.variant].command[0]
COMBAT_VARIANTS[selectedNode.variant].command[1]
COMBAT_VARIANTS[selectedNode.variant].honor[0]
COMBAT_VARIANTS[selectedNode.variant].honor[1]
```

Example promises from `src/config/nodes.js`:

| Variant | UI Promise |
|---|---|
| `bandit_camp` | `15-25 Command`, `+1-2 Honor` |
| `ambush` | `20-30 Command`, `+1-2 Honor` |
| `garrison` | `10-20 Command`, `+4-6 Honor` |
| `caravan` | `35-50 Command`, `+1 Honor` |
| `fortress` | `30-45 Command`, `+4-6 Honor` |

The player reads this as a completion payout: "If I win this node, I will receive this reward."

### 2.2 Elite Nodes

Elite nodes use `ELITE_VARIANTS[selectedNode.variant].guarantee`.

Examples:

| Variant | Configured Guarantee | Current UI Behavior |
|---|---:|---|
| `tengu_master` | `honor: 25` | Shows `25 Honor` |
| `oni_warlord` | `honor: 40` | Shows `40 Honor` |
| `onmyoji_ritual` | `honor: 30` | Shows `30 Honor` |
| `ronin_duel` | `honor: 30` | Shows `30 Honor` |
| `shinobi_squad` | `squad_cap: 1` | Falls back toward `?? Honor` |
| `yamabushi` | `blessing_choice: 1` | Falls back toward `?? Honor` |

This is already a display issue for non-honor elite guarantees, but the larger issue is that even the honor guarantees are not granted by the win flow.

### 2.3 Chapter Map Rewards

There is a separate older/chapter reward model in `CAMPAIGN_MAP` and `MapUXMock.jsx`:

| Chapter | Reward |
|---|---|
| `RIVERLANDS` | `Command Drops +20%` |
| `OUTSKIRTS` | `+1 Max Squad Cap` |
| `TENGU_PEAKS` | `Archers +50% DMG` |
| `IRON_MINES` | `Hatamoto +50% HP` |
| `THE_ABYSS` | `Campaign Victory` |

These are mostly real passives:

- `RIVERLANDS` is checked in `RewardSystem.js` and increases command drops.
- `OUTSKIRTS` is checked in `getSquadCap`.
- `TENGU_PEAKS` is checked in `SpawnSystem.js` for Yumi damage.
- `IRON_MINES` is checked in `SpawnSystem.js` for Hatamoto HP.
- `THE_ABYSS` corresponds to campaign completion.

These chapter rewards are not the main problem. The main problem is the newer node reward card in `HubTestScreen.jsx`.

---

## 3. What The Game Actually Grants

### 3.1 During Combat

`RewardSystem.js` grants rewards when enemies die.

Normal enemies grant command:

- `Ikki Rebel`: 1 command
- shield-type enemy: 5 command
- boss-type enemy: 50 command
- most other non-elite enemies: 2 command

Elite enemies grant:

- `+2 earnedHonor`,
- 30 command base reward,
- extra effects from Riverlands, Harvest, Looting, or Blood Katana.

Important detail: in `units.js`, `ONI` is currently the only unit with `isElite: true`.

This means most combat nodes can show honor rewards while actually granting zero honor unless an elite-tagged unit appears and dies.

### 3.2 On Victory

`App.jsx` handles combat victory by reading:

```js
let combatHonor = state.current.earnedHonor || 0;
const combatCommandLeft = state.current.command ?? 0;
```

Then it:

- applies curse modifiers to `combatHonor`,
- adds that honor to meta progression,
- marks the map node completed,
- stores leftover combat command back into `runState.baseCommand`,
- advances or ends the chapter if the node was a boss.

There is no step that says:

```js
grant selectedNode.reward
grant COMBAT_VARIANTS[node.variant].command
grant COMBAT_VARIANTS[node.variant].honor
grant ELITE_VARIANTS[node.variant].guarantee
```

So the advertised node reward data is currently a display-only design artifact.

---

## 4. The Core Problem

The game has two reward systems that are not connected:

| Layer | What It Thinks Rewards Are |
|---|---|
| Map UI | Completion rewards from node definitions |
| Combat simulation | Kill drops plus leftover command |

This creates a broken player promise:

1. The map tells the player: "Pick this node because it gives X."
2. The player pays time, risk, and resources to win.
3. The win flow grants something based on enemy kills, not X.
4. The player cannot confidently plan the next node or shop visit.

In a retention-oriented roguelite, that is dangerous because the map is not decorative. It is the strategic contract between the game and the player.

---

## 5. Why This Hurts Retention

### 5.1 It Weakens Trust

Retention depends on the player believing that their decisions matter. A node reward preview is a contract. If the game says `+4-6 Honor`, the player expects their honor total to move by roughly that amount after victory.

When this does not happen, the player does not think "the economy model is nuanced." The player thinks "the game is inconsistent."

Trust loss is more expensive than a balance mistake because it makes every future choice feel suspicious.

### 5.2 It Damages Route Choice

The conquest map should create tension:

- Do I take a low-risk combat node for command?
- Do I take a garrison because I need honor?
- Do I risk an elite for a bigger long-term reward?
- Do I path toward a shop because I expect enough command afterward?

Right now, the displayed reward cannot safely support those decisions. If combat rewards are actually determined by enemy composition and leftover command, then the node card is not giving the player enough information to plan.

### 5.3 It Undermines the Dopamine Loop

A good roguelite reward loop has three beats:

1. **Anticipation:** The player sees the reward before choosing.
2. **Effort:** The player wins the encounter.
3. **Confirmation:** The result screen pays exactly what was promised, with satisfying feedback.

The current implementation has anticipation and effort, but weak confirmation. The result screen reports honor from kills, not the node reward. The reward note and the payout are mentally disconnected.

That breaks the "I made the right choice" feeling.

### 5.4 It Makes Elite Nodes Feel Fake

Elite nodes are supposed to be the high-risk, high-reward anchors of a map run. Their reward must be more reliable than normal combat rewards.

If an elite node says `40 Honor`, but the game only pays honor from `isElite` enemy kills, then the elite node's identity is not actually tied to its reward. The player can win the elite encounter and still not receive the advertised elite bounty.

That makes elite nodes feel like harder combat nodes with misleading labels.

### 5.5 It Confuses Economy Balance

Designers cannot tune the economy cleanly while the displayed reward and granted reward are different systems.

For example:

- If players are poor, should command kill drops increase?
- Should combat node command ranges increase?
- Should leftover command banking be reduced?
- Should shops get cheaper?

Without a single reward contract, economy tuning becomes guesswork.

---

## 6. Best Approach: A Single Node Reward Contract

The best approach is to make each node produce a canonical reward object, then use that object in both places:

1. the map UI preview,
2. the victory payout.

Conceptually:

```js
reward = getNodeRewardPreview(node, runState, meta)
```

Then on victory:

```js
grantNodeReward(reward, state.current, runState, meta)
```

The preview and payout should be backed by the same data, not separately reconstructed in UI and combat code.

### 6.1 Recommended Reward Model

Separate rewards into two clear categories:

| Reward Type | When It Happens | Example | Player Meaning |
|---|---|---|---|
| Kill drops | During combat | `+1 Command` from rebels | Tactical momentum inside the fight |
| Completion rewards | After victory | `20 Command`, `2 Honor`, `Elite Bounty` | Strategic map progression |

This is the cleanest model because it preserves the satisfying micro-reward of kill drops while also honoring the map promise.

The node card should say both if needed:

- **Completion Reward:** `25 Command, 2 Honor`
- **Combat Drops:** `Enemies drop command during battle`

This removes ambiguity.

### 6.2 Why This Is Better Than Only Changing The UI

One option is to rewrite the UI to say "Expected Drops" instead of "Reward." That would reduce the lie, but it would not solve the design problem.

The map still needs route rewards. A conquest map without reliable completion rewards becomes a combat playlist, not a strategic layer.

For retention, the player needs to feel that the map route is a build plan. That requires reliable node outcomes.

### 6.3 Why This Is Better Than Only Changing Combat Drops

Another option is to manipulate enemy spawns so that expected kill drops approximate the displayed reward ranges.

That is weaker because:

- enemy drops are affected by player performance,
- leftover command depends on spending behavior,
- blessings and curses can modify drops,
- wave RNG can create payout variance,
- the result is hard for the player to understand.

Completion rewards should be deterministic or intentionally bounded. Kill drops can remain variable.

### 6.4 Why This Is Better Than Duplicating Logic In The Result Screen

The result screen could manually check `COMBAT_VARIANTS` and `ELITE_VARIANTS` and add the reward there. That would work short term, but it would create another copy of reward logic.

Long term, that becomes fragile:

- map UI has one interpretation,
- result screen has another,
- balance config has a third,
- events/curses may modify one but not the others.

A single reward resolver is the more durable system.

---

## 7. Recommended Implementation Shape

This is not a code implementation, but this is the architecture I would recommend.

### 7.1 Add A Reward Resolver

Create a small system module, for example:

```text
src/systems/NodeRewardSystem.js
```

Responsibilities:

- read a node,
- read its variant config,
- produce normalized reward data,
- roll deterministic values if a range exists,
- apply victory-time reward effects,
- format reward labels for UI.

Example normalized shape:

```js
{
  completion: {
    command: { min: 15, max: 25, rolled: 21 },
    honor: { min: 1, max: 2, rolled: 2 },
    squadCap: 0,
    blessingChoice: 0
  },
  tags: ['combat', 'completion_reward']
}
```

The UI can show ranges before combat. The victory flow can roll and grant exact values after combat.

### 7.2 Make Rolls Deterministic

Reward ranges should be deterministic per node, not random per render.

Recommended seed inputs:

```text
runState.mapSeed + currentNodeId + currentNodeVariant + rewardType
```

Why deterministic matters:

- prevents save/load reward abuse,
- makes QA reproducible,
- makes balance testing easier,
- keeps the map feeling fair.

The player can see a range before choosing, but the actual payout should be stable once the node is selected or completed.

### 7.3 Grant Completion Rewards On Victory

The correct place is the combat victory path in `App.jsx`, close to where the game currently:

- marks the node completed,
- computes `combatHonor`,
- banks `combatCommandLeft`,
- updates `runState`.

The win flow should combine:

```text
new baseCommand = leftover combat command + node completion command
new honorEarned = previous honor + combat honor + node completion honor
new meta.honor = previous meta honor + combat honor + node completion honor
```

Exactly how to split `runState.honorEarned` and `meta.honor` should match the existing economy convention, but the key rule is simple:

The same completion reward shown on the map must be granted when the node is won.

### 7.4 Keep Kill Drops Separate

Do not remove kill drops. They are valuable for moment-to-moment combat.

Kill drops create:

- immediate feedback,
- a reason to care about efficient killing,
- mid-combat spending decisions,
- visible resource motion.

Completion rewards create:

- route planning,
- long-term progression,
- post-combat satisfaction,
- map identity.

The game needs both.

### 7.5 Fix Elite Guarantees As Real Rewards

Elite guarantees should become first-class reward effects:

| Guarantee | Recommended Effect |
|---|---|
| `honor` | Add exact honor after elite victory |
| `squad_cap` | Add a run-scoped squad cap bonus, or convert to a defined provision/blessing |
| `blessing_choice` | Open a blessing choice modal after victory, or queue it for the map screen |

If an elite guarantee cannot be implemented yet, it should not be displayed as a live reward. It can be labeled `Coming Soon` in development builds, but player-facing builds should not advertise dead rewards.

---

## 8. Reward Presentation Recommendations

### 8.1 Rename The Card Sections

Current label:

```text
Reward
```

Recommended:

```text
Victory Reward
```

Optional secondary line:

```text
Enemies also drop Command
```

This makes the distinction clear.

### 8.2 Show Exact Elite Rewards

Elite cards should avoid vague or broken display text.

Good examples:

```text
Victory Reward
40 Honor
Elite Bounty
```

```text
Victory Reward
+1 Squad Cap
Run Upgrade
```

```text
Victory Reward
Choose 1 Blessing
Run Upgrade
```

Bad example:

```text
?? Honor
Elite Bounty
```

That damages perceived polish and trust.

### 8.3 Make Completion Rewards Feel Ceremonial

The result screen should explicitly show:

```text
Combat Spoils
+43 Command from battle
+2 Honor from elite kills

Victory Reward
+25 Command
+4 Honor
```

This is important for retention. The player should not have to infer why their wallet changed. The result screen is where the game confirms the player's decision was valuable.

---

## 9. Balance Recommendations

### 9.1 Combat Node Rewards

Combat node completion rewards should be modest and reliable.

Recommended design:

- low threat: small command, tiny honor,
- medium threat: moderate command or honor,
- high threat: stronger specialization,
- special nodes: one clear reward identity.

Example:

| Variant | Identity | Suggested Reward Role |
|---|---|---|
| `bandit_camp` | Basic fight | Small balanced payout |
| `ambush` | Fast short fight | Slightly higher command, low honor |
| `garrison` | Defensive/harder fight | Lower command, higher honor |
| `caravan` | Economy node | High command, low honor |
| `fortress` | Long fight | High honor and moderate command |

This creates route texture. The player should choose based on current need, not just highest total value.

### 9.2 Elite Node Rewards

Elite rewards should be reliable and build-defining.

For retention, elite nodes should create a memorable "I got stronger" moment. Honor alone is useful, but run-changing rewards are more emotionally sticky.

Recommended elite reward categories:

- large honor bounty,
- choose a blessing,
- add squad cap for the run,
- unlock a unit type for the run,
- upgrade a troop family for the run,
- remove a curse plus smaller honor.

The reward should justify the fear of the node.

### 9.3 Boss Rewards

Boss rewards should remain chapter-level progression.

Boss victory is where the game should grant:

- conquered chapter passive,
- chapter completion marker,
- next chapter unlock,
- campaign win if final.

This is already mostly aligned with the current design. It should remain separate from ordinary node rewards.

---

## 10. Why This Is The Best Approach For A Retention-Heavy Game

A retention-heavy game is not just about giving more rewards. It is about making the player believe in the loop.

The strongest loop here should be:

```text
See reward -> choose path -> fight -> receive promised payout -> spend or plan -> repeat
```

The current implementation weakens the last two steps. The player sees reward text, fights, then receives an outcome from a different reward system.

The single reward contract approach fixes this because it gives the game a clear economy spine:

- The map becomes trustworthy.
- The result screen becomes satisfying.
- Elite nodes become meaningful.
- Shops become easier to plan around.
- Designers can tune one source of truth.
- QA can verify rewards without interpreting combat RNG.
- Future curses, blessings, and events can modify rewards cleanly.

This is better than a UI-only fix because it preserves strategic choice. It is better than a combat-drop-only fix because it keeps rewards readable. It is better than scattered patches because it gives the economy an architecture that can scale.

For this kind of game, trust is retention. If the player cannot trust the map, they cannot enjoy planning. If they cannot enjoy planning, the hub becomes friction between battles instead of the reason to play another run.

---

## 11. Suggested Priority

### Priority 1: Stop The Broken Promise

- Decide that node reward previews represent victory completion rewards.
- Add a canonical node reward resolver.
- Make `HubTestScreen.jsx` read the resolver output instead of reconstructing labels manually.
- Make victory payout grant the same resolver output.

### Priority 2: Separate Reward Categories In Result UI

- Show combat kill spoils separately from victory reward.
- Make command and honor changes transparent.
- Make curse reductions visible if they affect honor.

### Priority 3: Make Elite Guarantees Real

- Implement `honor`.
- Decide how `squad_cap` is represented in run state.
- Decide how `blessing_choice` is delivered after victory.

### Priority 4: Balance Economy Values

- Tune combat node command/honor ranges after the contract exists.
- Keep kill drops as combat pacing rewards.
- Use completion rewards for route choice and shop planning.

---

## 12. Final Recommendation

Do not treat this as a small display bug. Treat it as a reward contract bug.

The map screen is the strategic promise layer. The combat system is the effort layer. The result screen is the confirmation layer. All three must agree.

The best design is:

```text
Kill drops are variable combat spoils.
Node rewards are reliable victory payouts.
Chapter rewards are permanent conquest passives.
```

That model is understandable, tunable, and satisfying. It supports short-term dopamine, medium-term route planning, and long-term progression without making the player wonder whether the UI is telling the truth.
