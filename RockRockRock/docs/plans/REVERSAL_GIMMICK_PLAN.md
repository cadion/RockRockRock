# Add "Reversal" Gimmick

A new gimmick that reverses the standard end-of-round card behavior.

## Background

**Current behavior (default):**
- Hand cards (not selected) → Discarded (lost)
- Field cards (played) → Return to deck

**New gimmick behavior:**
- Hand cards (not selected) → Return to deck
- Field cards (played) → Discarded (lost)

This creates an interesting strategic twist where players must consider which cards to sacrifice.

---

## Proposed Changes

### State Module

#### [MODIFY] state.js

Add new gimmick definition to `GIMMICKS` object:

```javascript
reversal: {
    id: 'reversal',
    name: '역전의 대가',
    desc: '핸드 카드는 덱으로, 필드 카드는 소멸합니다',
    reversedDiscard: true
}
```

---

### Logic Module

#### [MODIFY] logic.js

Modify `processEndOfRound` function to check for the gimmick and swap behavior:

```javascript
// Check if reversal gimmick is active
const gimmick = gameState.currentGimmick;
const isReversed = gimmick && gimmick.reversedDiscard;

if (isReversed) {
    // Reversed: hand cards return to deck
    gameState.deck.push(...remainingHand);
    // Field cards go to discard
    gameState.discardPile.push(...gameState.playerCards);
    discardedCount = gameState.playerCards.filter(c => c !== null).length;
} else {
    // Normal behavior
    gameState.discardPile.push(...remainingHand);
    gameState.deck.push(...gameState.playerCards);
}
```

---

## Verification Plan

### Manual Testing

1. **Start the game** at `http://localhost:5173/`
2. **Play until Round 10** (or use browser console to force gimmick):
   ```javascript
   // In browser console, force the gimmick for testing:
   import('./src/state.js').then(m => {
       m.gameState.currentGimmick = m.GIMMICKS.reversal;
   });
   ```
3. **When the gimmick activates**, verify:
   - The gimmick modal shows "역전의 대가" with the correct description
   - After submitting cards, the hand cards should **NOT** burn (they return to deck)
   - The field cards should be **lost** (check deck count decreases by the number of played cards)
4. **Check deck view** to confirm:
   - Cards that were in hand (but not played) are still in the deck
   - Cards that were played are no longer in the deck
