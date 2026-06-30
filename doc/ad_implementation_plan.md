# Ad Placement and Implementation Plan

**Date:** June 30, 2026  
**Status:** Implemented  
**Goal:** Integrate rewarded and interstitial ads at points that fit Onigiri's existing player journey without creating new currencies, power-ups, or ad-specific gameplay systems.

---

## 1. Product Decision

Use the existing `ads/AdManager.js`. Rewarded ads grant only existing Command; they never grant Honor.

Phase 1 should contain only these placements:

1. **Rewarded: Run Supplies** — on any combat, elite, or boss node detail card, once per run, grant `+100 Command` before combat.
2. **Interstitial: Standard Victory Transition** — after the player confirms an ordinary combat victory and before the map becomes interactive again.

Do not put rewarded-ad buttons on Thunder, Fox Fire, Dragon Wave, tower, barracks, unit, or upgrade controls during combat.

Do not double remaining Command after victory.

---

## 2. Player and Economy Review

### Player journey

The current chapter loop is:

`Home -> Chapter Map -> Node Detail -> Combat/Event/Shop/Rest -> Result -> Map -> Boss -> Next Chapter`

Combat is an active decision space. The player spends Command on buildings, upgrades, units, tactical actions, and spells while watching autonomous units fight. Ads shown here would interrupt the player's response window and weaken the feeling of being the commander.

The natural non-gameplay pauses are:

- the node detail card before an encounter,
- the battle result screen,
- the transition from a confirmed result back to the map or chapter screen.

These are the valid ad surfaces.

### Command is not a disposable level currency

Command has three connected roles:

- A run starts with `100` Command plus permanent provision bonuses.
- Enemy kills generate Command during combat.
- Remaining combat Command is carried back into `runState.baseCommand` and can be spent in later encounters and shops.

Existing reference values:

- Thunder Shower: `50 Command`
- Fox Fire: `100 Command`
- Dragon Wave: `150 Command`
- Barracks construction: `50-200 Command`
- Node Command rewards: approximately `10-60 Command`
- Permanent starting bonuses: `+15`, `+25`, and `+40 Command`

Consequences for ads:

- `+150 Command` before every encounter is too large. It equals a Dragon Wave, can buy multiple early buildings, and carries into later nodes.
- Doubling remaining Command after victory rewards hoarding instead of tactical spending.
- Repeated Command rewards would reduce the value of shops, events, kill rewards, and permanent starting-Command provisions.

For that reason, the Command reward is limited to `+100` once per run. The player may claim it before any combat, elite, or boss encounter.

### Honor is excluded from ads

Honor remains earned progression currency. Rewarded ads do not grant, multiply, exchange, or deduct Honor.

---

## 3. Placement Review

| Candidate placement | Decision | Reason |
| --- | --- | --- |
| Watch an ad to cast Thunder/Fox Fire/Dragon Wave | Reject | Appears during active gameplay, interrupts a time-sensitive decision, and makes core abilities feel ad-gated. |
| Watch an ad to build a tower or barracks | Reject | Same active-gameplay problem and directly bypasses the core Command economy. |
| Watch an ad for `+150 Command` before every fight | Reject | Too large and repeatable; Command persists across the run. |
| Watch an ad to double remaining Command after victory | Reject | Creates compounding inflation and rewards players for not using the game's abilities. |
| Watch an ad for `+100 Command` once per run | Accept | A controlled one-time boost; the player chooses which encounter needs it and how to spend it. |
| Watch an ad to double earned Honor after defeat | Reject | Honor remains gameplay-earned progression and is not part of ad rewards. |
| Forced ad between waves | Reject | Interrupts gameplay and violates portal expectations. |
| Interstitial after ordinary victory confirmation | Accept | Clear transition boundary after meaningful gameplay. |
| Interstitial after event, shop, or rest nodes | Reject | These nodes are navigation/choice interactions, not enough gameplay to justify a forced break. |
| Interstitial on defeat | Reject | Keep the loss flow clean and return the player to normal progression. |

---

## 4. Rewarded Placement A: Run Supplies

### Surface

Add the offer to selected combat, elite, and boss node detail cards in `src/ui/screens/HubTestScreen.jsx`, above the existing `Begin Encounter` button. Hide it after it has been claimed during the current run.

### Offer

**Label:** `Optional Run Supplies`  
**Value:** `Watch Ad · +100 Command`  
**Limit:** Once per run  
**Placement key:** `run_command_bonus`

### Player choices

The normal `Begin Encounter` action remains immediately available. The player must never be forced to watch the ad or wait for the offer before starting.

Recommended layout:

- `Watch Ad · +100 Command`
- `Begin Encounter`

The normal action must remain equally readable and accessible. The rewarded button must include a video/ad icon and explicitly state the reward. The player can always begin the encounter without the bonus.

### Why once per run

- Encounter preparation is a natural pause that does not interrupt combat.
- The player can save the boost for an elite or boss instead of being forced to use it at one specific node.
- The once-per-run claim prevents repeated Command inflation.
- The player decides whether the Command becomes a Thunder cast, part of a building purchase, a troop upgrade, or remains in the run economy.

### Application rule

Grant the reward only from the rewarded completion callback:

```js
AdManager.showRewardedAd('run_command_bonus', (rewarded) => {
  if (!rewarded) return;
  setRunState(previous => ({
    ...previous,
    baseCommand: previous.baseCommand + 100,
    runCommandBonusClaimed: true,
  }));
});
```

The example adds one boolean to the existing run state; it does not require a new system or file. The flag prevents duplicate claims caused by reopening the node card or double-clicking.

### Availability behavior

- Hide the button when ads are disabled or unavailable.
- Hide it after the reward is claimed.
- Disable it while the request is pending.
- On an unfilled/error result, grant nothing and keep `Begin Encounter` usable.
- Do not show it during the tutorial's first guided encounter.

---

## 5. Defeat Behavior

Defeat has no ad placement. The player receives only the Honor earned through gameplay and can continue immediately. The current run and generated map remain intact, so the failed node can be replayed. If the +100 Command reward was already claimed, it remains part of `runState.baseCommand` for the retry and cannot be claimed again. Do not show rewarded or interstitial ads on this result.

---

## 6. Interstitial Placement: Ordinary Victory Transition

### Surface

The request belongs in the victory branch of `handleResultClose` in `src/App.jsx`.

The player flow should be:

1. Player sees the complete victory report.
2. Player presses `Continue`.
3. Victory rewards and progression are committed.
4. The result UI blocks interaction while the ad request resolves.
5. If an ad is filled, it plays.
6. If it is unfilled or fails, transition immediately.
7. The map becomes interactive.

Do not request the ad at the instant victory occurs. The player should first read the result and deliberately confirm the transition.

### Eligible victories

Phase 1 interstitials apply only to ordinary `combat` victories.

Suppress them for:

- elite victories,
- boss victories,
- campaign completion,
- any result containing a rewarded offer,
- tutorial encounters,
- event, shop, and rest nodes,
- defeat.

Elite and boss results are important positive moments and should remain clean. The player may also have claimed Run Supplies before the fight, so another ad after it would be excessive.

### Frequency

Reuse `AdManager.showInterstitialAfterLevel(completedCombatCount)` and the current level rules:

- no interstitial before three completed combats,
- then one eligible request every three completed combats,
- adapter/portal cooldown and fill rules still apply.

For cross-platform builds, adjust the existing `ads/adConfig.js` timing before release:

- `initialDelay`: at least `180000` ms,
- `interstitialCooldown`: at least `180000` ms,
- `maxInterstitialsPerSession`: start at `6`,
- `maxRewardedPerSession`: start at `6`.

CrazyGames applies additional SDK-side pacing. Local caps are still useful for other adapters and for ensuring one consistent product policy.

### Counting completed combats

The existing AdManager listens for string events that the game currently does not emit:

- `level:start`
- `level:complete`
- `level:fail`

Wire these existing events rather than creating a second statistics system:

- emit `level:start` when combat begins,
- emit `level:complete` when a victory result is confirmed,
- emit `level:fail` when defeat is registered.

After `level:complete`, read `AdManager.getStats().session.levelCompletes` and pass that count to `showInterstitialAfterLevel`.

---

## 7. Existing-Code Integration Map

No new ad manager, currency, power-up, or standalone ad module is needed.

### `ads/AdManager.js`

Reuse:

- `showRewardedAd(placement, callback)`
- `showInterstitialAfterLevel(levelNumber)`
- `isAdAvailable(adType)`
- existing session/attempt statistics
- existing adapter selection, audio muting, and ad lifecycle events

Initialize `AdManager` before evaluating offer visibility. Its current `isAdAvailable()` method returns `false` until initialization has completed, so using it as the first lazy-init trigger would hide every offer permanently.

Do not use `offerRewardedForUpgrade`; its configured upgrade types (`speed`, `damage`, `shield`) belong to a different game design and do not map to Onigiri.

Do not use `offerRewardedForContinue` in Phase 1. Onigiri has no implemented revive contract, and adding one would require combat-state recovery and balance work beyond ad integration.

### `ads/adConfig.js`

Edit the existing configuration rather than adding another config file:

- replace the old Starline comments and upgrade entries,
- keep `areAdsEnabled()` gated by `VITE_ENABLE_ADS`,
- set conservative timing and session caps,
- retain `noAdsUntilLevel: 3` and `showAdEveryNLevels: 3` for the first release,
- do not enable startup interstitials or banners.

### `src/ui/screens/HubTestScreen.jsx`

- render the Run Supplies offer on existing combat, elite, and boss node detail cards,
- keep `Begin Encounter` available,
- prevent duplicate/pending requests,
- apply `+100` to existing `runState.baseCommand` only after rewarded completion.

### `src/App.jsx`

- emit the existing AdManager level lifecycle events,
- request an interstitial only from the eligible victory-close path,
- block duplicate result actions while an ad request is pending,
- commit progression before awaiting an interstitial.

### `src/platforms/crazygamesSdk.js`

The lifecycle helper now boots and reports gameplay for both SDK-only and normal CrazyGames ad-enabled builds. Ad blocking remains controlled by `AdManager`/configuration.

### `src/@ads/index.js`

Do not integrate gameplay through this module in the current implementation. It still resolves to the no-op adapter even when `VITE_ENABLE_ADS` is true. Use the already-implemented `ads/AdManager.js` directly, as the project currently does for CrazyGames SDK integration.

### `.env.crazygames`

Current values intentionally disable monetization:

```env
VITE_CG_SDK_ONLY=true
VITE_ENABLE_ADS=false
```

Keep these values during Basic Launch or SDK-only testing. For an approved monetized build, use the existing environment switches:

```env
VITE_CG_SDK_ONLY=false
VITE_ENABLE_ADS=true
```

Rewarded buttons must be hidden when ads are disabled; they must never remain visible with no effect.

---

## 8. State and Idempotency Rules

Ad callbacks are asynchronous and can fail, arrive late, or be triggered around repeated clicks. Every reward must be idempotent.

Required guards:

- only one ad request may be pending from the UI,
- disable both result actions while committing the selected result action,
- store whether each rewarded opportunity was claimed,
- reward only from the rewarded completion callback,
- never reward on request start, ad error, unfilled response, or page visibility change,
- never deduct the normal reward if an ad fails,
- save/commit progression before showing an interstitial,
- keep normal gameplay available when ads are blocked or unavailable.

Suggested existing-state additions:

```js
// run state
runCommandBonusClaimed: false
```

These are fields on existing state objects, not new systems.

---

## 9. UX Requirements

### Rewarded buttons

- State `Watch Ad` explicitly.
- State the exact reward explicitly.
- Include an ad/video icon.
- Keep the no-ad path visible immediately.
- Do not use countdowns, delayed close buttons, pulsing reminders, or repeated prompts.
- Show a pending state while the SDK runs its auction/request.
- Show a short success confirmation after granting the reward.
- Hide or disable the control when no rewarded ad can be requested.

### Interstitial requests

- Block map/result interaction until completion or error.
- Do not mute audio merely because an ad was requested; the adapter already mutes when the ad actually starts.
- Resume immediately on an unfilled/error response.
- Never request another ad from the destination map screen.

---

## 10. Analytics and Evaluation

Use existing ad lifecycle events and add placement context to analytics when analytics are enabled.

Track:

- `ad_offer_shown`
- `ad_offer_selected`
- `ad_started`
- `ad_completed`
- `ad_failed`
- `reward_granted`
- placement key
- chapter number
- node type
- reward amount
- session combat count

Product metrics for the first release:

- Run Supplies offer acceptance rate,
- ad completion/error rate by platform,
- next-node continuation after interstitial,
- session exit rate immediately after an interstitial,
- average Command entering a boss with and without the rewarded bonus,

Rebalance or remove a placement if it materially increases immediate exits, makes boss completion sharply dependent on watching an ad, or accelerates permanent progression beyond intended pacing.

---

## 11. Implementation Order

1. Clean the existing Onigiri-specific values in `ads/adConfig.js`.
2. Make the existing CrazyGames lifecycle helper support the full ad-enabled mode.
3. Wire AdManager's existing `level:start`, `level:complete`, and `level:fail` events.
4. Add Run Supplies rewarded UI and one-claim state.
5. Add ordinary-victory interstitial requests after progression is committed.
6. Test disabled, unfilled, error, completed, double-click, and page-hide cases.
7. Test CrazyGames locally with its SDK local mode and test GameDistribution with its adapter tools.
8. Enable ads only in approved platform builds.

---

## 12. Acceptance Criteria

- No ad button appears during combat.
- Thunder, Fox Fire, Dragon Wave, buildings, and upgrades work exactly as they do without ads.
- The Run Supplies Command reward can be claimed only once per run.
- Defeat screens never show rewarded or interstitial ads.
- No result transition can show both a rewarded ad and an interstitial.
- Ordinary victory interstitials begin only after the configured clean-play period.
- Ad errors and unfilled requests never block progression.
- Disabled-ad builds contain no nonfunctional rewarded buttons.
- Rewards are granted only once and only after confirmed rewarded completion.
- Existing platform adapters, sound muting, and AdManager caps are reused.

---

## 13. Platform References

- CrazyGames advertisement requirements: <https://docs.crazygames.com/requirements/ads/>
- CrazyGames video ad API: <https://docs.crazygames.com/sdk/video-ads/>
- CrazyGames midgame pacing guidance: <https://docs.crazygames.com/resources/midgame-ads-pacing/>
