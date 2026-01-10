/**
 * Battle Phase Logic
 * Handles card selection, field placement, and battle resolution
 */

// UI Elements
let battlePhaseEl, playerHandEl, playerFieldEl, enemyFieldEl, submitButtonEl;
let gimmickDisplayEl, passiveDisplayEl;

/**
 * Initialize battle phase UI elements
 */
function initBattlePhaseUI() {
    battlePhaseEl = document.getElementById('battlePhase');
    playerHandEl = document.getElementById('playerHand');
    playerFieldEl = document.getElementById('playerField');
    enemyFieldEl = document.getElementById('enemyField');
    submitButtonEl = document.getElementById('submitButton');
    gimmickDisplayEl = document.getElementById('gimmickDisplay');
    passiveDisplayEl = document.getElementById('passiveDisplay');

    submitButtonEl.addEventListener('click', handleBattleSubmit);
}

/**
 * Start a new battle
 */
function startBattle() {
    // Generate enemy cards
    gameState.enemyField = generateEnemyCards(gameState.currentGimmick);

    // Draw player hand (5 cards)
    gameState.drawHand(5);

    // Reset field and selections
    gameState.playerField = [];
    gameState.selectedCards = [];

    // Render UI
    renderBattlePhase();
}

/**
 * Render the battle phase
 */
function renderBattlePhase() {
    renderGimmick();
    renderPassives();
    renderEnemyField();
    renderPlayerField();
    renderPlayerHand();
    updateSubmitButton();
}

/**
 * Render gimmick display
 */
function renderGimmick() {
    if (gameState.currentGimmick) {
        gimmickDisplayEl.innerHTML = `
            <div class="gimmick-text">⚡ ${gameState.currentGimmick.description}</div>
        `;
    } else {
        gimmickDisplayEl.innerHTML = `
            <div class="gimmick-text">기본 규칙</div>
        `;
    }
}

/**
 * Render passives
 */
function renderPassives() {
    passiveDisplayEl.innerHTML = '';

    if (gameState.passives.length === 0) {
        passiveDisplayEl.innerHTML = '<div style="color: var(--text-muted);">패시브 없음</div>';
        return;
    }

    gameState.passives.forEach(passive => {
        const passiveEl = document.createElement('div');
        passiveEl.className = 'passive-emblem';
        passiveEl.innerHTML = `
            ${passive.icon}
            <div class="passive-tooltip">${passive.description}</div>
        `;
        passiveDisplayEl.appendChild(passiveEl);
    });
}

/**
 * Render enemy field
 */
function renderEnemyField() {
    enemyFieldEl.innerHTML = '';

    gameState.enemyField.forEach(card => {
        const cardEl = createCardElement(card, false);
        enemyFieldEl.appendChild(cardEl);
    });
}

/**
 * Render player field (selected cards)
 */
function renderPlayerField() {
    playerFieldEl.innerHTML = '';

    const enemyCount = gameState.enemyField.length;

    for (let i = 0; i < enemyCount; i++) {
        if (i < gameState.playerField.length) {
            const card = gameState.playerField[i];
            const cardEl = createCardElement(card, true);
            cardEl.classList.add('selected');
            cardEl.addEventListener('click', () => handleFieldCardClick(i));
            playerFieldEl.appendChild(cardEl);
        } else {
            // Empty slot
            const emptySlot = document.createElement('div');
            emptySlot.className = 'card disabled';
            emptySlot.style.opacity = '0.3';
            emptySlot.innerHTML = '<div style="font-size: 2rem;">?</div>';
            playerFieldEl.appendChild(emptySlot);
        }
    }
}

/**
 * Render player hand
 */
function renderPlayerHand() {
    playerHandEl.innerHTML = '';

    gameState.playerHand.forEach((card, index) => {
        const cardEl = createCardElement(card, true);

        // Check if this card is already in field
        const inField = gameState.playerField.findIndex(c => c.id === card.id) !== -1;

        if (inField) {
            cardEl.classList.add('disabled');
        } else {
            cardEl.addEventListener('click', () => handleHandCardClick(index));
        }

        playerHandEl.appendChild(cardEl);
    });
}

/**
 * Create a card DOM element
 */
function createCardElement(card, interactive = true) {
    const cardEl = document.createElement('div');
    cardEl.className = 'card';
    cardEl.setAttribute('data-color', card.color);
    cardEl.setAttribute('data-shape', card.shape);

    cardEl.innerHTML = `
        <div class="card-shape">${card.getSymbol()}</div>
        <div class="card-color-indicator"></div>
    `;

    return cardEl;
}

/**
 * Handle hand card click
 */
function handleHandCardClick(handIndex) {
    const card = gameState.playerHand[handIndex];
    const requiredCount = gameState.enemyField.length;

    // Check if card is already in field
    const fieldIndex = gameState.playerField.findIndex(c => c.id === card.id);

    if (fieldIndex !== -1) {
        // Already in field, do nothing (can't reselect from here)
        return;
    }

    // Add to first empty slot in field
    if (gameState.playerField.length < requiredCount) {
        gameState.playerField.push(card);
        renderBattlePhase();
    }
}

/**
 * Handle field card click (deselect)
 */
function handleFieldCardClick(fieldIndex) {
    // Remove card from field
    gameState.playerField.splice(fieldIndex, 1);
    renderBattlePhase();
}

/**
 * Update submit button state
 */
function updateSubmitButton() {
    const requiredCount = gameState.enemyField.length;
    const filled = gameState.playerField.length === requiredCount;

    submitButtonEl.disabled = !filled;
}

/**
 * Handle battle submit
 */
function handleBattleSubmit() {
    // Compare cards and determine winner
    const results = compareAllCards();

    // Count wins
    let playerWins = 0;
    let enemyWins = 0;
    let draws = 0;

    results.forEach(result => {
        if (result === 1) playerWins++;
        else if (result === -1) enemyWins++;
        else draws++;
    });

    const playerVictory = playerWins > enemyWins;

    // IMPORTANT GAME RULE:
    // - Used cards (submitted in battle) return to the deck
    // - ONLY unused cards (not submitted) are permanently removed
    const unusedCards = gameState.playerHand.filter(c =>
        !gameState.playerField.find(fc => fc.id === c.id)
    );

    // Only unused cards are lost and need to be replenished
    gameState.cardsLostLastBattle = unusedCards.length;

    // Remove ONLY unused cards from deck permanently
    gameState.removeCardsFromDeck(unusedCards);

    // Show battle result
    showBattleResult(playerVictory, results);
}

/**
 * Compare all cards in field
 */
function compareAllCards() {
    const results = [];

    for (let i = 0; i < gameState.playerField.length; i++) {
        const playerCard = gameState.playerField[i];
        const enemyCard = gameState.enemyField[i];

        let result = null;

        // 1. Check gimmick effects (if any affect comparison)
        // Currently gimmicks only affect card generation, not comparison

        // 2. Check passive effects
        result = applyPassiveEffects(playerCard, enemyCard, i, gameState.playerField, gameState.passives);

        // 3. Apply normal rock-paper-scissors logic
        if (result === null) {
            result = compareShapes(playerCard.shape, enemyCard.shape);
        }

        results.push(result);
    }

    return results;
}

/**
 * Show battle result screen
 */
function showBattleResult(playerVictory, results) {
    const resultScreen = document.getElementById('battleResult');
    const resultTitle = document.getElementById('resultTitle');
    const battleDetails = document.getElementById('battleDetails');

    // Set title
    if (playerVictory) {
        resultTitle.textContent = '승리!';
        resultTitle.className = 'result-title win';
    } else {
        resultTitle.textContent = '패배...';
        resultTitle.className = 'result-title lose';
    }

    // Show comparison details
    battleDetails.innerHTML = '';
    results.forEach((result, index) => {
        const playerCard = gameState.playerField[index];
        const enemyCard = gameState.enemyField[index];

        const comparisonEl = document.createElement('div');
        comparisonEl.className = 'battle-comparison';

        const playerCardEl = createCardElement(playerCard, false);
        const enemyCardEl = createCardElement(enemyCard, false);

        let resultText = '';
        let resultClass = '';
        if (result === 1) {
            resultText = '승';
            resultClass = 'win';
            playerCardEl.classList.add('win');
            enemyCardEl.classList.add('lose');
        } else if (result === -1) {
            resultText = '패';
            resultClass = 'lose';
            playerCardEl.classList.add('lose');
            enemyCardEl.classList.add('win');
        } else {
            resultText = '무';
            resultClass = 'draw';
            playerCardEl.classList.add('draw');
            enemyCardEl.classList.add('draw');
        }

        comparisonEl.innerHTML = '';
        comparisonEl.appendChild(playerCardEl);
        comparisonEl.innerHTML += `<div class="comparison-result ${resultClass}">${resultText}</div>`;
        comparisonEl.appendChild(enemyCardEl);

        battleDetails.appendChild(comparisonEl);
    });

    // Show result screen
    hideAllPhases();
    resultScreen.classList.add('active');

    // Handle continue button
    document.getElementById('continueButton').onclick = () => {
        if (playerVictory) {
            // Continue to next phase
            proceedToNextPhase();
        } else {
            // Game over
            showGameOver();
        }
    };
}

/**
 * Proceed to next phase after battle
 */
function proceedToNextPhase() {
    // Next phase is card pick
    startCardPickPhase();
}
