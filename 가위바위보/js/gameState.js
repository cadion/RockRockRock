/**
 * Game State Management
 * Manages the overall game state including deck, hand, passives, gimmicks, and rounds
 */

class GameState {
    constructor() {
        this.reset();
    }

    /**
     * Reset game to initial state
     */
    reset() {
        this.currentRound = 1;
        this.currentPhase = 'battle'; // battle, cardPick, gimmick, event

        // Player deck and hand
        this.playerDeck = createInitialDeck();
        this.playerHand = [];
        this.playerField = [];
        this.selectedCards = []; // Indices of selected cards from hand

        // Enemy
        this.enemyField = [];

        // Passives (max 2)
        this.passives = [];

        // Current gimmick
        this.currentGimmick = null;

        // Track cards lost in last battle
        this.cardsLostLastBattle = 0;

        // Pending passive selection
        this.pendingPassive = null;
    }

    /**
     * Draw random cards from deck to hand
     */
    drawHand(count = 5) {
        const shuffled = shuffleArray(this.playerDeck);
        this.playerHand = shuffled.slice(0, Math.min(count, this.playerDeck.length));
    }

    /**
     * Remove cards from deck
     */
    removeCardsFromDeck(cards) {
        for (const card of cards) {
            const index = this.playerDeck.findIndex(c => c.id === card.id);
            if (index !== -1) {
                this.playerDeck.splice(index, 1);
            }
        }
    }

    /**
     * Add cards to deck
     */
    addCardsToDeck(cards) {
        this.playerDeck.push(...cards);
    }

    /**
     * Add passive (max 2)
     */
    addPassive(passive) {
        if (this.passives.length < 2) {
            this.passives.push(passive);
        }
    }

    /**
     * Remove passive
     */
    removePassive(passiveId) {
        this.passives = this.passives.filter(p => p.id !== passiveId);
    }

    /**
     * Replace passive
     */
    replacePassive(oldPassiveId, newPassive) {
        const index = this.passives.findIndex(p => p.id === oldPassiveId);
        if (index !== -1) {
            this.passives[index] = newPassive;
        }
    }

    /**
     * Set current gimmick
     */
    setGimmick(gimmick) {
        this.currentGimmick = gimmick;
    }

    /**
     * Clear gimmick
     */
    clearGimmick() {
        this.currentGimmick = null;
    }

    /**
     * Advance to next round
     */
    nextRound() {
        this.currentRound++;
    }

    /**
     * Get deck count
     */
    getDeckCount() {
        return this.playerDeck.length;
    }

    /**
     * Check if gimmick should be applied (10+ rounds, every 5 rounds)
     */
    shouldApplyGimmick() {
        return this.currentRound >= 10 && this.currentRound % 5 === 0;
    }

    /**
     * Check if event phase should occur (every 5 rounds)
     */
    shouldTriggerEvent() {
        return this.currentRound % 5 === 0;
    }

    /**
     * Save game state to localStorage
     */
    save() {
        const saveData = {
            currentRound: this.currentRound,
            playerDeck: this.playerDeck.map(c => ({ color: c.color, shape: c.shape })),
            passives: this.passives.map(p => ({ id: p.id })),
            currentGimmick: this.currentGimmick ? { id: this.currentGimmick.id } : null
        };
        localStorage.setItem('cardBattleGameState', JSON.stringify(saveData));
    }

    /**
     * Load game state from localStorage
     */
    load() {
        const saveData = localStorage.getItem('cardBattleGameState');
        if (saveData) {
            try {
                const data = JSON.parse(saveData);
                this.currentRound = data.currentRound || 1;
                this.playerDeck = data.playerDeck.map(c => new Card(c.color, c.shape));
                // Passives and gimmicks would need to be reconstructed from IDs
                // For simplicity, we'll skip loading those for now
                return true;
            } catch (e) {
                console.error('Failed to load game state:', e);
                return false;
            }
        }
        return false;
    }

    /**
     * Clear saved game
     */
    clearSave() {
        localStorage.removeItem('cardBattleGameState');
    }
}

// Global game state instance
let gameState = new GameState();
