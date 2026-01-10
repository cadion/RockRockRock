/**
 * Main Game Controller
 * Coordinates all game phases and manages game flow
 */

// DOM Elements
let currentRoundEl, deckCountEl;
let gimmickPhaseEl, gimmickAnnouncementEl, continueFromGimmickBtn;
let gameOverEl, finalRoundEl, restartButtonEl;

/**
 * Initialize game
 */
function initGame() {
    // Get DOM elements
    currentRoundEl = document.getElementById('currentRound');
    deckCountEl = document.getElementById('deckCount');
    gimmickPhaseEl = document.getElementById('gimmickPhase');
    gimmickAnnouncementEl = document.getElementById('gimmickAnnouncement');
    continueFromGimmickBtn = document.getElementById('continueFromGimmick');
    gameOverEl = document.getElementById('gameOver');
    finalRoundEl = document.getElementById('finalRound');
    restartButtonEl = document.getElementById('restartButton');

    // Initialize phase UIs
    initBattlePhaseUI();
    initCardPickPhaseUI();
    initEventPhaseUI();

    // Setup event listeners
    continueFromGimmickBtn.addEventListener('click', proceedAfterGimmickPhase);
    restartButtonEl.addEventListener('click', restartGame);

    // Start game
    startGame();
}

/**
 * Start new game
 */
function startGame() {
    gameState.reset();
    updateHeader();
    startNextRound();
}

/**
 * Start next round
 */
function startNextRound() {
    updateHeader();

    // Check if player has enough cards
    if (gameState.getDeckCount() < 5) {
        // Not enough cards, game over
        showGameOver();
        return;
    }

    // Start battle phase
    startBattle();
}

/**
 * Update header display
 */
function updateHeader() {
    currentRoundEl.textContent = gameState.currentRound;
    deckCountEl.textContent = gameState.getDeckCount();
}

/**
 * Hide all phase screens
 */
function hideAllPhases() {
    const phases = document.querySelectorAll('.phase-screen');
    phases.forEach(phase => phase.classList.remove('active'));
}

/**
 * Start gimmick phase (announcement)
 */
function startGimmickPhase() {
    // Generate new gimmick
    const newGimmick = getRandomGimmick();
    gameState.setGimmick(newGimmick);

    // Show announcement
    hideAllPhases();
    gimmickPhaseEl.classList.add('active');

    gimmickAnnouncementEl.innerHTML = `
        <div style="font-size: 1.5rem; font-weight: 600; margin-bottom: 1rem;">
            ${newGimmick.name}
        </div>
        <div style="font-size: 1.125rem;">
            ${newGimmick.description}
        </div>
    `;
}

/**
 * Proceed after gimmick phase
 */
function proceedAfterGimmickPhase() {
    // Check if event phase also needed
    if (gameState.shouldTriggerEvent()) {
        startEventPhase();
    } else {
        gameState.nextRound();
        startNextRound();
    }
}

/**
 * Show game over screen
 */
function showGameOver() {
    hideAllPhases();
    gameOverEl.classList.add('active');

    const roundSpan = finalRoundEl.querySelector('span');
    roundSpan.textContent = gameState.currentRound;
}

/**
 * Restart game
 */
function restartGame() {
    gameState.clearSave();
    startGame();
}

/**
 * Continue to next round after all phases
 */
function continueToNextRound() {
    gameState.nextRound();
    startNextRound();
}

// Initialize game when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGame);
} else {
    initGame();
}
