/**
 * Event Phase Logic
 * Handles passive selection events
 */

let eventPhaseEl, passiveOptionsEl, skipPassiveButtonEl;
let replacePassivePhaseEl, currentPassivesEl;
let selectedEventPassive = null;

/**
 * Initialize event phase UI
 */
function initEventPhaseUI() {
    eventPhaseEl = document.getElementById('eventPhase');
    passiveOptionsEl = document.getElementById('passiveOptions');
    skipPassiveButtonEl = document.getElementById('skipPassive');
    replacePassivePhaseEl = document.getElementById('replacePassivePhase');
    currentPassivesEl = document.getElementById('currentPassives');

    skipPassiveButtonEl.addEventListener('click', handleSkipPassive);
}

/**
 * Start event phase (passive selection)
 */
function startEventPhase() {
    selectedEventPassive = null;

    // Generate 2 random passives
    const passiveOptions = getRandomPassives(2);

    renderEventPhase(passiveOptions);
}

/**
 * Render event phase
 */
function renderEventPhase(passiveOptions) {
    hideAllPhases();
    eventPhaseEl.classList.add('active');

    passiveOptionsEl.innerHTML = '';

    passiveOptions.forEach(passive => {
        const optionEl = document.createElement('div');
        optionEl.className = 'passive-option';
        optionEl.innerHTML = `
            <div style="font-size: 2rem; margin-bottom: 0.5rem;">${passive.icon}</div>
            <div style="font-weight: 600; margin-bottom: 0.5rem;">${passive.name}</div>
            <div style="font-size: 0.875rem; color: var(--text-secondary);">${passive.description}</div>
        `;

        optionEl.addEventListener('click', () => handlePassiveSelect(passive, optionEl));

        passiveOptionsEl.appendChild(optionEl);
    });
}

/**
 * Handle passive selection
 */
function handlePassiveSelect(passive, optionEl) {
    selectedEventPassive = passive;

    // Update UI
    const allOptions = passiveOptionsEl.children;
    for (let i = 0; i < allOptions.length; i++) {
        allOptions[i].classList.remove('selected');
    }
    optionEl.classList.add('selected');

    // Check if player has 2 passives already
    if (gameState.passives.length >= 2) {
        // Need to replace one
        showReplacePassivePhase();
    } else {
        // Can add directly
        gameState.addPassive(passive);
        proceedAfterEvent();
    }
}

/**
 * Handle skip passive
 */
function handleSkipPassive() {
    selectedEventPassive = null;
    proceedAfterEvent();
}

/**
 * Show replace passive phase
 */
function showReplacePassivePhase() {
    hideAllPhases();
    replacePassivePhaseEl.classList.add('active');

    currentPassivesEl.innerHTML = '';

    gameState.passives.forEach(passive => {
        const passiveEl = document.createElement('div');
        passiveEl.className = 'passive-option';
        passiveEl.innerHTML = `
            <div style="font-size: 2rem; margin-bottom: 0.5rem;">${passive.icon}</div>
            <div style="font-weight: 600; margin-bottom: 0.5rem;">${passive.name}</div>
            <div style="font-size: 0.875rem; color: var(--text-secondary);">${passive.description}</div>
        `;

        passiveEl.addEventListener('click', () => handleReplacePassive(passive));

        currentPassivesEl.appendChild(passiveEl);
    });
}

/**
 * Handle replace passive
 */
function handleReplacePassive(oldPassive) {
    if (selectedEventPassive) {
        gameState.replacePassive(oldPassive.id, selectedEventPassive);
    }
    proceedAfterEvent();
}

/**
 * Proceed after event phase
 */
function proceedAfterEvent() {
    gameState.nextRound();
    startNextRound();
}
