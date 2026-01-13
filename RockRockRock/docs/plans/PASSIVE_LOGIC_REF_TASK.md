# Task: Refactor Passive Skill Logic

- [x] Research existing passive logic in `state.js`, `logic.js`, and `main.js`
- [/] Refactor `main.js` to eliminate code duplication and ensure `onRemove` hooks are called
    - [x] Create `addPassiveToState` and `removePassiveFromState` helpers
    - [x] Refactor selection phases to use common logic
    - [x] Update cheat commands to use helpers
- [ ] Verify logic consistency across different passives (dynamic vs state-based)
- [ ] Test passive replacement flow in the browser
- [/] Refactor `HwanjangTower` passive/fairy logic
    - [ ] Separate base stats in `player.js`
    - [ ] Implement dynamic stat calculation
    - [ ] Fix `setFairy` replacement bug

