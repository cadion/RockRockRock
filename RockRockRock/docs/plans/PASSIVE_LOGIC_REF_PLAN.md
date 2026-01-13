# Implementation Plan - Passive Skill Logic Refactoring

This plan aims to clean up the passive skill logic in the `RockRockRock` project, ensuring consistency in how passives are added, removed, and how their effects are applied/cleaned up.

## Proposed Changes

### [Component] Core Logic & Phase Management (RockRockRock)

#### [MODIFY] [main.js](file:///c:/Users/ugc00/Desktop/AntiGravityProject/RockRockRock/src/main.js)
- ✅ Extract `addPassiveToState(passive)` and `removePassiveFromState(passiveId)` helpers.
- ✅ Implement `handlePassiveSelection(options, onComplete)` to unify `startEventPhase` and `startEventPhaseWithOptions`.
- ✅ Update `cheat` objects and `showReplacePassiveModal` callbacks to use these helpers.

---

### [Component] Player Stats & Fairy System (HwanjangTower)

#### [MODIFY] [player.js](file:///c:/Users/ugc00/Desktop/AntiGravityProject/HwanjangTower/modules/player.js)
- [ ] Refactor stat management to separate `baseStats` from `modifiedStats`.
- [ ] Implement a dynamic getter or a recaculate function for stats to ensure percentage bonuses (from Fairies) apply correctly after leveling up.
- [ ] Fix the `setFairy` logic to safely replace fairies without stacking bonuses.


### [Component] Game Logic (src/logic.js)
- [ ] Review if all passives should follow the `onApply`/`onRemove` pattern or if some should remain dynamic (like `bigHand`).
- [ ] Ensure `deckSize` and `handSize` bonuses are handled consistently.

## Verification Plan

### Automated Tests
- N/A (Project uses Vanilla JS without a test runner)

### Manual Verification
#### RockRockRock
1.  Run the game using `npm run dev`.
2.  Use the cheat console to add/remove passives and verify state restoration.

#### HwanjangTower
1.  Verify that changing a fairy correctly updates stats instead of adding to them.
2.  Verify that leveling up correctly scales the fairy's percentage bonuses.

