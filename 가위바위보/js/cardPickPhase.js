/**
 * Card Pick Phase Logic
 * Handles card selection after battle
 */

let cardPickPhaseEl, cardPickOptionsEl, confirmPickButtonEl, pickInstructionsEl;
let selectedPickCards = [];

/**
 * Initialize card pick phase UI
 */
function initCardPickPhaseUI() {
    cardPickPhaseEl = document.getElementById('cardPickPhase');
    cardPickOptionsEl = document.getElementById('cardPickOptions');
    confirmPickButtonEl = document.getElementById('confirmPickButton');
    pickInstructionsEl = document.getElementById('pickInstructions');

    confirmPickButtonEl.addEventListener('click', handleConfirmPick);
}

/**
 * Start card pick phase
 */
function startCardPickPhase() {
    const cardsLost = gameState.cardsLostLastBattle;

    selectedPickCards = [];

    if (cardsLost === 0) {
        // No cards lost, proceed directly
        proceedAfterCardPick();
        return;
    }

    renderCardPickPhase(cardsLost);
}

/**
 * Render card pick phase
 */
function renderCardPickPhase(cardsLost) {
    hideAllPhases();
    cardPickPhaseEl.classList.add('active');

    // Determine how many cards to show and pick
    let cardsToShow, cardsToPick, remainingPicks = cardsLost;

    if (cardsLost <= 4) {
        cardsToShow = cardsLost * 2;
        cardsToPick = cardsLost;
    } else {
        // Multiple rounds of picking
        cardsToShow = 8;
        cardsToPick = 4;
    }

    pickInstructionsEl.textContent = `${cardsToPick}개의 카드를 선택하세요 (${cardsLost}개 보충 중)`;

    // Generate random cards
    const availableCards = [];
    for (let i = 0; i < cardsToShow; i++) {
        availableCards.push(createRandomCard());
    }

    // Render cards
    cardPickOptionsEl.innerHTML = '';
    availableCards.forEach((card, index) => {
        const cardEl = createCardElement(card, true);
        cardEl.addEventListener('click', () => handlePickCardClick(index, card, cardsToPick));
        cardPickOptionsEl.appendChild(cardEl);
    });

    updateConfirmPickButton(cardsToPick);
}

/**
 * Handle pick card click
 */
function handlePickCardClick(index, card, maxPicks) {
    // Check if already selected
    const selectedIndex = selectedPickCards.findIndex(c => c.id === card.id);

    if (selectedIndex !== -1) {
        // Deselect
        selectedPickCards.splice(selectedIndex, 1);
    } else {
        // Select if not at max
        if (selectedPickCards.length < maxPicks) {
            selectedPickCards.push(card);
        }
    }

    // Update UI
    const cardEls = cardPickOptionsEl.children;
    for (let i = 0; i < cardEls.length; i++) {
        const cardEl = cardEls[i];
        const cardAtIndex = cardPickOptionsEl.children[i].__card;

        if (selectedPickCards.find(c => c.id === card.id) && i === index) {
            cardEl.classList.add('selected');
        } else if (i === index) {
            cardEl.classList.remove('selected');
        }
    }

    // Store card reference on element
    cardEls[index].__card = card;

    // Re-render to show selection
    renderPickSelection(maxPicks);
    updateConfirmPickButton(maxPicks);
}

/**
 * Render pick selection states
 */
function renderPickSelection(maxPicks) {
    const cardEls = cardPickOptionsEl.children;

    for (let i = 0; i < cardEls.length; i++) {
        const cardEl = cardEls[i];
        const card = cardEl.__card;

        cardEl.classList.remove('selected');

        if (selectedPickCards.find(c => c && card && c.id === card.id)) {
            cardEl.classList.add('selected');
        }
    }
}

/**
 * Update confirm pick button
 */
function updateConfirmPickButton(requiredPicks) {
    confirmPickButtonEl.disabled = selectedPickCards.length !== requiredPicks;
}

/**
 * Handle confirm pick
 */
function handleConfirmPick() {
    // Add selected cards to deck
    gameState.addCardsToDeck(selectedPickCards);

    // Update cards lost count
    gameState.cardsLostLastBattle -= selectedPickCards.length;

    // Check if need more picks
    if (gameState.cardsLostLastBattle > 0) {
        // Continue picking
        startCardPickPhase();
    } else {
        // Done picking
        proceedAfterCardPick();
    }
}

/**
 * Proceed after card pick phase
 */
function proceedAfterCardPick() {
    // Check if gimmick phase needed
    if (gameState.shouldApplyGimmick()) {
        startGimmickPhase();
    }
    // Check if event phase needed
    else if (gameState.shouldTriggerEvent()) {
        startEventPhase();
    }
    // Otherwise, advance to next round
    else {
        gameState.nextRound();
        startNextRound();
    }
}
