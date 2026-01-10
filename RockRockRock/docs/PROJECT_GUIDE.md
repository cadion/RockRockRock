# 🎮 RPS Roguelike - Project Guide

> ⚠️ **IMPORTANT**: Antigravity MUST read this file FIRST before any code modification.

## 📋 Work Rules (작업 규칙)

### Rule 1: Always Read This Guide First
Before modifying ANY code, read this entire file to understand:
- Project structure
- File purposes
- What files need to be modified

### Rule 2: Minimize Token Usage
- Read only the files you need based on this guide
- Don't read all files - use the File Map below to identify targets
- Update this guide when file purposes change

### Rule 3: Keep Planners with Git
When committing to Git, always include:
- Updated `PROJECT_GUIDE.md` (this file)
- Any implementation plans in `docs/plans/`

### Rule 4: Update This Guide
After modifying code, update:
- File descriptions if purpose changed
- Add new files to the File Map
- Update line counts and descriptions

---

## 📁 Project Structure

```
rps-roguelike/
├── .agent/
│   └── workflows/          # Antigravity workflow definitions
│       └── 코드수정.md     # Code modification workflow
├── docs/
│   ├── PROJECT_GUIDE.md    # THIS FILE - Read first!
│   └── plans/              # Implementation plans
│       └── REVERSAL_GIMMICK_PLAN.md
├── src/
│   ├── main.js             # Game loop & event handlers
│   ├── state.js            # Game state & data definitions
│   ├── logic.js            # Game mechanics & calculations
│   ├── ui.js               # UI rendering & animations
│   └── style.css           # All styles
├── index.html              # HTML structure
├── vite.config.js          # Vite build config
└── package.json            # Dependencies & scripts
```

---

## 🗂️ File Map (파일 맵)

### Core Game Files

| File | Purpose | When to Modify |
|------|---------|----------------|
| `src/state.js` | Game state, passives, gimmicks definitions | Adding new passives/gimmicks, changing game rules |
| `src/logic.js` | Battle mechanics, card processing, RPS logic | Changing battle rules, card interactions |
| `src/main.js` | Game loop, phase management, event binding | Changing game flow, adding phases |
| `src/ui.js` | All UI rendering, modals, animations | Visual changes, new UI elements |
| `src/style.css` | All CSS styles | Styling changes, animations |
| `index.html` | HTML structure, DOM elements | Adding new UI containers |

### Config Files

| File | Purpose | When to Modify |
|------|---------|----------------|
| `vite.config.js` | Build configuration, base path | Deployment settings |
| `package.json` | Dependencies, npm scripts | Adding packages |

---

## 🔧 Common Modification Patterns

### Adding a New Gimmick
1. Read: `src/state.js` (GIMMICKS object)
2. Modify: `src/state.js` - add gimmick definition
3. Modify: `src/logic.js` - add gimmick behavior if needed
4. Modify: `src/main.js` - add animation handling if needed
5. Update: This guide

### Adding a New Passive
1. Read: `src/state.js` (PASSIVES object)
2. Modify: `src/state.js` - add passive definition
3. Modify: `src/logic.js` - add passive effect in relevant functions

### Changing UI/Animations
1. Read: `src/ui.js` (find relevant function)
2. Modify: `src/ui.js` - update function
3. Modify: `src/style.css` - if style changes needed

### Adding New UI Elements
1. Modify: `index.html` - add DOM structure
2. Modify: `src/ui.js` - add to DOM cache & rendering
3. Modify: `src/style.css` - add styles

---

## 📊 File Details

### `src/state.js` (~210 lines)
```
- createInitialDeck(): Creates starting 15-card deck
- shuffle(): Array shuffle utility
- gameState: Main game state object (includes deckSize: 15)
- PASSIVES: 9 passive definitions (redMatch, blueMatch, thirdReverse, redRush, flexibility, recycle, joker, bigHand, smallDeck)
- GIMMICKS: 9 gimmick definitions (fourCards, twoCards, greenOnly, scissorsOnly, fog, mimic, corrosion, overload, reversal)
- getRandomPassives(): Random passive selector
- getRandomGimmick(): Random gimmick selector
```

### `src/logic.js` (~295 lines)
```
- SHAPE_ICONS: Rock/Paper/Scissors emoji map
- generateEnemyCards(): Creates enemy cards based on gimmicks
- drawHand(): Draws cards from deck (5 + passive bonus)
- basicRPS(): Basic RPS win/lose calculation
- judgeCard(): Single card judgment with passives/gimmicks
- resolveBattle(): Full battle resolution
- processEndOfRound(): End-of-round card processing
- generateAcquisitionCards(): Creates cards for acquisition phase
- checkDeckHealth(): Game over condition check
```

### `src/main.js` (~300 lines)
```
Round Flow: Gimmick (R6,9,12...) → Passive (R3,6,9...) → Battle → Acquire → Next Round

- initGame(): Game initialization
- startRound(): Round setup (gimmick check)
- checkEventPhaseBeforeBattle(): Passive selection before battle
- setupBattlePhase(): Battle phase initialization
- onHandCardClick(): Hand card selection
- onFieldCardClick(): Field card deselection
- deselectCard(): Card deselection logic
- updateSelectionUI(): UI refresh after selection
- onSubmit(): Submit button handler (animations + battle)
- startAcquirePhase(): Card acquisition phase
- afterAcquirePhase(): After acquisition, go to next round
- startEventPhase(callback): Passive selection event
- nextRound(): Round progression
```

### `src/ui.js` (~700 lines)
```
- DOM: Cached DOM element selectors
- updateInfoBar(): Round/deck count display
- updateGimmickDisplay(): Gimmick indicator
- createCardHTML(): Card element generator
- renderEnemyCards(): Enemy field rendering
- renderPlayerField(): Player field rendering
- renderHand(): Hand cards rendering
- updateActionButton(): Submit button state
- renderPassives(): Passive emblems
- showBattleResult(): Battle result display
- showAcquireModal(): Card acquisition modal
- showEventModal(): Passive selection modal
- showReplacePassiveModal(): Passive replacement modal
- showGameoverModal(): Game over screen
- showGimmickModal(): Gimmick announcement
- showDeckOverlay(): Deck view overlay
- burnRemainingHandCards(): Hand burn animation
- flyCardsToDeck(): Field-to-deck animation
- flyHandCardsToDeck(): (Reversal) Hand-to-deck animation
- burnFieldCards(): (Reversal) Field burn animation
```

### `src/style.css` (~900 lines)
```
- :root variables (colors, glass effects)
- Layout (#app, #game-container)
- Info bar & gimmick display
- Card styles (colors, sizes, states)
- Field areas (enemy, player, hand)
- Modals (acquire, event, gameover, gimmick)
- Deck overlay
- Animations (cardBurn, flyToDeck, popIn, shake)
- Responsive (max-width: 400px)
```

---

## 🚀 Deployment

```bash
# Build
npm run build

# Deploy to GitHub Pages
npm run deploy
```

**Live URL**: https://cadion.github.io/RockRockRock/

---

## 📝 Git Commit Checklist

Before committing:
- [ ] Update this `PROJECT_GUIDE.md` if file purposes changed
- [ ] Include any new implementation plans in `docs/plans/`
- [ ] Test the game locally

```bash
git add .
git commit -m "Description"
git push
```

---

## 🎮 Game Content Reference

### Passives (패시브)

| ID | Name | Icon | Description |
|----|------|------|-------------|
| `redMatch` | 붉은 심판 | 🔴 | 빨간색 카드는 같은 모양일 때 승리 |
| `blueMatch` | 푸른 심판 | 🔵 | 파란색 카드는 같은 모양일 때 승리 |
| `thirdReverse` | 역전의 용사 | 🔄 | 세 번째 카드는 지는 모양일 때 승리 |
| `redRush` | 빨간 맛 | 🍎 | 필드에 빨간색 카드 3장 이상이면 승점 +1 |
| `flexibility` | 유연함 | 🌊 | 보로 이기면 버려진 카드 1장 복구 |
| `recycle` | 재활용 | ♻️ | 버려질 흰색 카드 1장은 덱으로 복귀 |
| `joker` | 조커 | 🃏 | 보라색 카드는 무조건 승리 (모양 무시) |
| `bigHand` | 큰 손 | 🖐️ | 핸드 크기 +1 (6장) |
| `smallDeck` | 압축 | 📦 | 덱 크기 -1 |

### Gimmicks (기믹)

| ID | Name | Description |
|----|------|-------------|
| `fourCards` | 4연타 | 적이 패를 4개 냅니다 |
| `twoCards` | 가벼운 전투 | 적이 패를 2개만 냅니다 |
| `greenOnly` | 초록 전염병 | 적이 초록색 패만 냅니다 |
| `scissorsOnly` | 가위 바람 | 적이 가위만 냅니다 |
| `fog` | 안개 | 적의 가운데 패가 보이지 않습니다 |
| `mimic` | 모방 | 적의 첫 번째 패가 플레이어 선택을 따라함 |
| `corrosion` | 부식 | 바위는 가위에게 집니다 |
| `overload` | 폭주 | 적이 패를 5개 냅니다 |
| `reversal` | 역전의 대가 | 핸드 카드는 덱으로, 필드 카드는 소멸 |

### Cheat Console

브라우저 콘솔(`F12`)에서 사용:
```javascript
cheat.help()                      // 도움말
cheat.setGimmick('reversal')      // 기믹 적용
cheat.addPassive('bigHand')       // 패시브 추가
cheat.removePassive('bigHand')    // 패시브 제거
cheat.setRound(6)                 // 라운드 설정
```

---

*Last updated: 2026-01-09*
